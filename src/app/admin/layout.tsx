import Link from "next/link";
import { getAdminSession } from "@/lib/auth";
import { LogoutButton } from "@/components/admin/logout-button";

const NAV_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/referrals", label: "Referrals" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/admins", label: "Admin Users" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  return (
    <div className="flex min-h-screen w-full flex-col">
      {session && (
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <div className="flex items-center gap-6">
              <span className="text-lg font-bold text-brand">
                JB&apos;s Admin
              </span>
              <nav className="flex flex-wrap gap-4 text-sm font-medium">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">{session.name}</span>
              <LogoutButton />
            </div>
          </div>
        </header>
      )}
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </div>
    </div>
  );
}
