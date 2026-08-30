"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STATUS_OPTIONS = [
  ["SUBMITTED", "Submitted"],
  ["CONTACTED", "Contacted"],
  ["ESTIMATE_SENT", "Estimate Sent"],
  ["BOOKED", "Booked"],
  ["JOB_COMPLETED", "Job Completed"],
  ["REWARD_EARNED", "Reward Earned"],
  ["REWARD_PAID", "Reward Paid"],
] as const;

export function StatusUpdateForm({
  referralId,
  currentStatus,
  estimatedJobValue,
  actualJobValue,
}: {
  referralId: string;
  currentStatus: string;
  estimatedJobValue: string | null;
  actualJobValue: string | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      status: formData.get("status"),
      note: formData.get("note") || undefined,
    };
    const estimated = formData.get("estimatedJobValue");
    const actual = formData.get("actualJobValue");
    if (estimated) payload.estimatedJobValue = estimated;
    if (actual) payload.actualJobValue = actual;

    const res = await fetch(`/api/admin/referrals/${referralId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message ?? "Failed to update status.");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue={currentStatus}>
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="estimatedJobValue">Estimated Job Value</Label>
          <Input
            id="estimatedJobValue"
            name="estimatedJobValue"
            type="number"
            step="0.01"
            min="0"
            defaultValue={estimatedJobValue ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="actualJobValue">Actual Job Value</Label>
          <Input
            id="actualJobValue"
            name="actualJobValue"
            type="number"
            step="0.01"
            min="0"
            defaultValue={actualJobValue ?? ""}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea id="note" name="note" maxLength={1000} />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Update Status"}
      </Button>
    </form>
  );
}
