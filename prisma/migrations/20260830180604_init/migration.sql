-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('HOUSE_WASHING', 'WINDOW_CLEANING', 'PRESSURE_WASHING', 'GUTTER_CLEANING', 'ROOF_WASHING', 'OTHER');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('SUBMITTED', 'CONTACTED', 'ESTIMATE_SENT', 'BOOKED', 'JOB_COMPLETED', 'REWARD_EARNED', 'REWARD_PAID');

-- CreateEnum
CREATE TYPE "ReferralEventType" AS ENUM ('STATUS_CHANGE', 'NOTE', 'JOBBER_SYNC', 'NOTIFICATION_SENT');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('SERVICE_CREDIT', 'GIFT_CARD');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('PENDING', 'EARNED', 'PAID', 'VOIDED');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'ADMIN');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "jobberCustomerId" TEXT,
    "referralCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "leadFirstName" TEXT NOT NULL,
    "leadLastName" TEXT NOT NULL,
    "leadPhone" TEXT NOT NULL,
    "leadEmail" TEXT NOT NULL,
    "leadAddress" TEXT NOT NULL,
    "leadCity" TEXT NOT NULL,
    "leadZip" TEXT NOT NULL,
    "serviceRequested" "ServiceType" NOT NULL,
    "consentGiven" BOOLEAN NOT NULL,
    "consentText" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'SUBMITTED',
    "estimatedJobValue" DECIMAL(10,2),
    "actualJobValue" DECIMAL(10,2),
    "jobberClientId" TEXT,
    "jobberQuoteId" TEXT,
    "jobberJobId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'referral_page',
    "duplicateOfId" TEXT,
    "submittedIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralEvent" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "eventType" "ReferralEventType" NOT NULL,
    "fromStatus" "ReferralStatus",
    "toStatus" "ReferralStatus",
    "note" TEXT,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rewardType" "RewardType" NOT NULL,
    "rewardAmount" DECIMAL(10,2) NOT NULL,
    "status" "RewardStatus" NOT NULL DEFAULT 'PENDING',
    "earnedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "referredDiscountAmount" DECIMAL(10,2) NOT NULL DEFAULT 25,
    "referrerCreditAmount" DECIMAL(10,2) NOT NULL DEFAULT 50,
    "referrerGiftCardAmount" DECIMAL(10,2) NOT NULL DEFAULT 25,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByAdminId" TEXT,

    CONSTRAINT "ReferralSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_jobberCustomerId_key" ON "Customer"("jobberCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_referralCode_key" ON "Customer"("referralCode");

-- CreateIndex
CREATE INDEX "Customer_jobberCustomerId_idx" ON "Customer"("jobberCustomerId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE INDEX "Referral_leadPhone_idx" ON "Referral"("leadPhone");

-- CreateIndex
CREATE INDEX "Referral_leadEmail_idx" ON "Referral"("leadEmail");

-- CreateIndex
CREATE INDEX "Referral_createdAt_idx" ON "Referral"("createdAt");

-- CreateIndex
CREATE INDEX "ReferralEvent_referralId_idx" ON "ReferralEvent"("referralId");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_referralId_key" ON "Reward"("referralId");

-- CreateIndex
CREATE INDEX "Reward_customerId_idx" ON "Reward"("customerId");

-- CreateIndex
CREATE INDEX "Reward_status_idx" ON "Reward"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralEvent" ADD CONSTRAINT "ReferralEvent_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
