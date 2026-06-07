CREATE TABLE "MedicalRecordAttachment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "medicalRecordId" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileBytes" BYTEA,
    "extractedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MedicalRecordAttachment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MedicalRecordAttachment_userId_memberId_createdAt_idx" ON "MedicalRecordAttachment"("userId", "memberId", "createdAt" DESC);
CREATE INDEX "MedicalRecordAttachment_userId_medicalRecordId_idx" ON "MedicalRecordAttachment"("userId", "medicalRecordId");
ALTER TABLE "MedicalRecordAttachment" ADD CONSTRAINT "MedicalRecordAttachment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicalRecordAttachment" ADD CONSTRAINT "MedicalRecordAttachment_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MedicalRecordAttachment" ADD CONSTRAINT "MedicalRecordAttachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
