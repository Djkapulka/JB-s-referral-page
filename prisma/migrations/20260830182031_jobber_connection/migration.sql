-- CreateTable
CREATE TABLE "JobberConnection" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT NOT NULL,
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "connectedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobberConnection_pkey" PRIMARY KEY ("id")
);
