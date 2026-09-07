import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { settingsUpdateSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity-log";

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = settingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Please check the amounts entered." }, { status: 400 });
  }

  const before = await prisma.referralSettings.findUnique({ where: { id: "singleton" } });

  const settings = await prisma.referralSettings.upsert({
    where: { id: "singleton" },
    update: {
      referredDiscountAmount: parsed.data.referredDiscountAmount,
      referrerCreditAmount: parsed.data.referrerCreditAmount,
      referrerGiftCardAmount: parsed.data.referrerGiftCardAmount,
      updatedByAdminId: session.adminId,
    },
    create: {
      id: "singleton",
      referredDiscountAmount: parsed.data.referredDiscountAmount,
      referrerCreditAmount: parsed.data.referrerCreditAmount,
      referrerGiftCardAmount: parsed.data.referrerGiftCardAmount,
      updatedByAdminId: session.adminId,
    },
  });

  await logActivity({
    admin: session,
    action: "SETTINGS_CHANGED",
    targetType: "ReferralSettings",
    targetId: settings.id,
    description: "Referral reward settings changed",
    metadata: {
      before: before
        ? {
            referredDiscountAmount: before.referredDiscountAmount.toString(),
            referrerCreditAmount: before.referrerCreditAmount.toString(),
            referrerGiftCardAmount: before.referrerGiftCardAmount.toString(),
          }
        : null,
      after: {
        referredDiscountAmount: settings.referredDiscountAmount.toString(),
        referrerCreditAmount: settings.referrerCreditAmount.toString(),
        referrerGiftCardAmount: settings.referrerGiftCardAmount.toString(),
      },
    },
  });

  return NextResponse.json({ ok: true, settings });
}
