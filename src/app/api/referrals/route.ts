import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { referralFormSchema } from "@/lib/validation";
import { checkReferralRateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";

const DUPLICATE_WINDOW_DAYS = 30;

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

  const parsed = referralFormSchema.safeParse(body);
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

  // Honeypot: a real visitor never fills this hidden field in.
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

  const referrer = await prisma.customer.findUnique({
    where: { referralCode: data.referralCode },
  });

  // Treat an inactive link identically to a nonexistent one — the public
  // page already hides the form for these, this is the server-side backstop
  // against a direct API call bypassing that UI. Same message either way so
  // the response never reveals whether a code exists but was deactivated.
  if (!referrer || !referrer.isActive) {
    return NextResponse.json({ message: "Referral link not found." }, { status: 404 });
  }

  const since = new Date();
  since.setDate(since.getDate() - DUPLICATE_WINDOW_DAYS);

  const duplicate = await prisma.referral.findFirst({
    where: {
      createdAt: { gte: since },
      OR: [
        { leadPhone: data.leadPhone },
        { leadEmail: { equals: data.leadEmail, mode: "insensitive" } },
      ],
    },
  });

  if (duplicate) {
    return NextResponse.json(
      { message: "This referral was already submitted recently." },
      { status: 409 },
    );
  }

  const consentText =
    "Referrer confirmed the lead consented to be contacted by phone, text, or email about this referral.";

  await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      leadFirstName: data.leadFirstName,
      leadLastName: data.leadLastName,
      leadPhone: data.leadPhone,
      leadEmail: data.leadEmail,
      leadAddress: data.leadAddress,
      leadCity: data.leadCity,
      leadZip: data.leadZip,
      serviceRequested: data.serviceRequested,
      consentGiven: data.consentGiven,
      consentText,
      submittedIp: ip,
      events: {
        create: {
          eventType: "STATUS_CHANGE",
          toStatus: "SUBMITTED",
          actor: "system",
          note: "Referral submitted via public form.",
        },
      },
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
