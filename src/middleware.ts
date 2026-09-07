import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db";

// Runs on the Node.js runtime (not edge) so it can query Postgres directly —
// needed to deny a deactivated admin's very next request even with a
// still-valid, unexpired session cookie, and to force a password change
// before any other admin route is reachable.
export const runtime = "nodejs";

const SESSION_COOKIE = "jbs_admin_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function getSessionAdminId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const key = getSecretKey();
  if (!key) return null;

  try {
    const { payload } = await jwtVerify(token, key);
    const adminId = (payload as { adminId?: unknown }).adminId;
    return typeof adminId === "string" ? adminId : null;
  } catch {
    return null;
  }
}

function denyUnauthenticated(req: NextRequest, pathname: string) {
  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const loginUrl = new URL("/admin/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

const CHANGE_PASSWORD_PATH = "/admin/change-password";
const CHANGE_PASSWORD_API = "/api/admin/change-password";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicAdminRoute =
    pathname === "/admin/login" || pathname === "/api/admin/login";

  if (isPublicAdminRoute) {
    return NextResponse.next();
  }

  const adminId = await getSessionAdminId(req);
  if (!adminId) {
    return denyUnauthenticated(req, pathname);
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { isActive: true, mustChangePassword: true },
  });

  if (!admin || !admin.isActive) {
    return denyUnauthenticated(req, pathname);
  }

  const isChangePasswordRoute =
    pathname === CHANGE_PASSWORD_PATH || pathname === CHANGE_PASSWORD_API;
  const isLogoutRoute = pathname === "/api/admin/logout";

  if (admin.mustChangePassword && !isChangePasswordRoute && !isLogoutRoute) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        { message: "You must change your password before continuing." },
        { status: 403 },
      );
    }
    return NextResponse.redirect(new URL(CHANGE_PASSWORD_PATH, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
