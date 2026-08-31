import "server-only";
import { headers } from "next/headers";

/**
 * Single source of truth for the app's public origin. Prefers
 * NEXT_PUBLIC_BASE_URL when it's configured; otherwise derives the origin
 * from the current request so referral links and share text are still
 * correct on a fresh deploy (e.g. a Vercel preview or *.vercel.app URL)
 * before that env var has been set. Never hard-code a domain elsewhere —
 * route everything through this function so changing domains later (e.g.
 * connecting a custom domain) only means updating one env var.
 */
export async function getBaseUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const proto =
    headersList.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");

  if (!host) {
    throw new Error(
      "Unable to determine the current host — set NEXT_PUBLIC_BASE_URL.",
    );
  }

  return `${proto}://${host}`;
}

/** Builds a customer's full public referral URL, e.g. https://example.com/r/DENNIS-K8X2. */
export async function getReferralUrl(referralCode: string): Promise<string> {
  const baseUrl = await getBaseUrl();
  return `${baseUrl}/r/${referralCode}`;
}
