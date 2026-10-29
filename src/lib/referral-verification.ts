import "server-only";
import { prisma } from "@/lib/db";
import { generateReferralCode } from "@/lib/referral-code";
import { earnRewardForReferral } from "@/lib/rewards";

const SUCCESS_STATUSES = ["JOB_COMPLETED", "REWARD_EARNED", "REWARD_PAID"] as const;

type VerifyInput =
  | { customerId: string }
  | {
      createCustomer: {
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
      };
    };

/**
 * Attaches a referral that needed verification to a confirmed customer —
 * either an existing one an admin picked, or a brand-new one created from
 * the self-reported referrer info. If the referral's job was already
 * completed before verification, this also grants the reward now that the
 * referrer is confirmed (rewards are never auto-issued for an unverified
 * referrer — see earnRewardForReferral).
 */
export async function verifyReferral(referralId: string, input: VerifyInput, actor: string) {
  return prisma.$transaction(async (tx) => {
    let customer;
    let createdNewCustomer = false;

    if ("customerId" in input) {
      customer = await tx.customer.findUniqueOrThrow({
        where: { id: input.customerId },
      });
    } else {
      let referralCode = generateReferralCode(input.createCustomer.firstName);
      for (let attempt = 0; attempt < 5; attempt++) {
        const existing = await tx.customer.findUnique({ where: { referralCode } });
        if (!existing) break;
        referralCode = generateReferralCode(input.createCustomer.firstName);
      }

      customer = await tx.customer.create({
        data: {
          firstName: input.createCustomer.firstName,
          lastName: input.createCustomer.lastName,
          email: input.createCustomer.email,
          phone: input.createCustomer.phone,
          referralCode,
        },
      });
      createdNewCustomer = true;
    }

    const updated = await tx.referral.update({
      where: { id: referralId },
      data: {
        referrerId: customer.id,
        referrerVerificationStatus: "VERIFIED",
      },
    });

    await tx.referralEvent.create({
      data: {
        referralId,
        eventType: "NOTE",
        note: createdNewCustomer
          ? `Referrer verified and attached to new customer ${customer.firstName} ${customer.lastName} (${customer.referralCode}).`
          : `Referrer verified and attached to existing customer ${customer.firstName} ${customer.lastName} (${customer.referralCode}).`,
        actor,
      },
    });

    let rewardGranted = false;
    if ((SUCCESS_STATUSES as readonly string[]).includes(updated.status)) {
      const reward = await earnRewardForReferral(referralId, tx);
      rewardGranted = reward != null;
    }

    return { referral: updated, customer, createdNewCustomer, rewardGranted };
  });
}
