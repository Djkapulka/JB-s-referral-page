import "server-only";

/**
 * Phase 2 scaffolding. Nothing in this module makes a live call to Jobber —
 * it only prepares the OAuth plumbing so the integration can be wired up
 * later without restructuring the app. Do not add GraphQL mutations here
 * until the corresponding operation and scopes have been verified against
 * Jobber's current published schema.
 */
export const JOBBER_AUTHORIZE_URL = "https://api.getjobber.com/api/oauth/authorize";
export const JOBBER_TOKEN_URL = "https://api.getjobber.com/api/oauth/token";
export const JOBBER_GRAPHQL_URL = "https://api.getjobber.com/api/graphql";

export function isJobberConfigured(): boolean {
  return Boolean(
    process.env.JOBBER_CLIENT_ID &&
      process.env.JOBBER_CLIENT_SECRET &&
      process.env.JOBBER_REDIRECT_URI,
  );
}

export function getJobberConfig() {
  const clientId = process.env.JOBBER_CLIENT_ID;
  const clientSecret = process.env.JOBBER_CLIENT_SECRET;
  const redirectUri = process.env.JOBBER_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Jobber is not configured. Set JOBBER_CLIENT_ID, JOBBER_CLIENT_SECRET, and JOBBER_REDIRECT_URI.",
    );
  }

  return { clientId, clientSecret, redirectUri };
}
