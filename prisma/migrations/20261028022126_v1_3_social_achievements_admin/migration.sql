-- CreateEnum
CREATE TYPE "AchievementVisibility" AS ENUM ('PUBLIC', 'HINT', 'SECRET');

-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('AVANZADA', 'COMUNIDAD', 'ESPECIAL', 'SECRETO');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'LOGRO_DESBLOQUEADO';

-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_leaders" DROP CONSTRAINT "activity_leaders_assigned_by_id_fkey";

-- DropForeignKey
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_ratified_by_id_fkey";

-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_uploaded_by_id_fkey";

-- DropForeignKey
ALTER TABLE "logbook_entries" DROP CONSTRAINT "logbook_entries_author_id_fkey";

-- DropForeignKey
ALTER TABLE "route_sheets" DROP CONSTRAINT "route_sheets_uploaded_by_id_fkey";

-- DropForeignKey
ALTER TABLE "user_badges" DROP CONSTRAINT "user_badges_granted_by_id_fkey";

-- AlterTable
ALTER TABLE "activities" ALTER COLUMN "created_by_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "activity_leaders" ALTER COLUMN "assigned_by_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "attendance_records" ALTER COLUMN "ratified_by_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "files" ALTER COLUMN "uploaded_by_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_badges" ALTER COLUMN "granted_by_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "hint" TEXT,
    "icon" VARCHAR(40) NOT NULL,
    "category" "AchievementCategory" NOT NULL DEFAULT 'AVANZADA',
    "visibility" "AchievementVisibility" NOT NULL DEFAULT 'PUBLIC',
    "points" INTEGER NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "awarded_by_id" UUID,
    "note" TEXT,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

-- CreateIndex
CREATE INDEX "achievements_category_visibility_idx" ON "achievements"("category", "visibility");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_idx" ON "user_achievements"("user_id");

-- CreateIndex
CREATE INDEX "user_achievements_achievement_id_idx" ON "user_achievements"("achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_awarded_by_id_fkey" FOREIGN KEY ("awarded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_leaders" ADD CONSTRAINT "activity_leaders_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_ratified_by_id_fkey" FOREIGN KEY ("ratified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_sheets" ADD CONSTRAINT "route_sheets_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
