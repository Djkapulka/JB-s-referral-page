import "server-only";
import { prisma } from "@/lib/db";

export function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed || null;
}

export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  // Treat a leading US country code as equivalent to the bare 10-digit
  // number, so "+1 (555) 555-5555" and "555-555-5555" match.
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

/**
 * Attempts to match a self-reported referrer to an existing, active
 * customer by normalized email or phone. Only returns a match when exactly
 * one distinct customer matches — an ambiguous or absent match is treated
 * as "no reliable match" (returns null) rather than guessing, per the
 * public-form requirement that credit is never attached on an unverified
 * basis.
 */
export async function findReferrerMatch(
  email?: string | null,
  phone?: string | null,
) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedEmail && !normalizedPhone) return null;

  const candidates = await prisma.customer.findMany({
    where: {
      isActive: true,
      OR: [
        ...(normalizedEmail ? [{ email: { not: null } }] : []),
        ...(normalizedPhone ? [{ phone: { not: null } }] : []),
      ],
    },
  });

  const matchedIds = new Set<string>();
  let matched: (typeof candidates)[number] | null = null;

  for (const candidate of candidates) {
    const emailMatch =
      !!normalizedEmail && normalizeEmail(candidate.email) === normalizedEmail;
    const phoneMatch =
      !!normalizedPhone && normalizePhone(candidate.phone) === normalizedPhone;
    if (emailMatch || phoneMatch) {
      matchedIds.add(candidate.id);
      matched = candidate;
    }
  }

  return matchedIds.size === 1 ? matched : null;
}
