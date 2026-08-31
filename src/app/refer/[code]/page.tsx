import { notFound } from "next/navigation";
import { getCustomerByReferralCode, getCustomerReferralSummary } from "@/lib/customer";
import { ReferralForm } from "@/components/referral-form";
import { Card, CardContent } from "@/components/ui/card";
import { getReferralSettings } from "@/lib/rewards";
import { getReferralUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function ReferPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const customer = await getCustomerByReferralCode(code);

  if (!customer) {
    notFound();
  }

  const settings = await getReferralSettings();
  const summary = await getCustomerReferralSummary(customer.id);
  const referralUrl = await getReferralUrl(customer.referralCode);

  const referredAmount = Number(settings.referredDiscountAmount);
  const creditAmount = Number(settings.referrerCreditAmount);
  const giftCardAmount = Number(settings.referrerGiftCardAmount);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-brand">
          JB&apos;s Exterior Cleaning
        </span>
        <h1 className="text-4xl font-extrabold leading-tight text-foreground">
          Give ${referredAmount}. Get ${creditAmount}.
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Hi {customer.firstName}, thanks for choosing JB&apos;s Exterior
          Cleaning.
        </p>
        <p className="text-muted-foreground">
          Know someone who could use us? Send them our way and you both get
          taken care of.
        </p>
      </header>

      {summary.totalReferrals > 0 && (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-muted-foreground">
              Your Referrals
            </p>
            <div className="mt-2 flex justify-between gap-2 text-center">
              <div className="flex-1">
                <p className="text-2xl font-bold">{summary.totalReferrals}</p>
                <p className="text-xs text-muted-foreground">
                  Friend{summary.totalReferrals === 1 ? "" : "s"} Referred
                </p>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">{summary.completedReferrals}</p>
                <p className="text-xs text-muted-foreground">
                  Job{summary.completedReferrals === 1 ? "" : "s"} Completed
                </p>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">${summary.totalRewardsEarned}</p>
                <p className="text-xs text-muted-foreground">Service Credit Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-brand text-brand-foreground">
          <CardContent className="flex flex-col items-center gap-1 p-5 text-center">
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
              They Get
            </span>
            <span className="text-2xl font-extrabold">${referredAmount} Off</span>
            <span className="text-sm opacity-90">their first service</span>
          </CardContent>
        </Card>
        <Card className="bg-accent text-accent-foreground">
          <CardContent className="flex flex-col items-center gap-1 p-5 text-center">
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
              You Get
            </span>
            <span className="text-2xl font-extrabold">${creditAmount} Credit</span>
            <span className="text-sm opacity-90">
              or a ${giftCardAmount} gift card — your choice
            </span>
          </CardContent>
        </Card>
      </div>

      <ReferralForm
        referralCode={customer.referralCode}
        referrerFirstName={customer.firstName}
        referralUrl={referralUrl}
      />

      <p className="text-center text-xs text-muted-foreground">
        By submitting, you confirm the person you&apos;re referring is aware
        and okay with JB&apos;s Exterior Cleaning reaching out to them.
      </p>
    </main>
  );
}
