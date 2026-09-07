import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, requireOwnerSession } from "@/lib/auth";
import { passwordSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity-log";

const createAdminSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  password: passwordSchema,
  role: z.enum(["OWNER", "ADMIN"]),
});

export async function POST(req: NextRequest) {
  const check = await requireOwnerSession();
  if (!check.ok) {
    return NextResponse.json({ message: check.message }, { status: check.status });
  }
  const { session } = check;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = createAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const existing = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return NextResponse.json(
      { message: "An admin with that email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const admin = await prisma.adminUser.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
    },
  });

  await logActivity({
    admin: session,
    action: "ADMIN_CREATED",
    targetType: "AdminUser",
    targetId: admin.id,
    description: `Admin account created for ${admin.name} (${admin.email}, ${admin.role})`,
  });

  return NextResponse.json(
    { ok: true, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } },
    { status: 201 },
  );
}
