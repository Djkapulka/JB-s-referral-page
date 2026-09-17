import { getReferralSettings } from "@/lib/rewards";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getReferralSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Discount</h1>
        <p className="text-muted-foreground">
          Manage the discount and rewards offered through the JB&apos;s
          customer referral program.
        </p>
      </div>

      <SettingsForm
        referredDiscountAmount={settings.referredDiscountAmount.toString()}
        referrerCreditAmount={settings.referrerCreditAmount.toString()}
        referrerGiftCardAmount={settings.referrerGiftCardAmount.toString()}
      />
    </div>
  );
}
