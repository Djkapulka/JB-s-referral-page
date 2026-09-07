import "server-only";
import { prisma } from "@/lib/db";
import type { ActivityAction, Prisma } from "@/generated/prisma/client";

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  ADMIN_CREATED: "Admin account created",
  ADMIN_EDITED: "Admin account edited",
  ADMIN_ROLE_CHANGED: "Admin role changed",
  ADMIN_DEACTIVATED: "Admin account deactivated",
  ADMIN_REACTIVATED: "Admin account reactivated",
  ADMIN_PASSWORD_RESET: "Admin password reset",
  ADMIN_DELETED: "Admin account deleted",
  CUSTOMER_CREATED: "Customer created",
  CUSTOMER_DELETED: "Customer permanently deleted",
  CUSTOMER_LINK_DEACTIVATED: "Customer referral link deactivated",
  CUSTOMER_LINK_REACTIVATED: "Customer referral link reactivated",
  REFERRAL_STATUS_CHANGED: "Referral status changed",
  REWARD_STATUS_CHANGED: "Reward status changed",
  SETTINGS_CHANGED: "Referral settings changed",
};

export const ACTIVITY_ACTION_CATEGORIES: { label: string; actions: ActivityAction[] }[] = [
  {
    label: "Admin management",
    actions: [
      "ADMIN_CREATED",
      "ADMIN_EDITED",
      "ADMIN_ROLE_CHANGED",
      "ADMIN_DEACTIVATED",
      "ADMIN_REACTIVATED",
      "ADMIN_PASSWORD_RESET",
      "ADMIN_DELETED",
    ],
  },
  {
    label: "Customer management",
    actions: [
      "CUSTOMER_CREATED",
      "CUSTOMER_DELETED",
      "CUSTOMER_LINK_DEACTIVATED",
      "CUSTOMER_LINK_REACTIVATED",
    ],
  },
  {
    label: "Referral & reward management",
    actions: ["REFERRAL_STATUS_CHANGED", "REWARD_STATUS_CHANGED"],
  },
  {
    label: "Settings",
    actions: ["SETTINGS_CHANGED"],
  },
];

/**
 * Records one audit event. Best-effort: a logging failure is swallowed
 * (after being reported to the server log) rather than rolling back or
 * failing the primary action it describes, which has already succeeded by
 * the time this is called. Never pass password/hash/token values in
 * `metadata` — it's stored as-is and surfaced in the Activity Log UI.
 */
export async function logActivity({
  admin,
  action,
  targetType,
  targetId,
  description,
  metadata,
}: {
  admin: { adminId: string; name: string; email: string };
  action: ActivityAction;
  targetType?: string;
  targetId?: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        adminId: admin.adminId,
        adminName: admin.name,
        adminEmail: admin.email,
        action,
        targetType,
        targetId,
        description,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    console.error("Failed to write activity log", err);
  }
}

const PAGE_SIZE = 25;

export async function getActivityLog({
  page = 1,
  adminId,
  action,
  dateFrom,
  dateTo,
}: {
  page?: number;
  adminId?: string;
  action?: ActivityAction;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const where: Prisma.ActivityLogWhereInput = {
    ...(adminId && { adminId }),
    ...(action && { action }),
    ...((dateFrom || dateTo) && {
      createdAt: {
        ...(dateFrom && { gte: dateFrom }),
        ...(dateTo && { lte: dateTo }),
      },
    }),
  };

  const safePage = Math.max(1, page);

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    items,
    total,
    page: safePage,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getActivityLogEntry(id: string) {
  return prisma.activityLog.findUnique({ where: { id } });
}

export async function getActivityLogAdminOptions() {
  return prisma.adminUser.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}
