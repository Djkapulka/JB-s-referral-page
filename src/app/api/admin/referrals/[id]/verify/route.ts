import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getAdminSession } from "@/lib/auth";
import { verifyReferralSchema } from "@/lib/validation";
import { verifyReferral } from "@/lib/referral-verification";
import { logActivity } from "@/lib/activity-log";

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

  const parsed = verifyReferralSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Please check the form fields." }, { status: 400 });
  }

  const input =
    "customerId" in parsed.data
      ? { customerId: parsed.data.customerId }
      : {
          createCustomer: {
            firstName: parsed.data.createCustomer.firstName,
            lastName: parsed.data.createCustomer.lastName,
            email: parsed.data.createCustomer.email || null,
            phone: parsed.data.createCustomer.phone || null,
          },
        };

  try {
    const result = await verifyReferral(id, input, `admin:${session.email}`);

    const leadName = `${result.referral.leadFirstName} ${result.referral.leadLastName}`;
    const customerName = `${result.customer.firstName} ${result.customer.lastName}`;

    if (result.createdNewCustomer) {
      await logActivity({
        admin: session,
        action: "CUSTOMER_CREATED",
        targetType: "Customer",
        targetId: result.customer.id,
        description: `Customer created from referral verification: ${customerName} (${result.customer.referralCode})`,
      });
    }

    await logActivity({
      admin: session,
      action: "REFERRAL_VERIFIED",
      targetType: "Referral",
      targetId: result.referral.id,
      description: `Referral for ${leadName} verified and attached to ${customerName} (${result.customer.referralCode})`,
      metadata: { rewardGranted: result.rewardGranted, createdNewCustomer: result.createdNewCustomer },
    });

    return NextResponse.json({
      ok: true,
      referral: result.referral,
      customer: result.customer,
      rewardGranted: result.rewardGranted,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ message: "Referral or customer not found." }, { status: 404 });
    }
    console.error("Failed to verify referral", err);
    return NextResponse.json({ message: "Failed to verify referral." }, { status: 500 });
  }
}
