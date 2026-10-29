-- CreateEnum
CREATE TYPE "ReferrerVerificationStatus" AS ENUM ('VERIFIED', 'NEEDS_VERIFICATION');

-- AlterEnum
ALTER TYPE "ActivityAction" ADD VALUE 'REFERRAL_VERIFIED';

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "referrerEmail" TEXT,
ADD COLUMN     "referrerFirstName" TEXT,
ADD COLUMN     "referrerLastName" TEXT,
ADD COLUMN     "referrerPhone" TEXT,
ADD COLUMN     "referrerVerificationStatus" "ReferrerVerificationStatus" NOT NULL DEFAULT 'VERIFIED',
ALTER COLUMN "referrerId" DROP NOT NULL,
ALTER COLUMN "leadPhone" DROP NOT NULL,
ALTER COLUMN "leadEmail" DROP NOT NULL,
ALTER COLUMN "leadAddress" DROP NOT NULL,
ALTER COLUMN "leadCity" DROP NOT NULL,
ALTER COLUMN "leadZip" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Referral_referrerVerificationStatus_idx" ON "Referral"("referrerVerificationStatus");
