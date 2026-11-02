-- CreateEnum
CREATE TYPE "CommunityInternalRole" AS ENUM ('COORDINADOR', 'SECRETARIO', 'TESORERO', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "AdultTeamRole" AS ENUM ('RESPONSABLE_AVANZADA', 'ASISTENTE_AVANZADA');

-- AlterTable
ALTER TABLE "communities" ADD COLUMN     "motto" VARCHAR(300);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "adult_team_role" "AdultTeamRole",
ADD COLUMN     "assigned_aa_id" UUID,
ADD COLUMN     "assigned_since" TIMESTAMPTZ(3),
ADD COLUMN     "community_role" "CommunityInternalRole",
ADD COLUMN     "preferred_name" VARCHAR(80);

-- CreateTable
CREATE TABLE "community_role_history" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "CommunityInternalRole" NOT NULL,
    "assigned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(3),

    CONSTRAINT "community_role_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_role_history_community_id_ended_at_idx" ON "community_role_history"("community_id", "ended_at");

-- CreateIndex
CREATE INDEX "community_role_history_user_id_idx" ON "community_role_history"("user_id");

-- CreateIndex
CREATE INDEX "users_assigned_aa_id_idx" ON "users"("assigned_aa_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_assigned_aa_id_fkey" FOREIGN KEY ("assigned_aa_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_role_history" ADD CONSTRAINT "community_role_history_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_role_history" ADD CONSTRAINT "community_role_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- v2.0 Fase 1: el Equipo Adulto no pertenece a las comunidades juveniles.
-- Limpieza de datos heredados de v1.x y cargo adulto por defecto.
UPDATE "users"
SET "community_id" = NULL,
    "community_role" = NULL
WHERE "role" = 'AA';

UPDATE "users"
SET "adult_team_role" = 'RESPONSABLE_AVANZADA'
WHERE "role" = 'AA' AND "adult_team_role" IS NULL;

UPDATE "users"
SET "community_role" = NULL
WHERE "community_id" IS NULL;

-- Invariante de base: un AA nunca integra una comunidad juvenil.
ALTER TABLE "users"
  ADD CONSTRAINT "users_aa_without_community_check"
  CHECK ("role" <> 'AA' OR ("community_id" IS NULL AND "community_role" IS NULL));

