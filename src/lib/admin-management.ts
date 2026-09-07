import "server-only";
import { prisma } from "@/lib/db";

export async function getAdminList() {
  const [admins, activeOwnerCount] = await Promise.all([
    prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { activityLogs: true } } },
    }),
    prisma.adminUser.count({ where: { role: "OWNER", isActive: true } }),
  ]);

  return admins.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    isActive: a.isActive,
    lastLoginAt: a.lastLoginAt,
    hasActivityHistory: a._count.activityLogs > 0,
    isLastActiveOwner: a.role === "OWNER" && a.isActive && activeOwnerCount <= 1,
  }));
}
