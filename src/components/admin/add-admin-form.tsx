"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AddAdminForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: formData.get("role"),
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message ?? "Failed to add admin.");
      return;
    }

    setOpen(false);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        + Add Admin
      </Button>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Add Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required maxLength={120} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Temporary Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" defaultValue="ADMIN">
              <option value="ADMIN">Admin</option>
              <option value="OWNER">Owner</option>
            </Select>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Admin"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
