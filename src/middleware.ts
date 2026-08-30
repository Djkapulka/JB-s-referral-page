import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "jbs_admin_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const key = getSecretKey();
  if (!key) return false;

  try {
    await jwtVerify(token, key);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicAdminRoute =
    pathname === "/admin/login" || pathname === "/api/admin/login";

  if (!isPublicAdminRoute) {
    const authed = await hasValidSession(req);
    if (!authed) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
