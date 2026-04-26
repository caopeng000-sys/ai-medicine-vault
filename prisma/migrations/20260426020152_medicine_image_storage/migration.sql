-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "imageBytes" BYTEA,
ADD COLUMN     "imageMimeType" TEXT,
ADD COLUMN     "imageName" TEXT;
