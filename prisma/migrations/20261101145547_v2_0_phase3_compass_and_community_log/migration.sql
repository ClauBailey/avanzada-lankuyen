-- CreateEnum
CREATE TYPE "CompassObjectiveStatus" AS ENUM ('EXPLORANDO', 'LOGRADO_EN_VIDA_COTIDIANA');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CONSENSO_SOLICITADO';

-- AlterTable
ALTER TABLE "activity_evaluations" ALTER COLUMN "experienced_areas" DROP DEFAULT;

-- CreateTable
CREATE TABLE "compass_objective_templates" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "area" "DevelopmentArea" NOT NULL,
    "terminalObjective" TEXT NOT NULL,
    "intermediateObjective" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "compass_objective_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_compass_objectives" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "area" "DevelopmentArea" NOT NULL,
    "template_id" UUID,
    "terminal_objective_ref" TEXT,
    "current_text" TEXT NOT NULL,
    "status" "CompassObjectiveStatus" NOT NULL DEFAULT 'EXPLORANDO',
    "shared_with_community" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_compass_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_compass_objective_versions" (
    "id" UUID NOT NULL,
    "objective_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_compass_objective_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_compass_reflections" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "objective_id" UUID,
    "activity_id" UUID,
    "is_cycle_self_evaluation" BOOLEAN NOT NULL DEFAULT false,
    "cycle_label" VARCHAR(120),
    "content" TEXT NOT NULL,
    "shared_with_aa" BOOLEAN NOT NULL DEFAULT true,
    "shared_with_community" BOOLEAN NOT NULL DEFAULT false,
    "consensus_note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_compass_reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentoring_notes" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "author_aa_id" UUID,
    "content" TEXT NOT NULL,
    "shared_with_student" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "mentoring_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_log_entries" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "author_id" UUID,
    "author_name_snapshot" VARCHAR(160) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "content" TEXT NOT NULL,
    "shared_with_aa" BOOLEAN NOT NULL DEFAULT false,
    "shared_with_coordinators" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "community_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "compass_objective_templates_code_key" ON "compass_objective_templates"("code");

-- CreateIndex
CREATE INDEX "compass_objective_templates_area_sort_order_idx" ON "compass_objective_templates"("area", "sort_order");

-- CreateIndex
CREATE INDEX "user_compass_objectives_user_id_area_idx" ON "user_compass_objectives"("user_id", "area");

-- CreateIndex
CREATE INDEX "user_compass_objectives_template_id_idx" ON "user_compass_objectives"("template_id");

-- CreateIndex
CREATE INDEX "user_compass_objective_versions_objective_id_created_at_idx" ON "user_compass_objective_versions"("objective_id", "created_at");

-- CreateIndex
CREATE INDEX "user_compass_reflections_user_id_created_at_idx" ON "user_compass_reflections"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_compass_reflections_objective_id_idx" ON "user_compass_reflections"("objective_id");

-- CreateIndex
CREATE INDEX "user_compass_reflections_activity_id_idx" ON "user_compass_reflections"("activity_id");

-- CreateIndex
CREATE INDEX "mentoring_notes_student_id_created_at_idx" ON "mentoring_notes"("student_id", "created_at");

-- CreateIndex
CREATE INDEX "mentoring_notes_author_aa_id_idx" ON "mentoring_notes"("author_aa_id");

-- CreateIndex
CREATE INDEX "community_log_entries_community_id_created_at_idx" ON "community_log_entries"("community_id", "created_at");

-- CreateIndex
CREATE INDEX "community_log_entries_author_id_idx" ON "community_log_entries"("author_id");

-- AddForeignKey
ALTER TABLE "user_compass_objectives" ADD CONSTRAINT "user_compass_objectives_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_compass_objectives" ADD CONSTRAINT "user_compass_objectives_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "compass_objective_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_compass_objective_versions" ADD CONSTRAINT "user_compass_objective_versions_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "user_compass_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_compass_reflections" ADD CONSTRAINT "user_compass_reflections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_compass_reflections" ADD CONSTRAINT "user_compass_reflections_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "user_compass_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_compass_reflections" ADD CONSTRAINT "user_compass_reflections_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentoring_notes" ADD CONSTRAINT "mentoring_notes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentoring_notes" ADD CONSTRAINT "mentoring_notes_author_aa_id_fkey" FOREIGN KEY ("author_aa_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_log_entries" ADD CONSTRAINT "community_log_entries_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_log_entries" ADD CONSTRAINT "community_log_entries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
