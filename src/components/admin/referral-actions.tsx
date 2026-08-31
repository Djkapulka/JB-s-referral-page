"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";

function buildReferralMessage(
  referralUrl: string,
  referredAmount: number,
  creditAmount: number,
) {
  return `Thanks for choosing JB's Exterior Cleaning! Give a friend $${referredAmount} off their first service and get $${creditAmount} toward your next service when they book. Here's your personal referral link: ${referralUrl}`;
}

function buildSmsHref(phone: string, message: string) {
  const sanitizedPhone = phone.replace(/[^\d+]/g, "");
  const isIOS =
    typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  // iOS Safari and Android's SMS URI scheme disagree on how to separate the
  // body param — this is the widely-used compatibility split. Either way,
  // the OS only ever opens the compose screen; nothing sends automatically.
  const separator = isIOS ? "&" : "?";
  return `sms:${sanitizedPhone}${separator}body=${encodeURIComponent(message)}`;
}

// Free-text phone fields sometimes hold junk ("n/a", empty string, etc.) —
// require a plausible number of digits before treating it as usable.
function hasUsablePhone(phone: string | null): phone is string {
  return !!phone && phone.replace(/\D/g, "").length >= 7;
}

export function ReferralActions({
  referralUrl,
  phone,
  referredAmount,
  creditAmount,
  compact = false,
}: {
  referralUrl: string;
  phone: string | null;
  referredAmount: number;
  creditAmount: number;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing to do, admin can select the URL text manually.
    }
  }

  const phoneUsable = hasUsablePhone(phone);
  const message = buildReferralMessage(referralUrl, referredAmount, creditAmount);
  const smsHref = phoneUsable ? buildSmsHref(phone, message) : undefined;

  if (compact) {
    return (
      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleCopy}
          title={copied ? "Copied!" : "Copy referral link"}
          aria-label="Copy referral link"
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
        {phoneUsable ? (
          <a href={smsHref} title="Text customer" aria-label="Text customer">
            <Button type="button" variant="outline" size="icon" className="h-8 w-8">
              <MessageSquareText className="h-4 w-4" />
            </Button>
          </a>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled
            title="No phone number on file"
            aria-label="Text customer (no phone number on file)"
          >
            <MessageSquareText className="h-4 w-4" />
          </Button>
        )}
        <a
          href={referralUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="View referral page"
          aria-label="View referral page"
        >
          <Button type="button" variant="outline" size="icon" className="h-8 w-8">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
        {copied ? (
          <Check className="h-4 w-4 text-success" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {copied ? "Copied!" : "Copy Link"}
      </Button>

      {phoneUsable ? (
        <a href={smsHref}>
          <Button type="button" variant="outline" size="sm">
            <MessageSquareText className="h-4 w-4" />
            Text Customer
          </Button>
        </a>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          title="No phone number on file for this customer"
        >
          <MessageSquareText className="h-4 w-4" />
          Text Customer
        </Button>
      )}

      <a href={referralUrl} target="_blank" rel="noopener noreferrer">
        <Button type="button" variant="outline" size="sm">
          <ExternalLink className="h-4 w-4" />
          View Referral Page
        </Button>
      </a>

      {!phoneUsable && (
        <span className="text-xs text-muted-foreground">
          No phone number on file — add one to enable texting.
        </span>
      )}
    </div>
  );
}
