"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CustomerResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  referralCode: string;
};

export function ReferralVerificationForm({
  referralId,
  prefill,
}: {
  referralId: string;
  prefill: { firstName: string; lastName: string; email: string; phone: string };
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"search" | "create">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.customers ?? []);
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function attachCustomer(customerId: string) {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/admin/referrals/${referralId}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message ?? "Failed to attach customer.");
      return;
    }
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/referrals/${referralId}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        createCustomer: {
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
        },
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message ?? "Failed to create customer.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "search" ? "default" : "outline"}
          onClick={() => setMode("search")}
        >
          Attach Existing Customer
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "create" ? "default" : "outline"}
          onClick={() => setMode("create")}
        >
          Create New Customer
        </Button>
      </div>

      {mode === "search" ? (
        <div className="flex flex-col gap-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              className="min-w-0 flex-1"
              placeholder="Search by name, email, phone, or referral code"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="submit" variant="outline" disabled={searching} className="shrink-0">
              {searching ? "Searching..." : "Search"}
            </Button>
          </form>

          {results.length > 0 && (
            <ul className="flex flex-col gap-2">
              {results.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {c.firstName} {c.lastName} ({c.referralCode})
                    </p>
                    <p className="text-muted-foreground">
                      {c.email ?? "—"} · {c.phone ?? "—"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={submitting}
                    onClick={() => attachCustomer(c.id)}
                  >
                    Attach
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="verifyFirstName">First Name</Label>
              <Input
                id="verifyFirstName"
                name="firstName"
                required
                maxLength={80}
                defaultValue={prefill.firstName}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="verifyLastName">Last Name</Label>
              <Input
                id="verifyLastName"
                name="lastName"
                required
                maxLength={80}
                defaultValue={prefill.lastName}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="verifyEmail">Email</Label>
            <Input id="verifyEmail" name="email" type="email" defaultValue={prefill.email} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="verifyPhone">Phone</Label>
            <Input id="verifyPhone" name="phone" type="tel" defaultValue={prefill.phone} />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create & Attach Customer"}
          </Button>
        </form>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
