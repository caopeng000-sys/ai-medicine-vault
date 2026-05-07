-- Add attachments for prescriptions, examination reports and visit documents.
CREATE TABLE "MedicalRecordAttachment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT '检查报告',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalRecordAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MedicalRecordAttachment_userId_recordId_createdAt_idx" ON "MedicalRecordAttachment"("userId", "recordId", "createdAt" DESC);

ALTER TABLE "MedicalRecordAttachment" ADD CONSTRAINT "MedicalRecordAttachment_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicalRecordAttachment" ADD CONSTRAINT "MedicalRecordAttachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
