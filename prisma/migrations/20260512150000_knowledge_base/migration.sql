-- Add lightweight RAG knowledge base tables.
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "keywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KnowledgeDocument_userId_title_idx" ON "KnowledgeDocument"("userId", "title");
CREATE INDEX "KnowledgeDocument_userId_category_idx" ON "KnowledgeDocument"("userId", "category");
CREATE INDEX "KnowledgeDocument_userId_source_idx" ON "KnowledgeDocument"("userId", "source");
CREATE INDEX "KnowledgeDocument_userId_createdAt_idx" ON "KnowledgeDocument"("userId", "createdAt" DESC);
CREATE INDEX "KnowledgeChunk_userId_documentId_chunkIndex_idx" ON "KnowledgeChunk"("userId", "documentId", "chunkIndex");
CREATE INDEX "KnowledgeChunk_userId_createdAt_idx" ON "KnowledgeChunk"("userId", "createdAt" DESC);

ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
