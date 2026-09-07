import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwnerSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const check = await requireOwnerSession();
  if (!check.ok) {
    return NextResponse.json({ message: check.message }, { status: check.status });
  }
  const { session } = check;

  const { id } = await params;

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ message: "Admin not found." }, { status: 404 });
  }

  const updated = await prisma.adminUser.update({
    where: { id },
    data: { isActive: true },
  });

  await logActivity({
    admin: session,
    action: "ADMIN_REACTIVATED",
    targetType: "AdminUser",
    targetId: updated.id,
    description: `Admin account reactivated for ${updated.name} (${updated.email})`,
  });

  return NextResponse.json({ ok: true });
}
