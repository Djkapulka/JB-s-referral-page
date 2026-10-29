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

export function PublicReferralForm() {
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
      referrerFirstName: formData.get("referrerFirstName"),
      referrerLastName: formData.get("referrerLastName"),
      referrerEmail: formData.get("referrerEmail"),
      referrerPhone: formData.get("referrerPhone"),
      leadFirstName: formData.get("leadFirstName"),
      leadLastName: formData.get("leadLastName"),
      leadEmail: formData.get("leadEmail"),
      leadPhone: formData.get("leadPhone"),
      serviceRequested: formData.get("serviceRequested"),
      leadAddress: formData.get("leadAddress"),
      leadCity: formData.get("leadCity"),
      leadZip: formData.get("leadZip"),
      consentGiven: formData.get("consentGiven") === "on",
      companyWebsite: formData.get("companyWebsite") ?? "",
      turnstileToken,
    };

    try {
      const res = await fetch("/api/referrals/public", {
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
          <h2 className="text-2xl font-bold">Thank You for Your Referral!</h2>
          <p className="text-muted-foreground">
            Your referral has been submitted to JB&apos;s Exterior Cleaning.
            Our team will review the information and contact your friend.
            You&apos;ll become eligible for your referral reward when the
            qualifying service is completed.
          </p>
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Honeypot — hidden from real users, bots often fill every field */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="publicCompanyWebsite">Company Website</label>
            <input
              type="text"
              id="publicCompanyWebsite"
              name="companyWebsite"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-bold">Your Information</h3>
              <p className="text-sm text-muted-foreground">
                Enter your information so we can track your referral and make
                sure you receive your reward.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="referrerFirstName">First Name</Label>
                <Input id="referrerFirstName" name="referrerFirstName" required maxLength={80} />
                {errors.referrerFirstName && (
                  <p className="text-sm text-danger">{errors.referrerFirstName}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="referrerLastName">Last Name</Label>
                <Input id="referrerLastName" name="referrerLastName" required maxLength={80} />
                {errors.referrerLastName && (
                  <p className="text-sm text-danger">{errors.referrerLastName}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="referrerEmail">Email Address</Label>
              <Input id="referrerEmail" name="referrerEmail" type="email" />
              {errors.referrerEmail && (
                <p className="text-sm text-danger">{errors.referrerEmail}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="referrerPhone">Phone Number</Label>
              <Input
                id="referrerPhone"
                name="referrerPhone"
                type="tel"
                placeholder="(555) 555-5555"
              />
              {errors.referrerPhone && (
                <p className="text-sm text-danger">{errors.referrerPhone}</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Provide at least your email or your phone number.
            </p>
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-6">
            <div>
              <h3 className="text-lg font-bold">Your Friend&apos;s Information</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="leadFirstName">Friend&apos;s First Name</Label>
                <Input id="leadFirstName" name="leadFirstName" required maxLength={80} />
                {errors.leadFirstName && (
                  <p className="text-sm text-danger">{errors.leadFirstName}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="leadLastName">Friend&apos;s Last Name</Label>
                <Input id="leadLastName" name="leadLastName" required maxLength={80} />
                {errors.leadLastName && (
                  <p className="text-sm text-danger">{errors.leadLastName}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leadPhone">Friend&apos;s Phone Number</Label>
              <Input
                id="leadPhone"
                name="leadPhone"
                type="tel"
                placeholder="(555) 555-5555"
              />
              {errors.leadPhone && (
                <p className="text-sm text-danger">{errors.leadPhone}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leadEmail">Friend&apos;s Email Address</Label>
              <Input id="leadEmail" name="leadEmail" type="email" />
              {errors.leadEmail && (
                <p className="text-sm text-danger">{errors.leadEmail}</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Provide at least your friend&apos;s email or phone number.
            </p>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="serviceRequested">Service Interested In</Label>
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="leadAddress">Street Address (optional)</Label>
              <Input id="leadAddress" name="leadAddress" maxLength={160} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="leadCity">City (optional)</Label>
                <Input id="leadCity" name="leadCity" maxLength={80} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="leadZip">ZIP Code (optional)</Label>
                <Input id="leadZip" name="leadZip" maxLength={12} />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-muted p-4">
              <Checkbox id="consentGiven" name="consentGiven" required />
              <Label htmlFor="consentGiven" className="font-normal leading-snug">
                I confirm I have permission to share my friend&apos;s contact
                information with JB&apos;s Exterior Cleaning for this
                referral.
              </Label>
            </div>
            {errors.consentGiven && (
              <p className="text-sm text-danger">{errors.consentGiven}</p>
            )}
          </div>

          {TURNSTILE_SITE_KEY && (
            <div
              className="cf-turnstile"
              data-sitekey={TURNSTILE_SITE_KEY}
              data-callback="onPublicTurnstileVerify"
            />
          )}

          {formError && <p className="text-sm text-danger">{formError}</p>}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Sending..." : "Submit Referral"}
          </Button>
        </form>
      </CardContent>
      {TURNSTILE_SITE_KEY && (
        <Script id="public-turnstile-callback" strategy="afterInteractive">
          {`window.onPublicTurnstileVerify = function(token) {
            window.dispatchEvent(new CustomEvent("turnstile-token", { detail: token }));
          };`}
        </Script>
      )}
    </Card>
  );
}
