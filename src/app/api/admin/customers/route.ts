import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateReferralCode } from "@/lib/referral-code";
import { getAdminSession } from "@/lib/auth";

const createCustomerSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Please check the form fields." }, { status: 400 });
  }

  let referralCode = generateReferralCode(parsed.data.firstName);
  // Vanishingly unlikely, but guard against a code collision anyway.
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.customer.findUnique({ where: { referralCode } });
    if (!existing) break;
    referralCode = generateReferralCode(parsed.data.firstName);
  }

  const customer = await prisma.customer.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      referralCode,
    },
  });

  return NextResponse.json({ ok: true, customer }, { status: 201 });
}
