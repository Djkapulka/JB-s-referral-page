import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PublicReferralForm } from "@/components/public-referral-form";
import { getReferralSettings } from "@/lib/rewards";

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getReferralSettings();
  const referredAmount = Number(settings.referredDiscountAmount);
  const creditAmount = Number(settings.referrerCreditAmount);
  const giftCardAmount = Number(settings.referrerGiftCardAmount);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-10 px-4 py-10 text-center">
      <div className="flex flex-col items-center gap-6">
        <span className="text-sm font-semibold uppercase tracking-wide text-brand">
          JB&apos;s Exterior Cleaning
        </span>
        <h1 className="text-4xl font-extrabold leading-tight">
          Give $25. Get $50.
        </h1>
        <p className="text-muted-foreground">
          Every JB&apos;s customer has a personal referral link. If you were
          sent here without one, ask your JB&apos;s technician or check your
          latest invoice for your link.
        </p>
        <Card className="w-full">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Looking for the admin dashboard?{" "}
            <Link href="/admin/login" className="font-semibold text-brand">
              Log in here
            </Link>
            .
          </CardContent>
        </Card>
      </div>

      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand">
            Refer a Friend
          </span>
          <p className="text-muted-foreground">
            Know someone who needs exterior cleaning? Refer them to JB&apos;s
            Exterior Cleaning! Your friend receives a discount on their first
            service, and you can earn a reward when their job qualifies.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
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

        <PublicReferralForm />
      </div>
    </main>
  );
}
