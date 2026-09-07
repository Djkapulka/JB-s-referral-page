import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { Prisma } from "@/generated/prisma/client";

const HISTORY_BLOCKED_MESSAGE =
  "This customer has referral or reward history and cannot be permanently deleted. Deactivate their referral link instead to stop new referrals while preserving their records.";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      _count: { select: { referrals: true, rewards: true } },
    },
  });

  if (!customer) {
    return NextResponse.json({ message: "Customer not found." }, { status: 404 });
  }

  if (customer._count.referrals > 0 || customer._count.rewards > 0) {
    return NextResponse.json({ message: HISTORY_BLOCKED_MESSAGE }, { status: 409 });
  }

  try {
    await prisma.customer.delete({ where: { id } });
  } catch (err) {
    // Belt-and-suspenders: the referrals/rewards foreign keys are
    // ON DELETE RESTRICT at the database level, so even a referral created
    // in the instant between the count check above and this delete is
    // still caught here rather than silently corrupting data.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json({ message: HISTORY_BLOCKED_MESSAGE }, { status: 409 });
    }
    throw err;
  }

  await logActivity({
    admin: session,
    action: "CUSTOMER_DELETED",
    targetType: "Customer",
    targetId: customer.id,
    description: `Customer permanently deleted: ${customer.firstName} ${customer.lastName} (${customer.referralCode})`,
  });

  return NextResponse.json({ ok: true });
}
