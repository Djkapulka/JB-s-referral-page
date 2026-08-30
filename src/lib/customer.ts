import "server-only";
import { prisma } from "@/lib/db";

export async function getCustomerByReferralCode(code: string) {
  return prisma.customer.findUnique({
    where: { referralCode: code },
  });
}

const SUCCESS_STATUSES = ["JOB_COMPLETED", "REWARD_EARNED", "REWARD_PAID"] as const;

export async function getCustomerReferralSummary(customerId: string) {
  const [totalReferrals, referrals, rewards] = await Promise.all([
    prisma.referral.count({ where: { referrerId: customerId } }),
    prisma.referral.findMany({
      where: { referrerId: customerId, status: { in: [...SUCCESS_STATUSES] } },
      select: { id: true },
    }),
    prisma.reward.findMany({
      where: { customerId, status: { in: ["EARNED", "PAID"] } },
      select: { rewardAmount: true },
    }),
  ]);

  return {
    totalReferrals,
    completedReferrals: referrals.length,
    totalRewardsEarned: rewards.reduce((sum, r) => sum + Number(r.rewardAmount), 0),
  };
}
