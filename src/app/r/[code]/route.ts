import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const url = new URL(`/refer/${code}`, req.url);
  return NextResponse.redirect(url);
}
