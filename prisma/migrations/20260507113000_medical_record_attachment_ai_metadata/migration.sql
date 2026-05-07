-- Persist AI summaries for medical record attachments.
ALTER TABLE "MedicalRecordAttachment"
ADD COLUMN "aiDocumentType" TEXT NOT NULL DEFAULT '',
ADD COLUMN "aiSummary" TEXT NOT NULL DEFAULT '',
ADD COLUMN "aiKeyFindings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "aiSuggestedFollowUp" TEXT NOT NULL DEFAULT '',
ADD COLUMN "aiOriginalText" TEXT NOT NULL DEFAULT '',
ADD COLUMN "aiWarnings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "aiExtractedAt" TIMESTAMP(3);
