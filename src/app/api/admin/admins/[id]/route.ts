import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwnerSession } from "@/lib/auth";
import { editAdminSchema } from "@/lib/validation";
import { isLastActiveOwner } from "@/lib/admin-lifecycle";
import { logActivity } from "@/lib/activity-log";
import { Prisma } from "@/generated/prisma/client";

const HISTORY_BLOCKED_MESSAGE =
  "This admin has activity history and cannot be permanently deleted. Deactivate their account instead to preserve the audit trail.";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const check = await requireOwnerSession();
  if (!check.ok) {
    return NextResponse.json({ message: check.message }, { status: check.status });
  }
  const { session } = check;

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = editAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ message: "Admin not found." }, { status: 404 });
  }

  if (parsed.data.role !== "OWNER" && (await isLastActiveOwner(target))) {
    return NextResponse.json(
      {
        message:
          "This is the only active owner account — promote another admin to owner before changing this role.",
      },
      { status: 409 },
    );
  }

  if (parsed.data.email !== target.email) {
    const emailTaken = await prisma.adminUser.findUnique({
      where: { email: parsed.data.email },
    });
    if (emailTaken) {
      return NextResponse.json(
        { message: "An admin with that email already exists." },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.adminUser.update({
    where: { id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
    },
  });

  const before = { name: target.name, email: target.email, role: target.role };
  const after = { name: updated.name, email: updated.email, role: updated.role };

  await logActivity({
    admin: session,
    action: "ADMIN_EDITED",
    targetType: "AdminUser",
    targetId: updated.id,
    description: `Admin account edited for ${updated.name} (${updated.email})`,
    metadata: { before, after },
  });

  if (before.role !== after.role) {
    await logActivity({
      admin: session,
      action: "ADMIN_ROLE_CHANGED",
      targetType: "AdminUser",
      targetId: updated.id,
      description: `${updated.name}'s role changed from ${before.role} to ${after.role}`,
      metadata: { before: before.role, after: after.role },
    });
  }

  return NextResponse.json({
    ok: true,
    admin: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const check = await requireOwnerSession();
  if (!check.ok) {
    return NextResponse.json({ message: check.message }, { status: check.status });
  }
  const { session } = check;

  const { id } = await params;

  const target = await prisma.adminUser.findUnique({
    where: { id },
    include: { _count: { select: { activityLogs: true } } },
  });
  if (!target) {
    return NextResponse.json({ message: "Admin not found." }, { status: 404 });
  }

  if (await isLastActiveOwner(target)) {
    return NextResponse.json(
      {
        message:
          "This is the only active owner account and cannot be deleted — the application must always have at least one active owner.",
      },
      { status: 409 },
    );
  }

  if (target._count.activityLogs > 0) {
    return NextResponse.json({ message: HISTORY_BLOCKED_MESSAGE }, { status: 409 });
  }

  try {
    await prisma.adminUser.delete({ where: { id } });
  } catch (err) {
    // Belt-and-suspenders: ActivityLog.adminId is ON DELETE RESTRICT, so a
    // log entry written in the instant between the count check above and
    // this delete is still caught here.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json({ message: HISTORY_BLOCKED_MESSAGE }, { status: 409 });
    }
    throw err;
  }

  await logActivity({
    admin: session,
    action: "ADMIN_DELETED",
    targetType: "AdminUser",
    targetId: target.id,
    description: `Admin account permanently deleted for ${target.name} (${target.email})`,
  });

  return NextResponse.json({ ok: true });
}
