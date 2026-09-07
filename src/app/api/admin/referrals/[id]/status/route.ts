import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { statusUpdateSchema, REFERRAL_STATUS_LABELS } from "@/lib/validation";
import { updateReferralStatus } from "@/lib/referral-status";
import { logActivity } from "@/lib/activity-log";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = statusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid status update." }, { status: 400 });
  }

  try {
    const updated = await updateReferralStatus({
      referralId: id,
      toStatus: parsed.data.status,
      actor: `admin:${session.email}`,
      note: parsed.data.note,
      actualJobValue: parsed.data.actualJobValue,
      estimatedJobValue: parsed.data.estimatedJobValue,
    });

    const leadName = `${updated.leadFirstName} ${updated.leadLastName}`;
    const statusLabel = REFERRAL_STATUS_LABELS[updated.status];

    await logActivity({
      admin: session,
      action: "REFERRAL_STATUS_CHANGED",
      targetType: "Referral",
      targetId: updated.id,
      description: `Referral marked ${statusLabel} for ${leadName}`,
      metadata: { before: updated.fromStatus, after: updated.status },
    });

    if (updated.status === "JOB_COMPLETED") {
      const reward = await prisma.reward.findUnique({ where: { referralId: updated.id } });
      if (reward) {
        await logActivity({
          admin: session,
          action: "REWARD_STATUS_CHANGED",
          targetType: "Reward",
          targetId: reward.id,
          description: `Reward earned for ${leadName}'s referral ($${reward.rewardAmount})`,
          metadata: { status: reward.status, amount: reward.rewardAmount.toString() },
        });
      }
    }

    if (updated.status === "REWARD_PAID") {
      const reward = await prisma.reward.findUnique({ where: { referralId: updated.id } });
      if (reward) {
        await logActivity({
          admin: session,
          action: "REWARD_STATUS_CHANGED",
          targetType: "Reward",
          targetId: reward.id,
          description: `Reward marked paid for ${leadName}'s referral ($${reward.rewardAmount})`,
          metadata: { status: reward.status, amount: reward.rewardAmount.toString() },
        });
      }
    }

    return NextResponse.json({ ok: true, referral: updated });
  } catch (err) {
    console.error("Failed to update referral status", err);
    return NextResponse.json({ message: "Referral not found." }, { status: 404 });
  }
}
