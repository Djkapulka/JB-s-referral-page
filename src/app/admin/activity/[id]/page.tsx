import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import { getActivityLogEntry, ACTIVITY_ACTION_LABELS } from "@/lib/activity-log";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ActivityLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (session?.role !== "OWNER") {
    redirect("/admin/dashboard");
  }

  const { id } = await params;
  const entry = await getActivityLogEntry(id);
  if (!entry) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/activity" className="text-sm text-brand hover:underline">
          &larr; Back to Activity Log
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{entry.description}</h1>
        <p className="text-muted-foreground">
          {entry.createdAt.toLocaleString("en-US", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <Row label="Action" value={<Badge>{ACTIVITY_ACTION_LABELS[entry.action]}</Badge>} />
          <Row label="Performed by" value={`${entry.adminName} (${entry.adminEmail})`} />
          {entry.targetType && (
            <Row label="Target" value={`${entry.targetType}${entry.targetId ? ` — ${entry.targetId}` : ""}`} />
          )}
        </CardContent>
      </Card>

      {entry.metadata != null && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
