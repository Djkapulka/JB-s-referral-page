import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Returns the singleton reward-offer settings row, creating it with the
 * defaults from the schema on first read.
 */
export async function getReferralSettings() {
  return prisma.referralSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

/**
 * Creates (or returns the existing) Reward for a referral once its job is
 * completed. Reward amount is snapshotted from current settings at the
 * moment it's earned, so later offer changes don't retroactively change
 * rewards already promised to customers.
 *
 * Returns null without creating anything if the referral's referrer hasn't
 * been verified yet (referrerId is still null) — a referral submitted
 * through the public form with no reliable customer match must never earn
 * credit based solely on an unverified name, email, or phone number. Once
 * an admin verifies and attaches a customer, the verification flow calls
 * this again to grant the reward retroactively if the job was already done.
 */
export async function earnRewardForReferral(
  referralId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  const existing = await tx.reward.findUnique({ where: { referralId } });
  if (existing) return existing;

  const referral = await tx.referral.findUniqueOrThrow({
    where: { id: referralId },
  });

  if (!referral.referrerId) {
    return null;
  }

  const settings = await tx.referralSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return tx.reward.create({
    data: {
      referralId,
      customerId: referral.referrerId,
      rewardType: "SERVICE_CREDIT",
      rewardAmount: settings.referrerCreditAmount,
      status: "EARNED",
      earnedAt: new Date(),
    },
  });
}
