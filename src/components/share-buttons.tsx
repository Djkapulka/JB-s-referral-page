"use client";

import { useState } from "react";
import { Check, Copy, Mail, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareButtons({
  referralUrl,
  referrerFirstName,
}: {
  referralUrl: string;
  referrerFirstName: string;
}) {
  const [copied, setCopied] = useState(false);

  const message = `Hey! I've used JB's Exterior Cleaning and thought you might want to check them out. You can get $25 off your first service with my referral link: ${referralUrl}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing to do, user can still select the link manually.
    }
  }

  const smsHref = `sms:?&body=${encodeURIComponent(message)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(
    "Get $25 off your first service with JB's Exterior Cleaning",
  )}&body=${encodeURIComponent(message)}`;

  return (
    <div className="flex flex-col gap-3">
      <a href={smsHref} className="w-full">
        <Button variant="default" size="lg" className="w-full">
          <MessageSquareText className="h-5 w-5" />
          Text a Friend
        </Button>
      </a>
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleCopy}
        type="button"
      >
        {copied ? (
          <Check className="h-5 w-5 text-success" />
        ) : (
          <Copy className="h-5 w-5" />
        )}
        {copied ? "Link Copied!" : "Copy Referral Link"}
      </Button>
      <a href={mailHref} className="w-full">
        <Button variant="ghost" size="lg" className="w-full">
          <Mail className="h-5 w-5" />
          Email
        </Button>
      </a>
      <p className="sr-only">Share {referrerFirstName}&apos;s referral link</p>
    </div>
  );
}
