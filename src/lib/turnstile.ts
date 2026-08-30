import "server-only";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verifies a Cloudflare Turnstile token server-side. When TURNSTILE_SECRET_KEY
 * isn't configured (local dev), verification is skipped and always passes —
 * this must be set before deploying publicly.
 */
export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "TURNSTILE_SECRET_KEY is not configured while running in production — bot protection is disabled.",
      );
    }
    return true;
  }

  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification request failed", err);
    return false;
  }
}
