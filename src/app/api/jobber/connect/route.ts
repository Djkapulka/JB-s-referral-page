import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { isJobberConfigured } from "@/lib/jobber/config";
import { buildJobberAuthorizeUrl, generateOAuthState } from "@/lib/jobber/oauth";

const STATE_COOKIE = "jbs_jobber_oauth_state";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!isJobberConfigured()) {
    return NextResponse.json(
      { message: "Jobber isn't configured yet — set JOBBER_CLIENT_ID, JOBBER_CLIENT_SECRET, and JOBBER_REDIRECT_URI." },
      { status: 400 },
    );
  }

  const state = generateOAuthState();
  const response = NextResponse.redirect(buildJobberAuthorizeUrl(state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
