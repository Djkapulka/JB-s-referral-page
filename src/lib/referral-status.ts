import "server-only";
import { prisma } from "@/lib/db";
import { earnRewardForReferral } from "@/lib/rewards";
import type { ReferralStatus } from "@/generated/prisma/client";

export async function updateReferralStatus({
  referralId,
  toStatus,
  actor,
  note,
  actualJobValue,
  estimatedJobValue,
}: {
  referralId: string;
  toStatus: ReferralStatus;
  actor: string;
  note?: string;
  actualJobValue?: number;
  estimatedJobValue?: number;
}) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.referral.findUniqueOrThrow({
      where: { id: referralId },
    });

    const updated = await tx.referral.update({
      where: { id: referralId },
      data: {
        status: toStatus,
        ...(actualJobValue !== undefined && { actualJobValue }),
        ...(estimatedJobValue !== undefined && { estimatedJobValue }),
      },
    });

    await tx.referralEvent.create({
      data: {
        referralId,
        eventType: "STATUS_CHANGE",
        fromStatus: current.status,
        toStatus,
        note,
        actor,
      },
    });

    if (toStatus === "JOB_COMPLETED") {
      await earnRewardForReferral(referralId, tx);
    }

    if (toStatus === "REWARD_PAID") {
      await tx.reward.updateMany({
        where: { referralId },
        data: { status: "PAID", paidAt: new Date() },
      });
    }

    return updated;
  });
}
