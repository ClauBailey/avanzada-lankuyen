/*
  Warnings:

  - You are about to drop the column `affectivity_score` on the `activity_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `character_score` on the `activity_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `activity_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `corporality_score` on the `activity_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `creativity_score` on the `activity_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `sociability_score` on the `activity_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `spirituality_score` on the `activity_evaluations` table. All the data in the column will be lost.
  - Added the required column `objective_achievement_level` to the `activity_evaluations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SymbolicMoment" AS ENUM ('BIENVENIDA_INVESTIDURA', 'SENDERO', 'CUMBRE', 'PROMESA', 'PASO_AL_CLAN');

-- CreateEnum
CREATE TYPE "PromiseFormula" AS ENUM ('LEY_GUIA', 'LEY_SCOUT', 'LEY');

-- CreateEnum
CREATE TYPE "PromiseStatus" AS ENUM ('PREPARACION', 'SOLICITADA', 'CELEBRADA');

-- CreateEnum
CREATE TYPE "CompetencyArea" AS ENUM ('CULTURA', 'TRABAJO_EN_EQUIPO', 'INNOVACION', 'COMUNICACION', 'CIUDADANIA', 'MEDIOAMBIENTE', 'VIDA_AIRE_LIBRE_Y_DEPORTES');

-- CreateEnum
CREATE TYPE "ObjectiveAchievementLevel" AS ENUM ('LOGRADO_PLENAMENTE', 'LOGRADO_PARCIALMENTE', 'NO_LOGRADO_REPLANTEAR');

-- CreateEnum
CREATE TYPE "DevelopmentArea" AS ENUM ('CORPORALIDAD', 'CREATIVIDAD', 'CARACTER', 'AFECTIVIDAD', 'SOCIABILIDAD', 'ESPIRITUALIDAD');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PROMESA_SOLICITADA';
ALTER TYPE "NotificationType" ADD VALUE 'COMPETENCIA_RECONOCIDA';

-- AlterTable
-- Se agregan primero las columnas cualitativas y se migran los datos previos
-- antes de eliminar las escalas numéricas 1..7.
ALTER TABLE "activity_evaluations"
  ADD COLUMN "emotional_resonance" TEXT,
  ADD COLUMN "experienced_areas" "DevelopmentArea"[] DEFAULT ARRAY[]::"DevelopmentArea"[],
  ADD COLUMN "learnings_for_next_time" TEXT,
  ADD COLUMN "objective_achievement_level" "ObjectiveAchievementLevel",
  ADD COLUMN "organization_feedback" TEXT;

-- Migración de datos: promedio de las seis notas 1..7 a nivel cualitativo.
-- 6-7 → LOGRADO_PLENAMENTE · 4-5 → LOGRADO_PARCIALMENTE · 1-3 → NO_LOGRADO_REPLANTEAR
UPDATE "activity_evaluations"
SET
  "objective_achievement_level" = CASE
    WHEN (
      "affectivity_score" + "corporality_score" + "spirituality_score"
      + "character_score" + "creativity_score" + "sociability_score"
    ) / 6.0 >= 6 THEN 'LOGRADO_PLENAMENTE'::"ObjectiveAchievementLevel"
    WHEN (
      "affectivity_score" + "corporality_score" + "spirituality_score"
      + "character_score" + "creativity_score" + "sociability_score"
    ) / 6.0 >= 4 THEN 'LOGRADO_PARCIALMENTE'::"ObjectiveAchievementLevel"
    ELSE 'NO_LOGRADO_REPLANTEAR'::"ObjectiveAchievementLevel"
  END,
  "experienced_areas" = ARRAY_REMOVE(
    ARRAY[
      CASE WHEN "corporality_score" >= 5 THEN 'CORPORALIDAD'::"DevelopmentArea" END,
      CASE WHEN "creativity_score" >= 5 THEN 'CREATIVIDAD'::"DevelopmentArea" END,
      CASE WHEN "character_score" >= 5 THEN 'CARACTER'::"DevelopmentArea" END,
      CASE WHEN "affectivity_score" >= 5 THEN 'AFECTIVIDAD'::"DevelopmentArea" END,
      CASE WHEN "sociability_score" >= 5 THEN 'SOCIABILIDAD'::"DevelopmentArea" END,
      CASE WHEN "spirituality_score" >= 5 THEN 'ESPIRITUALIDAD'::"DevelopmentArea" END
    ],
    NULL
  ),
  -- El comentario abierto previo se conserva como observación de organización.
  "organization_feedback" = "comment";

ALTER TABLE "activity_evaluations"
  ALTER COLUMN "objective_achievement_level" SET NOT NULL,
  ALTER COLUMN "experienced_areas" SET NOT NULL,
  ALTER COLUMN "experienced_areas" SET DEFAULT ARRAY[]::"DevelopmentArea"[],
  DROP COLUMN "affectivity_score",
  DROP COLUMN "character_score",
  DROP COLUMN "comment",
  DROP COLUMN "corporality_score",
  DROP COLUMN "creativity_score",
  DROP COLUMN "sociability_score",
  DROP COLUMN "spirituality_score";

-- AlterTable
ALTER TABLE "badges" ADD COLUMN     "competency_area" "CompetencyArea";

-- CreateTable
CREATE TABLE "journey_milestones" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "moment" "SymbolicMoment" NOT NULL,
    "occurred_at" DATE NOT NULL,
    "place" VARCHAR(180),
    "story" TEXT,
    "accompanied_by" VARCHAR(180),
    "accompanied_by_id" UUID,
    "registered_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "journey_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_promises" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "formula" "PromiseFormula",
    "status" "PromiseStatus" NOT NULL DEFAULT 'PREPARACION',
    "desired_place" VARCHAR(180),
    "motivation" TEXT,
    "requested_at" TIMESTAMPTZ(3),
    "celebrated_at" DATE,
    "celebration_place" VARCHAR(180),
    "story" TEXT,
    "accompanied_by" VARCHAR(180),
    "accompanied_by_id" UUID,
    "registered_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_promises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "journey_milestones_user_id_idx" ON "journey_milestones"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "journey_milestones_user_id_moment_key" ON "journey_milestones"("user_id", "moment");

-- CreateIndex
CREATE UNIQUE INDEX "user_promises_user_id_key" ON "user_promises"("user_id");

-- AddForeignKey
ALTER TABLE "journey_milestones" ADD CONSTRAINT "journey_milestones_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_milestones" ADD CONSTRAINT "journey_milestones_accompanied_by_id_fkey" FOREIGN KEY ("accompanied_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_milestones" ADD CONSTRAINT "journey_milestones_registered_by_id_fkey" FOREIGN KEY ("registered_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_promises" ADD CONSTRAINT "user_promises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_promises" ADD CONSTRAINT "user_promises_accompanied_by_id_fkey" FOREIGN KEY ("accompanied_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_promises" ADD CONSTRAINT "user_promises_registered_by_id_fkey" FOREIGN KEY ("registered_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
