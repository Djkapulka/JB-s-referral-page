import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, requireOwnerSession } from "@/lib/auth";
import { resetAdminPasswordSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity-log";

export async function POST(
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

  const parsed = resetAdminPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid password." },
      { status: 400 },
    );
  }

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ message: "Admin not found." }, { status: 404 });
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  await prisma.adminUser.update({
    where: { id },
    data: {
      passwordHash,
      mustChangePassword: parsed.data.requireChangeOnNextLogin,
    },
  });

  // Never log the password or its hash — only that a reset happened.
  await logActivity({
    admin: session,
    action: "ADMIN_PASSWORD_RESET",
    targetType: "AdminUser",
    targetId: target.id,
    description: `Password reset for ${target.name} (${target.email})`,
    metadata: { requireChangeOnNextLogin: parsed.data.requireChangeOnNextLogin },
  });

  return NextResponse.json({ ok: true });
}
