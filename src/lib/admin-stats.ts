import "server-only";
import { prisma } from "@/lib/db";

const CONVERTED_STATUSES = [
  "BOOKED",
  "JOB_COMPLETED",
  "REWARD_EARNED",
  "REWARD_PAID",
] as const;

export async function getDashboardStats() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalReferrals,
    leadsThisMonth,
    convertedCount,
    bookedRevenue,
    completedRevenue,
    rewardsOwed,
    rewardsPaid,
    topReferrers,
  ] = await Promise.all([
    prisma.referral.count(),
    prisma.referral.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.referral.count({ where: { status: { in: [...CONVERTED_STATUSES] } } }),
    prisma.referral.aggregate({
      where: { status: "BOOKED" },
      _sum: { estimatedJobValue: true },
    }),
    prisma.referral.aggregate({
      where: { status: { in: ["JOB_COMPLETED", "REWARD_EARNED", "REWARD_PAID"] } },
      _sum: { actualJobValue: true },
    }),
    prisma.reward.aggregate({
      where: { status: "EARNED" },
      _sum: { rewardAmount: true },
    }),
    prisma.reward.aggregate({
      where: { status: "PAID" },
      _sum: { rewardAmount: true },
    }),
    prisma.customer.findMany({
      take: 5,
      orderBy: { referrals: { _count: "desc" } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        referralCode: true,
        _count: { select: { referrals: true } },
        referrals: {
          where: { status: { in: [...CONVERTED_STATUSES] } },
          select: { id: true },
        },
      },
    }),
  ]);

  const conversionRate = totalReferrals > 0 ? (convertedCount / totalReferrals) * 100 : 0;

  return {
    totalReferrals,
    leadsThisMonth,
    conversionRate,
    bookedRevenue: Number(bookedRevenue._sum.estimatedJobValue ?? 0),
    completedRevenue: Number(completedRevenue._sum.actualJobValue ?? 0),
    rewardsOwed: Number(rewardsOwed._sum.rewardAmount ?? 0),
    rewardsPaid: Number(rewardsPaid._sum.rewardAmount ?? 0),
    topReferrers: topReferrers
      .filter((c) => c._count.referrals > 0)
      .map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        referralCode: c.referralCode,
        totalReferrals: c._count.referrals,
        convertedReferrals: c.referrals.length,
      })),
  };
}
