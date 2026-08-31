import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomerDetail } from "@/lib/admin-customers";
import { SERVICE_LABELS } from "@/lib/validation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { ReferralActions } from "@/components/admin/referral-actions";
import { getReferralUrl } from "@/lib/site-url";
import { getReferralSettings } from "@/lib/rewards";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerDetail(id);

  if (!customer) notFound();

  const referralUrl = await getReferralUrl(customer.referralCode);
  const settings = await getReferralSettings();
  const referredAmount = Number(settings.referredDiscountAmount);
  const creditAmount = Number(settings.referrerCreditAmount);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">
          {customer.firstName} {customer.lastName}
        </h1>
        <p className="text-muted-foreground">
          {customer.email ?? "No email"} · {customer.phone ?? "No phone"}
        </p>
        <p className="mt-1 text-sm">
          Referral link:{" "}
          <Link href={`/refer/${customer.referralCode}`} className="text-brand hover:underline">
            {referralUrl}
          </Link>
        </p>
        <div className="mt-3">
          <ReferralActions
            referralUrl={referralUrl}
            phone={customer.phone}
            referredAmount={referredAmount}
            creditAmount={creditAmount}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Friends Referred" value={customer.totalReferrals.toString()} />
        <StatCard label="Pending" value={customer.pendingReferrals.toString()} />
        <StatCard label="Successful" value={customer.successfulReferrals.toString()} />
        <StatCard label="Rewards Earned" value={`$${customer.rewardsEarned}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="p-3 font-medium">Lead</th>
                <th className="p-3 font-medium">Service</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {customer.referrals.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    No referrals yet.
                  </td>
                </tr>
              )}
              {customer.referrals.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <Link
                      href={`/admin/referrals/${r.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {r.leadFirstName} {r.leadLastName}
                    </Link>
                  </td>
                  <td className="p-3">{SERVICE_LABELS[r.serviceRequested]}</td>
                  <td className="p-3">
                    <Badge>{r.status}</Badge>
                  </td>
                  <td className="p-3">{r.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
