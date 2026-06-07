-- CreateTable
CREATE TABLE "HealthDocumentChunk" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memberId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthDocumentChunk_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HealthDocumentChunk_userId_sourceType_sourceId_key" ON "HealthDocumentChunk"("userId", "sourceType", "sourceId");
CREATE INDEX "HealthDocumentChunk_userId_memberId_idx" ON "HealthDocumentChunk"("userId", "memberId");
ALTER TABLE "HealthDocumentChunk" ADD CONSTRAINT "HealthDocumentChunk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
