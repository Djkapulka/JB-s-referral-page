import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    return NextResponse.json({ message: "Customer not found." }, { status: 404 });
  }

  // Reactivating never touches referralCode — the same URL simply starts
  // working again.
  const updated = await prisma.customer.update({
    where: { id },
    data: { isActive: true },
  });

  await logActivity({
    admin: session,
    action: "CUSTOMER_LINK_REACTIVATED",
    targetType: "Customer",
    targetId: updated.id,
    description: `Referral link reactivated for ${updated.firstName} ${updated.lastName} (${updated.referralCode})`,
  });

  return NextResponse.json({ ok: true, customer: updated });
}
