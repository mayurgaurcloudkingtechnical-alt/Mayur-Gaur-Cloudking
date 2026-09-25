-- CreateTable
CREATE TABLE IF NOT EXISTS "user_device_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "deviceId" TEXT,
    "deviceName" TEXT,
    "platform" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_device_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_device_sessions_tokenHash_key" ON "user_device_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_device_sessions_userId_idx" ON "user_device_sessions"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_device_sessions_tokenHash_idx" ON "user_device_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_device_sessions_expiresAt_idx" ON "user_device_sessions"("expiresAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_device_sessions_userId_fkey'
    ) THEN
        ALTER TABLE "user_device_sessions" ADD CONSTRAINT "user_device_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
