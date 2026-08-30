import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { statusUpdateSchema } from "@/lib/validation";
import { updateReferralStatus } from "@/lib/referral-status";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = statusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid status update." }, { status: 400 });
  }

  try {
    const updated = await updateReferralStatus({
      referralId: id,
      toStatus: parsed.data.status,
      actor: `admin:${session.email}`,
      note: parsed.data.note,
      actualJobValue: parsed.data.actualJobValue,
      estimatedJobValue: parsed.data.estimatedJobValue,
    });
    return NextResponse.json({ ok: true, referral: updated });
  } catch (err) {
    console.error("Failed to update referral status", err);
    return NextResponse.json({ message: "Referral not found." }, { status: 404 });
  }
}
