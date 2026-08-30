import { notFound } from "next/navigation";
import { getReferralDetail } from "@/lib/admin-referrals";
import { SERVICE_LABELS } from "@/lib/validation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusUpdateForm } from "@/components/admin/status-update-form";

export const dynamic = "force-dynamic";

export default async function ReferralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const referral = await getReferralDetail(id);

  if (!referral) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">
          {referral.leadFirstName} {referral.leadLastName}
        </h1>
        <p className="text-muted-foreground">
          Referred by {referral.referrer.firstName} {referral.referrer.lastName}{" "}
          ({referral.referrer.referralCode})
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row label="Phone" value={referral.leadPhone} />
            <Row label="Email" value={referral.leadEmail} />
            <Row label="Address" value={referral.leadAddress} />
            <Row label="City" value={referral.leadCity} />
            <Row label="ZIP" value={referral.leadZip} />
            <Row label="Service" value={SERVICE_LABELS[referral.serviceRequested]} />
            <Row label="Consent" value={referral.consentGiven ? "Given" : "Not given"} />
            <Row label="Submitted" value={referral.createdAt.toLocaleString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusUpdateForm
              referralId={referral.id}
              currentStatus={referral.status}
              estimatedJobValue={
                referral.estimatedJobValue != null ? referral.estimatedJobValue.toString() : null
              }
              actualJobValue={
                referral.actualJobValue != null ? referral.actualJobValue.toString() : null
              }
            />
          </CardContent>
        </Card>
      </div>

      {referral.reward && (
        <Card>
          <CardHeader>
            <CardTitle>Reward</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Row label="Type" value={referral.reward.rewardType} />
            <Row label="Amount" value={`$${Number(referral.reward.rewardAmount)}`} />
            <Row label="Status" value={referral.reward.status} />
            {referral.reward.earnedAt && (
              <Row label="Earned" value={referral.reward.earnedAt.toLocaleString()} />
            )}
            {referral.reward.paidAt && (
              <Row label="Paid" value={referral.reward.paidAt.toLocaleString()} />
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          {referral.events.length === 0 && (
            <p className="text-muted-foreground">No events recorded yet.</p>
          )}
          {referral.events.map((event) => (
            <div key={event.id} className="border-b border-border pb-2 last:border-0">
              <p className="font-medium">
                {event.fromStatus ? `${event.fromStatus} → ` : ""}
                {event.toStatus ?? event.eventType}
              </p>
              <p className="text-xs text-muted-foreground">
                {event.actor} · {event.createdAt.toLocaleString()}
              </p>
              {event.note && <p className="mt-1 text-sm">{event.note}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
