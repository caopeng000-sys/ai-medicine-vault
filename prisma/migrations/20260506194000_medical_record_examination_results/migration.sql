-- Add examination results to medical records for a more structured visit summary.
ALTER TABLE "MedicalRecord"
ADD COLUMN "examinationResults" TEXT NOT NULL DEFAULT '';
