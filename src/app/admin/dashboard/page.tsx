import { getDashboardStats } from "@/lib/admin-stats";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          A snapshot of how the referral program is performing.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Referrals" value={stats.totalReferrals.toString()} />
        <StatCard label="Leads This Month" value={stats.leadsThisMonth.toString()} />
        <StatCard
          label="Conversion Rate"
          value={`${stats.conversionRate.toFixed(1)}%`}
          hint="Referrals reaching Booked or beyond"
        />
        <StatCard label="Rewards Owed" value={currency(stats.rewardsOwed)} />
        <StatCard label="Booked Referral Revenue" value={currency(stats.bookedRevenue)} />
        <StatCard label="Completed Referral Revenue" value={currency(stats.completedRevenue)} />
        <StatCard label="Rewards Paid" value={currency(stats.rewardsPaid)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Referring Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topReferrers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrals yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 font-medium">Customer</th>
                  <th className="py-2 font-medium">Referral Code</th>
                  <th className="py-2 font-medium">Total Referrals</th>
                  <th className="py-2 font-medium">Converted</th>
                </tr>
              </thead>
              <tbody>
                {stats.topReferrers.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2">
                      <Link
                        href={`/admin/customers?query=${encodeURIComponent(r.referralCode)}`}
                        className="font-medium text-brand hover:underline"
                      >
                        {r.name}
                      </Link>
                    </td>
                    <td className="py-2 text-muted-foreground">{r.referralCode}</td>
                    <td className="py-2">{r.totalReferrals}</td>
                    <td className="py-2">{r.convertedReferrals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
