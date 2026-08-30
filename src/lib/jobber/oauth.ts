import "server-only";
import { randomBytes } from "node:crypto";
import { getJobberConfig, JOBBER_AUTHORIZE_URL, JOBBER_TOKEN_URL } from "./config";

/**
 * Standard OAuth 2.0 authorization-code flow against Jobber's identity
 * server. This part of the protocol is stable and documented, so it's safe
 * to implement ahead of the GraphQL layer — unlike specific mutations,
 * which must be verified against Jobber's current schema before use.
 */

export function generateOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function buildJobberAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = getJobberConfig();

  const url = new URL(JOBBER_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);

  return url.toString();
}

export type JobberTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
};

export async function exchangeCodeForTokens(code: string): Promise<JobberTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getJobberConfig();

  const res = await fetch(JOBBER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!res.ok) {
    throw new Error(`Jobber token exchange failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export async function refreshJobberTokens(
  refreshToken: string,
): Promise<JobberTokenResponse> {
  const { clientId, clientSecret } = getJobberConfig();

  const res = await fetch(JOBBER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Jobber token refresh failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}
