import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "jbs_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short — set a strong value in your environment.",
    );
  }
  return new TextEncoder().encode(secret);
}

export type AdminSessionPayload = {
  adminId: string;
  email: string;
  name: string;
  role: "OWNER" | "ADMIN";
  mustChangePassword: boolean;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// The JWT only ever proves "this adminId authenticated and the token hasn't
// expired." Role, active status, and mustChangePassword are always read
// fresh from the database (see getAdminSession) rather than trusted from a
// potentially-stale token — so a deactivation or role change takes effect
// on the very next request, not just the next login.
export async function createAdminSession(adminId: string) {
  const token = await new SignJWT({ adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

async function getSessionAdminId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const adminId = (payload as { adminId?: unknown }).adminId;
    return typeof adminId === "string" ? adminId : null;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const adminId = await getSessionAdminId();
  if (!adminId) return null;

  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!admin || !admin.isActive) return null;

  return {
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    mustChangePassword: admin.mustChangePassword,
  };
}

export async function requireOwnerSession(): Promise<
  | { ok: true; session: AdminSessionPayload }
  | { ok: false; status: 401 | 403; message: string }
> {
  const session = await getAdminSession();
  if (!session) return { ok: false, status: 401, message: "Unauthorized" };
  if (session.role !== "OWNER") {
    return {
      ok: false,
      status: 403,
      message: "Only an owner-level admin can perform this action.",
    };
  }
  return { ok: true, session };
}
