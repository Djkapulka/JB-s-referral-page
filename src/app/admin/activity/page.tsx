import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import {
  ACTIVITY_ACTION_CATEGORIES,
  ACTIVITY_ACTION_LABELS,
  getActivityLog,
  getActivityLogAdminOptions,
} from "@/lib/activity-log";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActivityAction } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    adminId?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const session = await getAdminSession();
  if (session?.role !== "OWNER") {
    redirect("/admin/dashboard");
  }

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const action = params.action as ActivityAction | undefined;
  const dateFrom = params.from ? new Date(`${params.from}T00:00:00`) : undefined;
  const dateTo = params.to ? new Date(`${params.to}T23:59:59`) : undefined;

  const [{ items, total, totalPages }, admins] = await Promise.all([
    getActivityLog({ page, adminId: params.adminId, action, dateFrom, dateTo }),
    getActivityLogAdminOptions(),
  ]);

  function pageHref(targetPage: number) {
    const qs = new URLSearchParams();
    if (params.adminId) qs.set("adminId", params.adminId);
    if (params.action) qs.set("action", params.action);
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    qs.set("page", String(targetPage));
    return `/admin/activity?${qs.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground">
          Important actions taken by admins across the referral system.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="adminId">
            Admin
          </label>
          <Select id="adminId" name="adminId" defaultValue={params.adminId ?? ""} className="min-w-[180px]">
            <option value="">All admins</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="action">
            Action
          </label>
          <Select id="action" name="action" defaultValue={params.action ?? ""} className="min-w-[200px]">
            <option value="">All actions</option>
            {ACTIVITY_ACTION_CATEGORIES.map((category) => (
              <optgroup key={category.label} label={category.label}>
                {category.actions.map((a) => (
                  <option key={a} value={a}>
                    {ACTIVITY_ACTION_LABELS[a]}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="from">
            From
          </label>
          <Input id="from" name="from" type="date" defaultValue={params.from} className="w-auto" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="to">
            To
          </label>
          <Input id="to" name="to" type="date" defaultValue={params.to} className="w-auto" />
        </div>
        <Button type="submit" variant="outline">
          Filter
        </Button>
        {(params.adminId || params.action || params.from || params.to) && (
          <Link href="/admin/activity">
            <Button type="button" variant="ghost">
              Clear
            </Button>
          </Link>
        )}
      </form>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="p-3 font-medium">Activity</th>
                <th className="p-3 font-medium">Admin</th>
                <th className="p-3 font-medium">Date/Time</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-muted-foreground">
                    No activity found.
                  </td>
                </tr>
              )}
              {items.map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <Link
                      href={`/admin/activity/${entry.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {entry.description}
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground">{entry.adminName}</td>
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {entry.createdAt.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)}>
                <Button type="button" variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageHref(page + 1)}>
                <Button type="button" variant="outline" size="sm">
                  Next
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
