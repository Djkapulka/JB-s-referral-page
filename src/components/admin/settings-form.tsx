"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="referredDiscountAmount">
          Referred customer discount ($) — &quot;They Get&quot;
        </Label>
        <Input
          id="referredDiscountAmount"
          name="referredDiscountAmount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={referredDiscountAmount}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="referrerCreditAmount">
          Referrer service credit ($) — &quot;You Get&quot;
        </Label>
        <Input
          id="referrerCreditAmount"
          name="referrerCreditAmount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={referrerCreditAmount}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="referrerGiftCardAmount">
          Referrer gift card alternative ($)
        </Label>
        <Input
          id="referrerGiftCardAmount"
          name="referrerGiftCardAmount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={referrerGiftCardAmount}
          required
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">Settings saved.</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
