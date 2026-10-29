import "server-only";
import { prisma } from "@/lib/db";
import type { ReferralStatus, ReferrerVerificationStatus } from "@/generated/prisma/client";

export async function searchReferrals({
  query,
  status,
  verification,
}: {
  query?: string;
  status?: ReferralStatus;
  verification?: ReferrerVerificationStatus;
}) {
  return prisma.referral.findMany({
    where: {
      ...(status && { status }),
      ...(verification && { referrerVerificationStatus: verification }),
      ...(query && {
        OR: [
          { leadFirstName: { contains: query, mode: "insensitive" } },
          { leadLastName: { contains: query, mode: "insensitive" } },
          { leadEmail: { contains: query, mode: "insensitive" } },
          { leadPhone: { contains: query, mode: "insensitive" } },
          { referrer: { firstName: { contains: query, mode: "insensitive" } } },
          { referrer: { lastName: { contains: query, mode: "insensitive" } } },
          { referrer: { referralCode: { contains: query, mode: "insensitive" } } },
          { referrerFirstName: { contains: query, mode: "insensitive" } },
          { referrerLastName: { contains: query, mode: "insensitive" } },
          { referrerEmail: { contains: query, mode: "insensitive" } },
          { referrerPhone: { contains: query, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      referrer: true,
      reward: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getReferralDetail(id: string) {
  return prisma.referral.findUnique({
    where: { id },
    include: {
      referrer: true,
      reward: true,
      events: { orderBy: { createdAt: "desc" } },
    },
  });
}
