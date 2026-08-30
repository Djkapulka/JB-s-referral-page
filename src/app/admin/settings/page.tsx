import { getReferralSettings } from "@/lib/rewards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getReferralSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Change the referral offer amounts shown on the referral page. Past
          rewards already earned keep the amount they were promised.
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Reward Offer</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            referredDiscountAmount={settings.referredDiscountAmount.toString()}
            referrerCreditAmount={settings.referrerCreditAmount.toString()}
            referrerGiftCardAmount={settings.referrerGiftCardAmount.toString()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
