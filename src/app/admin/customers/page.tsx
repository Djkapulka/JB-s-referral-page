import Link from "next/link";
import { searchCustomers } from "@/lib/admin-customers";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddCustomerForm } from "@/components/admin/add-customer-form";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const params = await searchParams;
  const customers = await searchCustomers(params.query);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            Every customer with a referral link, and how their referrals are doing.
          </p>
        </div>
        <AddCustomerForm />
      </div>

      <form className="flex gap-3" method="get">
        <Input
          name="query"
          placeholder="Search by name, email, phone, or referral code"
          defaultValue={params.query}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Referral Code</th>
                <th className="p-3 font-medium">Total Referrals</th>
                <th className="p-3 font-medium">Pending</th>
                <th className="p-3 font-medium">Successful</th>
                <th className="p-3 font-medium">Rewards Earned</th>
                <th className="p-3 font-medium">Rewards Redeemed</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No customers found.
                  </td>
                </tr>
              )}
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {c.firstName} {c.lastName}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {c.email ?? c.phone ?? ""}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-xs">{c.referralCode}</td>
                  <td className="p-3">{c.totalReferrals}</td>
                  <td className="p-3">{c.pendingReferrals}</td>
                  <td className="p-3">{c.successfulReferrals}</td>
                  <td className="p-3">${c.rewardsEarned}</td>
                  <td className="p-3">${c.rewardsRedeemed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
