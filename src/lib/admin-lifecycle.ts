import "server-only";
import { prisma } from "@/lib/db";

/**
 * True when `admin` is currently an active OWNER and there is no other
 * active OWNER to fall back on — i.e. touching their role/active-status
 * would leave the application with zero active owners. Used to block
 * role-downgrade, deactivation, and deletion, not just for self-service.
 */
export async function isLastActiveOwner(admin: {
  role: "OWNER" | "ADMIN";
  isActive: boolean;
}): Promise<boolean> {
  if (admin.role !== "OWNER" || !admin.isActive) return false;
  const activeOwnerCount = await prisma.adminUser.count({
    where: { role: "OWNER", isActive: true },
  });
  return activeOwnerCount <= 1;
}
