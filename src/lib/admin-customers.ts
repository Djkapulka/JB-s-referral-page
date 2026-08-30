import "server-only";
import { prisma } from "@/lib/db";

const SUCCESS_STATUSES = ["JOB_COMPLETED", "REWARD_EARNED", "REWARD_PAID"] as const;
const PENDING_STATUSES = [
  "SUBMITTED",
  "CONTACTED",
  "ESTIMATE_SENT",
  "BOOKED",
] as const;

export async function searchCustomers(query?: string) {
  const customers = await prisma.customer.findMany({
    where: query
      ? {
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { referralCode: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      referrals: { select: { status: true } },
      rewards: { select: { status: true, rewardAmount: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return customers.map((c) => summarizeCustomer(c));
}

export async function getCustomerDetail(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      referrals: { orderBy: { createdAt: "desc" } },
      rewards: true,
    },
  });
  if (!customer) return null;
  return { ...summarizeCustomer(customer), referrals: customer.referrals };
}

function summarizeCustomer<
  T extends {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    referralCode: string;
    createdAt: Date;
    referrals: { status: string }[];
    rewards: { status: string; rewardAmount: unknown }[];
  },
>(c: T) {
  const totalReferrals = c.referrals.length;
  const pendingReferrals = c.referrals.filter((r) =>
    (PENDING_STATUSES as readonly string[]).includes(r.status),
  ).length;
  const successfulReferrals = c.referrals.filter((r) =>
    (SUCCESS_STATUSES as readonly string[]).includes(r.status),
  ).length;
  const rewardsEarned = c.rewards
    .filter((r) => r.status === "EARNED" || r.status === "PAID")
    .reduce((sum, r) => sum + Number(r.rewardAmount), 0);
  const rewardsRedeemed = c.rewards
    .filter((r) => r.status === "PAID")
    .reduce((sum, r) => sum + Number(r.rewardAmount), 0);

  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    referralCode: c.referralCode,
    createdAt: c.createdAt,
    totalReferrals,
    pendingReferrals,
    successfulReferrals,
    rewardsEarned,
    rewardsRedeemed,
  };
}
