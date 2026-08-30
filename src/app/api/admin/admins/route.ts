import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession, hashPassword } from "@/lib/auth";

const createAdminSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: z.enum(["OWNER", "ADMIN"]),
});

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "OWNER") {
    return NextResponse.json(
      { message: "Only an owner can add new admin accounts." },
      { status: 403 },
    );
  }

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

  return NextResponse.json(
    { ok: true, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } },
    { status: 201 },
  );
}
