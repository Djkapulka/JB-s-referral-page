import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exchangeCodeForTokens } from "@/lib/jobber/oauth";
import { encryptToken } from "@/lib/jobber/crypto";

const STATE_COOKIE = "jbs_jobber_oauth_state";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = req.cookies.get(STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/admin/settings?jobber_error=invalid_state", req.url),
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await prisma.jobberConnection.upsert({
      where: { id: "singleton" },
      update: {
        accessTokenEncrypted: encryptToken(tokens.access_token),
        refreshTokenEncrypted: encryptToken(tokens.refresh_token),
        scope: tokens.scope,
        expiresAt,
        connectedByAdminId: session.adminId,
      },
      create: {
        id: "singleton",
        accessTokenEncrypted: encryptToken(tokens.access_token),
        refreshTokenEncrypted: encryptToken(tokens.refresh_token),
        scope: tokens.scope,
        expiresAt,
        connectedByAdminId: session.adminId,
      },
    });
  } catch (err) {
    console.error("Jobber OAuth callback failed", err);
    return NextResponse.redirect(
      new URL("/admin/settings?jobber_error=token_exchange_failed", req.url),
    );
  }

  const response = NextResponse.redirect(new URL("/admin/settings?jobber_connected=1", req.url));
  response.cookies.delete(STATE_COOKIE);
  return response;
}
