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
  isActive = true,
  compact = false,
}: {
  referralUrl: string;
  phone: string | null;
  referredAmount: number;
  creditAmount: number;
  isActive?: boolean;
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
  const canText = phoneUsable && isActive;
  const message = buildReferralMessage(referralUrl, referredAmount, creditAmount);
  const smsHref = canText ? buildSmsHref(phone, message) : undefined;

  const copyDisabledReason = !isActive ? "Referral link is deactivated" : undefined;
  const textDisabledReason = !isActive
    ? "Referral link is deactivated"
    : !phoneUsable
      ? "No phone number on file"
      : undefined;
  const viewLabel = isActive ? "View Referral Page" : "Preview Inactive Page";

  if (compact) {
    return (
      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleCopy}
          disabled={!isActive}
          title={copyDisabledReason ?? (copied ? "Copied!" : "Copy referral link")}
          aria-label="Copy referral link"
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
        {canText ? (
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
            title={textDisabledReason}
            aria-label={`Text customer (${textDisabledReason})`}
          >
            <MessageSquareText className="h-4 w-4" />
          </Button>
        )}
        <a
          href={referralUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={viewLabel}
          aria-label={viewLabel}
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        disabled={!isActive}
        title={copyDisabledReason}
      >
        {copied ? (
          <Check className="h-4 w-4 text-success" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {copied ? "Copied!" : "Copy Link"}
      </Button>

      {canText ? (
        <a href={smsHref}>
          <Button type="button" variant="outline" size="sm">
            <MessageSquareText className="h-4 w-4" />
            Text Customer
          </Button>
        </a>
      ) : (
        <Button type="button" variant="outline" size="sm" disabled title={textDisabledReason}>
          <MessageSquareText className="h-4 w-4" />
          Text Customer
        </Button>
      )}

      <a href={referralUrl} target="_blank" rel="noopener noreferrer">
        <Button type="button" variant="outline" size="sm">
          <ExternalLink className="h-4 w-4" />
          {viewLabel}
        </Button>
      </a>

      {isActive && !phoneUsable && (
        <span className="text-xs text-muted-foreground">
          No phone number on file — add one to enable texting.
        </span>
      )}
    </div>
  );
}
