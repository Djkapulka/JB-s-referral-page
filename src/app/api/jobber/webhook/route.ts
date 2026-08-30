import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Phase 2 stub. Jobber's exact webhook signature header/algorithm and event
 * payload shape must be confirmed against their current developer docs
 * before this does anything beyond verify-and-log — do not wire this up to
 * update Referral/Reward records until that's been checked.
 */

function isValidSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.JOBBER_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("base64");

  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  // NOTE: confirm the real header name Jobber sends before relying on this.
  const signature = req.headers.get("x-jobber-hmac-sha256");

  if (!isValidSignature(rawBody, signature)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  console.log("Received Jobber webhook (not yet processed):", rawBody.slice(0, 500));

  // TODO (Phase 2): parse the verified payload and call updateReferralStatus()
  // once the event shape has been confirmed against Jobber's current schema.

  return NextResponse.json({ ok: true });
}
