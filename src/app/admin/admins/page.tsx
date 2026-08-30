import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddAdminForm } from "@/components/admin/add-admin-form";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const session = await getAdminSession();
  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Users</h1>
          <p className="text-muted-foreground">
            People who can log into the JB&apos;s admin dashboard.
          </p>
        </div>
        {session?.role === "OWNER" && <AddAdminForm />}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="p-3">{a.name}</td>
                  <td className="p-3">{a.email}</td>
                  <td className="p-3">
                    <Badge variant={a.role === "OWNER" ? "accent" : "default"}>{a.role}</Badge>
                  </td>
                  <td className="p-3">
                    {a.lastLoginAt ? a.lastLoginAt.toLocaleString() : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {session?.role !== "OWNER" && (
        <p className="text-sm text-muted-foreground">
          Only an owner-level admin can add new admin accounts.
        </p>
      )}
    </div>
  );
}
