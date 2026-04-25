-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('男', '女');

-- CreateEnum
CREATE TYPE "AllergySeverity" AS ENUM ('轻微', '中等', '严重');

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "birthYear" INTEGER,
    "gender" "Gender" NOT NULL DEFAULT '男',
    "allergySummary" TEXT NOT NULL DEFAULT '暂无明确过敏摘要。',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "symptoms" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "doctorAdvice" TEXT NOT NULL,
    "prescriptionNote" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "specification" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "storageLocation" TEXT NOT NULL,
    "usageNote" TEXT NOT NULL,
    "safetyNote" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllergyRecord" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "severity" "AllergySeverity" NOT NULL,
    "discoveredAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllergyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitPreparation" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "concern" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "questions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitPreparation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Member_name_idx" ON "Member"("name");

-- CreateIndex
CREATE INDEX "MedicalRecord_memberId_visitedAt_idx" ON "MedicalRecord"("memberId", "visitedAt" DESC);

-- CreateIndex
CREATE INDEX "Medicine_memberId_expiresAt_idx" ON "Medicine"("memberId", "expiresAt" ASC);

-- CreateIndex
CREATE INDEX "AllergyRecord_memberId_discoveredAt_idx" ON "AllergyRecord"("memberId", "discoveredAt" DESC);

-- CreateIndex
CREATE INDEX "VisitPreparation_memberId_createdAt_idx" ON "VisitPreparation"("memberId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllergyRecord" ADD CONSTRAINT "AllergyRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitPreparation" ADD CONSTRAINT "VisitPreparation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
