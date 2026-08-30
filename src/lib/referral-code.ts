import { customAlphabet } from "nanoid";

// Unambiguous uppercase alphabet — no 0/O or 1/I confusion when a customer
// reads the code aloud or types it in by hand.
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/**
 * Builds a public-facing referral code like "DENNIS-K8X2Q7". Never derived
 * from or reversible to the internal customer UUID.
 */
export function generateReferralCode(firstName: string): string {
  const slug =
    firstName
      .normalize("NFKD")
      .replace(COMBINING_DIACRITICS, "")
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .slice(0, 10) || "FRIEND";

  return `${slug}-${nanoid()}`;
}
