/*
  Fase 4 — Ciclo de Programa democrático y Asamblea de Avanzada.

  La migración es conservadora con los datos existentes:
  - `semesters` se renombra a `program_cycles` (no se recrea la tabla).
  - `starts_on` / `ends_on` pasan a `start_date` / `end_date`.
  - Los nombres heredados «2026-S1» / «2026-S2» se normalizan al nombre del
    ciclo («Ciclo Otoño–Invierno 2026» / «Ciclo Primavera–Verano 2026»).
  - `activities.semester_id` pasa a `activities.cycle_id` conservando valores.
*/

-- CreateEnum
CREATE TYPE "ProgramCyclePhase" AS ENUM ('DIAGNOSTICO_Y_ENFASIS', 'PROPUESTA_Y_SELECCION', 'ORGANIZACION_Y_PREPARACION', 'DESARROLLO_Y_EVALUACION', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "ActivityScope" AS ENUM ('COMUNIDAD', 'AVANZADA', 'GRUPO_DE_TRABAJO');

-- CreateEnum
CREATE TYPE "ActivityScheduleType" AS ENUM ('FIJA', 'VARIABLE');

-- CreateEnum
CREATE TYPE "DemocraticVoteDynamic" AS ENUM ('ELECCION_DIRECTA', 'RANKING_ESTRELLAS', 'ASIGNACION_PUNTOS');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CICLO_VOTACION_ABIERTA';

-- RenameTable: Semester -> ProgramCycle (RF-CIC-01)
ALTER TABLE "semesters" RENAME TO "program_cycles";
ALTER TABLE "program_cycles" RENAME CONSTRAINT "semesters_pkey" TO "program_cycles_pkey";
ALTER INDEX "semesters_name_key" RENAME TO "program_cycles_name_key";

-- RenameColumn: las fechas adoptan el nombre del ciclo de programa
ALTER TABLE "program_cycles" RENAME COLUMN "starts_on" TO "start_date";
ALTER TABLE "program_cycles" RENAME COLUMN "ends_on" TO "end_date";

-- AlterTable
ALTER TABLE "program_cycles" ALTER COLUMN "name" SET DATA TYPE VARCHAR(120);

-- AlterTable
ALTER TABLE "program_cycles"
  ADD COLUMN "phase" "ProgramCyclePhase" NOT NULL DEFAULT 'DIAGNOSTICO_Y_ENFASIS',
  ADD COLUMN "diagnosis_summary" TEXT,
  ADD COLUMN "educational_emphasis" TEXT,
  ADD COLUMN "is_calendar_approved_by_assembly" BOOLEAN NOT NULL DEFAULT false;

-- Normaliza los nombres heredados del antiguo «semestre» sin perder registros.
UPDATE "program_cycles"
SET "name" = 'Ciclo Primavera–Verano ' || left("name", 4)
WHERE "name" ~ '^\d{4}-S2$';

UPDATE "program_cycles"
SET "name" = 'Ciclo Otoño–Invierno ' || left("name", 4)
WHERE "name" ~ '^\d{4}-S1$';

-- AlterTable: Activity ahora referencia el ciclo de programa
ALTER TABLE "activities" RENAME COLUMN "semester_id" TO "cycle_id";

DROP INDEX "activities_semester_id_starts_at_idx";

ALTER TABLE "activities" ALTER COLUMN "cycle_id" DROP NOT NULL;

ALTER TABLE "activities" DROP CONSTRAINT "activities_semester_id_fkey";

ALTER TABLE "activities" ADD CONSTRAINT "activities_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "program_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activities"
  ADD COLUMN "scope" "ActivityScope" NOT NULL DEFAULT 'AVANZADA',
  ADD COLUMN "schedule_type" "ActivityScheduleType" NOT NULL DEFAULT 'VARIABLE';

-- CreateIndex
CREATE INDEX "activities_cycle_id_starts_at_idx" ON "activities"("cycle_id", "starts_at");

-- CreateIndex
CREATE INDEX "activities_scope_schedule_type_idx" ON "activities"("scope", "schedule_type");

-- CreateTable
CREATE TABLE "community_diagnoses" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "author_id" UUID,
    "strengths_and_interests" TEXT NOT NULL,
    "suggested_activities" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "community_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_proposals" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "proposer_id" UUID,
    "community_id" UUID,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "is_social_intervention_project" BOOLEAN NOT NULL DEFAULT false,
    "selected_for_calendar" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assembly_vote_sessions" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "dynamic" "DemocraticVoteDynamic" NOT NULL DEFAULT 'ELECCION_DIRECTA',
    "is_open" BOOLEAN NOT NULL DEFAULT false,
    "max_points_budget" INTEGER DEFAULT 10,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assembly_vote_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assembly_votes" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "voter_id" UUID NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assembly_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_diagnoses_cycle_id_community_id_key" ON "community_diagnoses"("cycle_id", "community_id");

-- CreateIndex
CREATE INDEX "community_diagnoses_community_id_idx" ON "community_diagnoses"("community_id");

-- CreateIndex
CREATE INDEX "activity_proposals_cycle_id_selected_for_calendar_idx" ON "activity_proposals"("cycle_id", "selected_for_calendar");

-- CreateIndex
CREATE INDEX "activity_proposals_community_id_idx" ON "activity_proposals"("community_id");

-- CreateIndex
CREATE INDEX "assembly_vote_sessions_cycle_id_is_open_idx" ON "assembly_vote_sessions"("cycle_id", "is_open");

-- CreateIndex
CREATE UNIQUE INDEX "assembly_votes_session_id_proposal_id_voter_id_key" ON "assembly_votes"("session_id", "proposal_id", "voter_id");

-- CreateIndex
CREATE INDEX "assembly_votes_session_id_voter_id_idx" ON "assembly_votes"("session_id", "voter_id");

-- AddForeignKey
ALTER TABLE "community_diagnoses" ADD CONSTRAINT "community_diagnoses_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "program_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_diagnoses" ADD CONSTRAINT "community_diagnoses_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_diagnoses" ADD CONSTRAINT "community_diagnoses_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_proposals" ADD CONSTRAINT "activity_proposals_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "program_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_proposals" ADD CONSTRAINT "activity_proposals_proposer_id_fkey" FOREIGN KEY ("proposer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_proposals" ADD CONSTRAINT "activity_proposals_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_vote_sessions" ADD CONSTRAINT "assembly_vote_sessions_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "program_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_votes" ADD CONSTRAINT "assembly_votes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "assembly_vote_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_votes" ADD CONSTRAINT "assembly_votes_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "activity_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembly_votes" ADD CONSTRAINT "assembly_votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
