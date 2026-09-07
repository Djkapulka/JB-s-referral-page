import { getAdminSession } from "@/lib/auth";
import { getAdminList } from "@/lib/admin-management";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddAdminForm } from "@/components/admin/add-admin-form";
import { AdminActionsMenu } from "@/components/admin/admin-actions-menu";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const session = await getAdminSession();
  const admins = await getAdminList();
  const isOwner = session?.role === "OWNER";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Users</h1>
          <p className="text-muted-foreground">
            People who can log into the JB&apos;s admin dashboard.
          </p>
        </div>
        {isOwner && <AddAdminForm />}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Status</th>
                {isOwner && <th className="p-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {a.name}
                      {a.id === session?.adminId && (
                        <Badge variant="default">You</Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{a.email}</td>
                  <td className="p-3">
                    <Badge variant={a.role === "OWNER" ? "accent" : "default"}>{a.role}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant={a.isActive ? "success" : "muted"}>
                      {a.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  {isOwner && (
                    <td className="p-3 text-right">
                      <AdminActionsMenu admin={a} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {!isOwner && (
        <p className="text-sm text-muted-foreground">
          Only an owner-level admin can manage admin accounts.
        </p>
      )}
    </div>
  );
}
