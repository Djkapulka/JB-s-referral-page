import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { searchCustomers } from "@/lib/admin-customers";

// Lightweight lookup backing the referral-verification UI's "attach to
// existing customer" search — separate from the customers list page, which
// does its own server-side search via page searchParams.
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("query")?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ customers: [] });
  }

  const customers = await searchCustomers(query);

  return NextResponse.json({
    customers: customers.slice(0, 10).map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      referralCode: c.referralCode,
    })),
  });
}
