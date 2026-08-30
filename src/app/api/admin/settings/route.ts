import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { settingsUpdateSchema } from "@/lib/validation";

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

  return NextResponse.json({ ok: true, settings });
}
