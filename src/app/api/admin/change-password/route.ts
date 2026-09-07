import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAdminSession, getAdminSession, hashPassword, verifyPassword } from "@/lib/auth";
import { changeOwnPasswordSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
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

  const parsed = changeOwnPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const admin = await prisma.adminUser.findUniqueOrThrow({
    where: { id: session.adminId },
  });

  const validCurrent = await verifyPassword(parsed.data.currentPassword, admin.passwordHash);
  if (!validCurrent) {
    return NextResponse.json({ message: "Current password is incorrect." }, { status: 401 });
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash, mustChangePassword: false },
  });

  // Re-issue the session so mustChangePassword reflects the change
  // immediately rather than waiting for the token to be re-read next login.
  await createAdminSession(admin.id);

  return NextResponse.json({ ok: true });
}
