-- Create the development user first, then attach existing local data to it.
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

INSERT INTO "User" ("id", "email", "name", "createdAt", "updatedAt")
VALUES ('user-development', 'dev@medicine-vault.local', '开发环境用户', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "Member" ADD COLUMN "userId" TEXT;
ALTER TABLE "MedicalRecord" ADD COLUMN "userId" TEXT;
ALTER TABLE "Medicine" ADD COLUMN "userId" TEXT;
ALTER TABLE "AllergyRecord" ADD COLUMN "userId" TEXT;
ALTER TABLE "VisitPreparation" ADD COLUMN "userId" TEXT;

UPDATE "Member"
SET "userId" = 'user-development'
WHERE "userId" IS NULL;

UPDATE "MedicalRecord" record
SET "userId" = member."userId"
FROM "Member" member
WHERE record."memberId" = member."id"
  AND record."userId" IS NULL;

UPDATE "Medicine" medicine
SET "userId" = member."userId"
FROM "Member" member
WHERE medicine."memberId" = member."id"
  AND medicine."userId" IS NULL;

UPDATE "AllergyRecord" record
SET "userId" = member."userId"
FROM "Member" member
WHERE record."memberId" = member."id"
  AND record."userId" IS NULL;

UPDATE "VisitPreparation" preparation
SET "userId" = member."userId"
FROM "Member" member
WHERE preparation."memberId" = member."id"
  AND preparation."userId" IS NULL;

ALTER TABLE "Member" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "MedicalRecord" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Medicine" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "AllergyRecord" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "VisitPreparation" ALTER COLUMN "userId" SET NOT NULL;

CREATE INDEX "Member_userId_name_idx" ON "Member"("userId", "name");
CREATE INDEX "MedicalRecord_userId_memberId_visitedAt_idx" ON "MedicalRecord"("userId", "memberId", "visitedAt" DESC);
CREATE INDEX "Medicine_userId_memberId_expiresAt_idx" ON "Medicine"("userId", "memberId", "expiresAt" ASC);
CREATE INDEX "AllergyRecord_userId_memberId_discoveredAt_idx" ON "AllergyRecord"("userId", "memberId", "discoveredAt" DESC);
CREATE INDEX "VisitPreparation_userId_memberId_createdAt_idx" ON "VisitPreparation"("userId", "memberId", "createdAt" DESC);

ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AllergyRecord" ADD CONSTRAINT "AllergyRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VisitPreparation" ADD CONSTRAINT "VisitPreparation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
