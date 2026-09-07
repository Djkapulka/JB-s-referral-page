"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, KeyRound, MoreVertical, Power, SquarePen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/modal";

type AdminRow = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN";
  isActive: boolean;
  hasActivityHistory: boolean;
  isLastActiveOwner: boolean;
};

async function callApi(url: string, options: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message ?? "Something went wrong. Please try again.");
  }
  return res.json().catch(() => ({}));
}

export function AdminActionsMenu({ admin }: { admin: AdminRow }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function openModal(setter: (v: boolean) => void) {
    setMenuOpen(false);
    setError(null);
    setter(true);
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    try {
      await callApi(`/api/admin/admins/${admin.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          role: formData.get("role"),
        }),
      });
      setEditOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      await callApi(`/api/admin/admins/${admin.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({
          newPassword,
          requireChangeOnNextLogin: formData.get("requireChange") === "on",
        }),
      });
      setResetOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate() {
    setSubmitting(true);
    setError(null);
    try {
      await callApi(`/api/admin/admins/${admin.id}/deactivate`, { method: "POST" });
      setDeactivateOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReactivate() {
    setSubmitting(true);
    setError(null);
    try {
      await callApi(`/api/admin/admins/${admin.id}/reactivate`, { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reactivate.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    setError(null);
    try {
      await callApi(`/api/admin/admins/${admin.id}`, { method: "DELETE" });
      setDeleteOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete admin.");
    } finally {
      setSubmitting(false);
    }
  }

  const deleteBlockedReason = admin.isLastActiveOwner
    ? "This is the only active owner account and cannot be deleted."
    : admin.hasActivityHistory
      ? "This admin has activity history — deactivate instead to preserve the audit trail."
      : null;

  const deactivateBlockedReason = admin.isLastActiveOwner
    ? "This is the only active owner account and cannot be deactivated."
    : null;

  const deleteConfirmMatches = deleteConfirmText.trim().toLowerCase() === admin.email.toLowerCase();

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Admin actions"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          <button
            role="menuitem"
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={() => openModal(setEditOpen)}
          >
            <SquarePen className="h-4 w-4" /> Edit Admin
          </button>
          <button
            role="menuitem"
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={() => openModal(setResetOpen)}
          >
            <KeyRound className="h-4 w-4" /> Reset Password
          </button>
          {admin.isActive ? (
            <button
              role="menuitem"
              type="button"
              disabled={!!deactivateBlockedReason}
              title={deactivateBlockedReason ?? undefined}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              onClick={() => openModal(setDeactivateOpen)}
            >
              <Ban className="h-4 w-4" /> Deactivate Admin
            </button>
          ) : (
            <button
              role="menuitem"
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                setMenuOpen(false);
                handleReactivate();
              }}
            >
              <Power className="h-4 w-4" /> Reactivate Admin
            </button>
          )}
          <button
            role="menuitem"
            type="button"
            disabled={!!deleteBlockedReason}
            title={deleteBlockedReason ?? undefined}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            onClick={() => openModal(setDeleteOpen)}
          >
            <Trash2 className="h-4 w-4" /> Delete Admin
          </button>
        </div>
      )}

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Admin">
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`edit-name-${admin.id}`}>Name</Label>
            <Input id={`edit-name-${admin.id}`} name="name" defaultValue={admin.name} required maxLength={120} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`edit-email-${admin.id}`}>Email</Label>
            <Input id={`edit-email-${admin.id}`} name="email" type="email" defaultValue={admin.email} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`edit-role-${admin.id}`}>Role</Label>
            <Select id={`edit-role-${admin.id}`} name="role" defaultValue={admin.role}>
              <option value="ADMIN" disabled={admin.isLastActiveOwner}>
                Admin
              </option>
              <option value="OWNER">Owner</option>
            </Select>
            {admin.isLastActiveOwner && (
              <p className="text-xs text-muted-foreground">
                This is the only active owner, so their role can&apos;t be changed away from Owner.
              </p>
            )}
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset password modal */}
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title={`Reset password for ${admin.name}`}>
        <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Set a new temporary password for this admin. They&apos;ll need it to log in next.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`new-password-${admin.id}`}>New Password</Label>
            <Input
              id={`new-password-${admin.id}`}
              name="newPassword"
              type="password"
              required
              minLength={8}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`confirm-password-${admin.id}`}>Confirm Password</Label>
            <Input
              id={`confirm-password-${admin.id}`}
              name="confirmPassword"
              type="password"
              required
              minLength={8}
            />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox id={`require-change-${admin.id}`} name="requireChange" defaultChecked />
            <Label htmlFor={`require-change-${admin.id}`} className="font-normal leading-snug">
              Require this admin to change their password the next time they log in
            </Label>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate modal */}
      <Modal open={deactivateOpen} onClose={() => setDeactivateOpen(false)} title="Deactivate this admin?">
        <p className="text-sm text-muted-foreground">
          <strong>{admin.name}</strong> will no longer be able to log in, and
          their current session (if any) will be denied on their next
          request. Their account and activity history remain in the system
          and can be restored anytime by reactivating.
        </p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setDeactivateOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDeactivate} disabled={submitting}>
            {submitting ? "Deactivating..." : "Deactivate Admin"}
          </Button>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteConfirmText("");
        }}
        title="Permanently delete this admin?"
      >
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            This will permanently remove <strong>{admin.name}</strong>&apos;s
            admin account ({admin.email}). This admin has no activity
            history, so nothing else is affected. This cannot be undone.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`delete-confirm-${admin.id}`}>
              Type <span className="font-mono">{admin.email}</span> to confirm
            </Label>
            <Input
              id={`delete-confirm-${admin.id}`}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
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
    </div>
  );
}
