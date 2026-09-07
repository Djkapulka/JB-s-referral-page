import Link from "next/link";
import { searchReferrals } from "@/lib/admin-referrals";
import { SERVICE_LABELS, REFERRAL_STATUS_LABELS } from "@/lib/validation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ReferralStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const STATUS_LABELS = REFERRAL_STATUS_LABELS;

const STATUS_VARIANTS: Record<ReferralStatus, "default" | "accent" | "success" | "muted"> = {
  SUBMITTED: "muted",
  CONTACTED: "default",
  ESTIMATE_SENT: "default",
  BOOKED: "accent",
  JOB_COMPLETED: "success",
  REWARD_EARNED: "success",
  REWARD_PAID: "success",
};

const currency = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default async function ReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status as ReferralStatus | undefined;
  const referrals = await searchReferrals({ query: params.query, status });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Referrals</h1>
        <p className="text-muted-foreground">
          Search and manage every referral submitted through the program.
        </p>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <Input
          name="query"
          placeholder="Search by name, phone, email, or referral code"
          defaultValue={params.query}
          className="max-w-sm"
        />
        <Select name="status" defaultValue={params.status ?? ""} className="max-w-xs">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="p-3 font-medium">Referrer</th>
                <th className="p-3 font-medium">Referred Lead</th>
                <th className="p-3 font-medium">Service</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Job Value</th>
                <th className="p-3 font-medium">Reward</th>
              </tr>
            </thead>
            <tbody>
              {referrals.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    No referrals found.
                  </td>
                </tr>
              )}
              {referrals.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    {r.referrer.firstName} {r.referrer.lastName}
                  </td>
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
                    <Badge variant={STATUS_VARIANTS[r.status]}>
                      {STATUS_LABELS[r.status]}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {currency(
                      r.actualJobValue != null
                        ? Number(r.actualJobValue)
                        : r.estimatedJobValue != null
                          ? Number(r.estimatedJobValue)
                          : null,
                    )}
                  </td>
                  <td className="p-3">
                    {r.reward
                      ? `${currency(Number(r.reward.rewardAmount))} (${r.reward.status})`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
