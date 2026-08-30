"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { SERVICE_TYPES, SERVICE_LABELS } from "@/lib/validation";
import { ShareButtons } from "@/components/share-buttons";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: { sitekey: string; callback: (token: string) => void },
      ) => string;
    };
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function ReferralForm({
  referralCode,
  referrerFirstName,
  referralUrl,
}: {
  referralCode: string;
  referrerFirstName: string;
  referralUrl: string;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "duplicate">(
    "idle",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  useEffect(() => {
    function handleToken(e: Event) {
      setTurnstileToken((e as CustomEvent<string>).detail);
    }
    window.addEventListener("turnstile-token", handleToken);
    return () => window.removeEventListener("turnstile-token", handleToken);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setFormError(null);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const payload = {
      referralCode,
      leadFirstName: formData.get("leadFirstName"),
      leadLastName: formData.get("leadLastName"),
      leadPhone: formData.get("leadPhone"),
      leadEmail: formData.get("leadEmail"),
      leadAddress: formData.get("leadAddress"),
      leadCity: formData.get("leadCity"),
      leadZip: formData.get("leadZip"),
      serviceRequested: formData.get("serviceRequested"),
      consentGiven: formData.get("consentGiven") === "on",
      companyWebsite: formData.get("companyWebsite") ?? "",
      turnstileToken,
    };

    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409) {
        setStatus("duplicate");
        return;
      }

      if (!res.ok) {
        if (data?.fieldErrors) {
          setErrors(data.fieldErrors);
        }
        setFormError(data?.message ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setFormError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-3xl">
            🎉
          </div>
          <h2 className="text-2xl font-bold">Referral sent!</h2>
          <p className="text-muted-foreground">
            We&apos;ll take it from here. If they become a customer, we&apos;ll
            let you know when you&apos;ve earned your reward.
          </p>
          <div className="mt-4 w-full">
            <ShareButtons
              referralUrl={referralUrl}
              referrerFirstName={referrerFirstName}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "duplicate") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <h2 className="text-2xl font-bold">We&apos;ve already got this one!</h2>
          <p className="text-muted-foreground">
            Looks like this referral was already submitted recently. We&apos;re
            already on it — no need to send it again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {TURNSTILE_SITE_KEY && (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            async
            defer
          />
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Honeypot — hidden from real users, bots often fill every field */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="companyWebsite">Company Website</label>
            <input
              type="text"
              id="companyWebsite"
              name="companyWebsite"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leadFirstName">Their First Name</Label>
              <Input id="leadFirstName" name="leadFirstName" required maxLength={80} />
              {errors.leadFirstName && (
                <p className="text-sm text-danger">{errors.leadFirstName}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leadLastName">Their Last Name</Label>
              <Input id="leadLastName" name="leadLastName" required maxLength={80} />
              {errors.leadLastName && (
                <p className="text-sm text-danger">{errors.leadLastName}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="leadPhone">Their Phone Number</Label>
            <Input
              id="leadPhone"
              name="leadPhone"
              type="tel"
              required
              placeholder="(555) 555-5555"
            />
            {errors.leadPhone && (
              <p className="text-sm text-danger">{errors.leadPhone}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="leadEmail">Their Email</Label>
            <Input id="leadEmail" name="leadEmail" type="email" required />
            {errors.leadEmail && (
              <p className="text-sm text-danger">{errors.leadEmail}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="leadAddress">Their Address</Label>
            <Input id="leadAddress" name="leadAddress" required maxLength={160} />
            {errors.leadAddress && (
              <p className="text-sm text-danger">{errors.leadAddress}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leadCity">City</Label>
              <Input id="leadCity" name="leadCity" required maxLength={80} />
              {errors.leadCity && (
                <p className="text-sm text-danger">{errors.leadCity}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leadZip">ZIP Code</Label>
              <Input id="leadZip" name="leadZip" required maxLength={12} />
              {errors.leadZip && (
                <p className="text-sm text-danger">{errors.leadZip}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="serviceRequested">Service They&apos;re Interested In</Label>
            <Select id="serviceRequested" name="serviceRequested" required defaultValue="">
              <option value="" disabled>
                Select a service
              </option>
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {SERVICE_LABELS[type]}
                </option>
              ))}
            </Select>
            {errors.serviceRequested && (
              <p className="text-sm text-danger">{errors.serviceRequested}</p>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-muted p-4">
            <Checkbox id="consentGiven" name="consentGiven" required />
            <Label htmlFor="consentGiven" className="font-normal leading-snug">
              I confirm this person knows I&apos;m sharing their info and I have
              permission for JB&apos;s Exterior Cleaning to contact them by
              phone, text, or email about this referral.
            </Label>
          </div>
          {errors.consentGiven && (
            <p className="text-sm text-danger">{errors.consentGiven}</p>
          )}

          {TURNSTILE_SITE_KEY && (
            <div
              className="cf-turnstile"
              data-sitekey={TURNSTILE_SITE_KEY}
              data-callback="onTurnstileVerify"
            />
          )}

          {formError && <p className="text-sm text-danger">{formError}</p>}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Sending..." : "Send My Referral"}
          </Button>
        </form>
      </CardContent>
      {TURNSTILE_SITE_KEY && (
        <Script id="turnstile-callback" strategy="afterInteractive">
          {`window.onTurnstileVerify = function(token) {
            window.dispatchEvent(new CustomEvent("turnstile-token", { detail: token }));
          };`}
        </Script>
      )}
    </Card>
  );
}
