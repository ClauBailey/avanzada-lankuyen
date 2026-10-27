-- CreateEnum
CREATE TYPE "LogbookEntryStatus" AS ENUM ('PENDIENTE_APROBACION', 'PUBLICADA', 'RECHAZADA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'BITACORA_ENVIADA';
ALTER TYPE "NotificationType" ADD VALUE 'BITACORA_APROBADA';
ALTER TYPE "NotificationType" ADD VALUE 'BITACORA_RECHAZADA';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_logbook_keeper" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "logbook_entries" (
    "id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "adventure_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content_md" TEXT NOT NULL,
    "status" "LogbookEntryStatus" NOT NULL DEFAULT 'PENDIENTE_APROBACION',
    "page_number" INTEGER,
    "author_id" UUID NOT NULL,
    "activity_id" UUID,
    "photo_file_id" UUID,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "rejection_reason" TEXT,
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "logbook_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "logbook_entries_page_number_key" ON "logbook_entries"("page_number");

-- CreateIndex
CREATE INDEX "logbook_entries_status_page_number_idx" ON "logbook_entries"("status", "page_number");

-- CreateIndex
CREATE INDEX "logbook_entries_adventure_date_idx" ON "logbook_entries"("adventure_date");

-- CreateIndex
CREATE INDEX "logbook_entries_author_id_idx" ON "logbook_entries"("author_id");

-- CreateIndex
CREATE INDEX "logbook_entries_activity_id_idx" ON "logbook_entries"("activity_id");

-- AddForeignKey
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_photo_file_id_fkey" FOREIGN KEY ("photo_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
