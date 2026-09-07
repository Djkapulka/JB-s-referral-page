-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('ADMIN_CREATED', 'ADMIN_EDITED', 'ADMIN_ROLE_CHANGED', 'ADMIN_DEACTIVATED', 'ADMIN_REACTIVATED', 'ADMIN_PASSWORD_RESET', 'ADMIN_DELETED', 'CUSTOMER_CREATED', 'CUSTOMER_DELETED', 'CUSTOMER_LINK_DEACTIVATED', 'CUSTOMER_LINK_REACTIVATED', 'REFERRAL_STATUS_CHANGED', 'REWARD_STATUS_CHANGED', 'SETTINGS_CHANGED');

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_adminId_idx" ON "ActivityLog"("adminId");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_targetType_targetId_idx" ON "ActivityLog"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
