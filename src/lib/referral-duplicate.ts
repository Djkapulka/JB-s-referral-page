import "server-only";
import { prisma } from "@/lib/db";

const DUPLICATE_WINDOW_DAYS = 30;

/**
 * Looks for a referral submitted in the last 30 days for the same friend
 * (matched by phone or email), regardless of submission method or
 * referrer. Shared by both the personalized-link and public-form
 * submission routes so duplicate handling stays identical between them.
 */
export async function findRecentDuplicateReferral(
  leadPhone?: string | null,
  leadEmail?: string | null,
) {
  if (!leadPhone && !leadEmail) return null;

  const since = new Date();
  since.setDate(since.getDate() - DUPLICATE_WINDOW_DAYS);

  return prisma.referral.findFirst({
    where: {
      createdAt: { gte: since },
      OR: [
        ...(leadPhone ? [{ leadPhone }] : []),
        ...(leadEmail ? [{ leadEmail: { equals: leadEmail, mode: "insensitive" as const } }] : []),
      ],
    },
  });
}
