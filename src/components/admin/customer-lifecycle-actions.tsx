"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "success" : "muted"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export function CustomerLifecycleActions({
  customerId,
  customerName,
  referralCode,
  isActive,
  canDelete,
  compact = false,
}: {
  customerId: string;
  customerName: string;
  referralCode: string;
  isActive: boolean;
  canDelete: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function callLifecycleAction(action: "deactivate" | "reactivate" | "delete") {
    setSubmitting(true);
    setError(null);

    const res = await fetch(
      action === "delete"
        ? `/api/admin/customers/${customerId}`
        : `/api/admin/customers/${customerId}/${action}`,
      { method: action === "delete" ? "DELETE" : "POST" },
    );

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message ?? "Something went wrong. Please try again.");
      return false;
    }
    return true;
  }

  async function handleDeactivate() {
    if (await callLifecycleAction("deactivate")) {
      setDeactivateOpen(false);
      router.refresh();
    }
  }

  async function handleReactivate() {
    if (await callLifecycleAction("reactivate")) {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (await callLifecycleAction("delete")) {
      setDeleteOpen(false);
      router.push("/admin/customers");
      router.refresh();
    }
  }

  const deleteConfirmMatches = deleteConfirmText.trim() === referralCode;

  return (
    <>
      <div className={compact ? "flex items-center gap-1" : "flex flex-wrap items-center gap-2"}>
        {!compact && <StatusBadge isActive={isActive} />}

        {isActive ? (
          compact ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setDeactivateOpen(true)}
              title="Deactivate referral link"
              aria-label="Deactivate referral link"
            >
              <Ban className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setDeactivateOpen(true)}>
              <Ban className="h-4 w-4" />
              Deactivate Referral Link
            </Button>
          )
        ) : compact ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleReactivate}
            disabled={submitting}
            title="Reactivate referral link"
            aria-label="Reactivate referral link"
          >
            <Power className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={handleReactivate} disabled={submitting}>
            <Power className="h-4 w-4" />
            {submitting ? "Reactivating..." : "Reactivate Referral Link"}
          </Button>
        )}

        {!compact && (
          <>
            {canDelete ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Permanently Delete Customer
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                Has referral or reward history — cannot be permanently deleted.
              </span>
            )}
          </>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <Modal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate this referral link?"
      >
        <p className="text-sm text-muted-foreground">
          The customer&apos;s existing link will stop accepting new
          referrals. Their customer record, previous referrals, rewards, and
          revenue history will <strong>not</strong> be deleted.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setDeactivateOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDeactivate} disabled={submitting}>
            {submitting ? "Deactivating..." : "Deactivate Link"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteConfirmText("");
        }}
        title="Permanently delete this customer?"
      >
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            This will permanently remove <strong>{customerName}</strong>&apos;s
            customer record and referral link ({referralCode}). This
            customer has no referral or reward history, so nothing else is
            affected. This cannot be undone.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="deleteConfirmText">
              Type <span className="font-mono">{referralCode}</span> to confirm
            </Label>
            <Input
              id="deleteConfirmText"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setDeleteOpen(false);
              setDeleteConfirmText("");
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={submitting || !deleteConfirmMatches}
          >
            {submitting ? "Deleting..." : "Permanently Delete"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
