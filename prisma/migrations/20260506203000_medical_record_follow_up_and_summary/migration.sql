-- Add structured follow-up fields to medical records for better longitudinal care.
ALTER TABLE "MedicalRecord"
ADD COLUMN "clinicalSummary" TEXT NOT NULL DEFAULT '',
ADD COLUMN "followUpAt" TEXT NOT NULL DEFAULT '';
