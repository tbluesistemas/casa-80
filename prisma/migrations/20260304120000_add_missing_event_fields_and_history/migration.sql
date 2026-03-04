-- AlterTable: Add financial fields to Event
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "deposit"  DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "transport" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "discount"  DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- CreateTable: EventHistory
CREATE TABLE IF NOT EXISTS "EventHistory" (
    "id"             TEXT NOT NULL,
    "eventId"        TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus"      TEXT NOT NULL,
    "changedBy"      TEXT,
    "reason"         TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'EventHistory_eventId_fkey'
    ) THEN
        ALTER TABLE "EventHistory"
            ADD CONSTRAINT "EventHistory_eventId_fkey"
            FOREIGN KEY ("eventId") REFERENCES "Event"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
