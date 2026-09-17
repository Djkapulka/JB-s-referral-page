"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

function AmountField({
  id,
  name,
  label,
  helpText,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  helpText: string;
  defaultValue: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-current">
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground">
          $
        </span>
        <Input
          id={id}
          name={name}
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValue}
          required
          className="bg-card pl-6 text-foreground"
        />
      </div>
      <p className="text-sm text-current/80">{helpText}</p>
    </div>
  );
}

export function SettingsForm({
  referredDiscountAmount,
  referrerCreditAmount,
  referrerGiftCardAmount,
}: {
  referredDiscountAmount: string;
  referrerCreditAmount: string;
  referrerGiftCardAmount: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referredDiscountAmount: formData.get("referredDiscountAmount"),
        referrerCreditAmount: formData.get("referrerCreditAmount"),
        referrerGiftCardAmount: formData.get("referrerGiftCardAmount"),
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message ?? "Failed to save settings.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-brand text-brand-foreground">
          <CardContent className="flex flex-col gap-4 p-5">
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
              They Get
            </span>
            <AmountField
              id="referredDiscountAmount"
              name="referredDiscountAmount"
              label="Referred Customer Discount"
              helpText="Amount the referred customer receives off their first service."
              defaultValue={referredDiscountAmount}
            />
          </CardContent>
        </Card>

        <Card className="bg-accent text-accent-foreground">
          <CardContent className="flex flex-col gap-4 p-5">
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
              You Get
            </span>
            <AmountField
              id="referrerCreditAmount"
              name="referrerCreditAmount"
              label="Service Credit"
              helpText="Amount the referring customer can receive as credit toward a future JB's service."
              defaultValue={referrerCreditAmount}
            />
            <AmountField
              id="referrerGiftCardAmount"
              name="referrerGiftCardAmount"
              label="Gift Card Alternative"
              helpText="Gift card amount the referring customer can choose instead of the service credit."
              defaultValue={referrerGiftCardAmount}
            />
          </CardContent>
        </Card>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">Changes saved.</p>}

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
