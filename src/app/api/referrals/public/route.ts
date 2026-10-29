import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicReferralFormSchema } from "@/lib/validation";
import { checkReferralRateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { findRecentDuplicateReferral } from "@/lib/referral-duplicate";
import { findReferrerMatch } from "@/lib/customer-matching";

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const { success: withinRateLimit } = await checkReferralRateLimit(ip);
  if (!withinRateLimit) {
    return NextResponse.json(
      { message: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = publicReferralFormSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return NextResponse.json(
      { message: "Please fix the highlighted fields.", fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Honeypot: a real visitor never fills this hidden field in. Return a
  // fake success so bots can't distinguish this from a real submission.
  if (data.companyWebsite) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const turnstileOk = await verifyTurnstileToken(data.turnstileToken, ip);
  if (!turnstileOk) {
    return NextResponse.json(
      { message: "We couldn't verify you're human. Please try again." },
      { status: 400 },
    );
  }

  const leadPhone = data.leadPhone || null;
  const leadEmail = data.leadEmail || null;

  const duplicate = await findRecentDuplicateReferral(leadPhone, leadEmail);
  if (duplicate) {
    return NextResponse.json(
      { message: "This referral was already submitted recently." },
      { status: 409 },
    );
  }

  // Attempt to match the referrer to an existing, active customer. Never
  // reveal the outcome of this match in the response — the submitter gets
  // the same generic confirmation either way (see requirement: never expose
  // whether an email/phone belongs to an existing customer).
  const match = await findReferrerMatch(data.referrerEmail, data.referrerPhone);

  const consentText =
    "Referrer confirmed they have permission to share their friend's contact information with JB's Exterior Cleaning for this referral.";

  await prisma.referral.create({
    data: {
      referrerId: match?.id ?? null,
      referrerVerificationStatus: match ? "VERIFIED" : "NEEDS_VERIFICATION",
      referrerFirstName: data.referrerFirstName,
      referrerLastName: data.referrerLastName,
      referrerEmail: data.referrerEmail || null,
      referrerPhone: data.referrerPhone || null,

      leadFirstName: data.leadFirstName,
      leadLastName: data.leadLastName,
      leadPhone,
      leadEmail,
      leadAddress: data.leadAddress || null,
      leadCity: data.leadCity || null,
      leadZip: data.leadZip || null,

      serviceRequested: data.serviceRequested,
      consentGiven: data.consentGiven,
      consentText,
      source: "public_referral_form",
      submittedIp: ip,
      events: {
        create: {
          eventType: "STATUS_CHANGE",
          toStatus: "SUBMITTED",
          actor: "system",
          note: "Referral submitted via the public Refer a Friend form.",
        },
      },
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
