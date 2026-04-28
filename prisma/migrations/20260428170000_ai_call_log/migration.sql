-- CreateTable
CREATE TABLE "AiCallLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "routeKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "inputBytes" INTEGER NOT NULL DEFAULT 0,
    "outputBytes" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCallLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiCallLog_userId_routeKey_createdAt_idx" ON "AiCallLog"("userId", "routeKey", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "AiCallLog" ADD CONSTRAINT "AiCallLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
