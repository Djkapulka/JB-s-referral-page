import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, createAdminSession } from "@/lib/auth";
import { checkReferralRateLimit } from "@/lib/rate-limit";

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const { success: withinRateLimit } = await checkReferralRateLimit(
    `admin-login:${ip}`,
  );
  if (!withinRateLimit) {
    return NextResponse.json(
      { message: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email },
  });

  // Always run bcrypt.compare, even for a missing user, so the response
  // timing doesn't reveal whether an email exists in the system.
  const passwordHash = admin?.passwordHash ?? "$2b$12$invalidsaltinvalidsaltinvalidsalt.invalidhash1234567890";
  const validPassword = await verifyPassword(parsed.data.password, passwordHash);

  if (!admin || !validPassword) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }

  await createAdminSession({
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
