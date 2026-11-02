-- CreateEnum
CREATE TYPE "ProjectStep" AS ENUM ('SONAR', 'ELEGIR', 'ORGANIZAR', 'REALIZAR', 'EVALUAR', 'CELEBRAR');

-- CreateEnum
CREATE TYPE "ProjectLocality" AS ENUM ('LOCAL', 'COMUNAL', 'REGIONAL');

-- CreateEnum
CREATE TYPE "ProjectActivityKind" AS ENUM ('CENTRAL', 'CONEXA');

-- CreateEnum
CREATE TYPE "WorkGroupStatus" AS ENUM ('ACTIVO', 'HISTORICO_DISUELTO');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PROYECTO_CONVOCATORIA';

-- AlterTable
ALTER TABLE "route_sheets" ADD COLUMN     "project_id" UUID,
ADD COLUMN     "structured_data" JSONB,
ALTER COLUMN "file_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "unit_resources" ADD COLUMN     "proposed_by_id" UUID;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "account_deletion_reason" TEXT,
ADD COLUMN     "account_deletion_requested_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "support_network_contacts" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(160) NOT NULL,
    "relationship_or_role" VARCHAR(160) NOT NULL,
    "organization" VARCHAR(160),
    "contact_info" VARCHAR(200),
    "supported_areas" "CompetencyArea"[],
    "collaboration_notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "support_network_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "cycle_id" UUID,
    "title" VARCHAR(160) NOT NULL,
    "step" "ProjectStep" NOT NULL DEFAULT 'SONAR',
    "work_group_status" "WorkGroupStatus" NOT NULL DEFAULT 'ACTIVO',
    "responsible_user_id" UUID,
    "accompanying_aa_id" UUID,
    "beneficiaries" TEXT NOT NULL,
    "locality" "ProjectLocality" NOT NULL DEFAULT 'LOCAL',
    "duration_text" VARCHAR(120) NOT NULL,
    "is_social_environmental_intervention" BOOLEAN NOT NULL DEFAULT false,
    "problem_diagnosis" TEXT NOT NULL,
    "general_objective" TEXT NOT NULL,
    "specific_objectives" TEXT NOT NULL,
    "observable_indicators" TEXT,
    "budget_summary" TEXT,
    "required_competencies" "CompetencyArea"[],
    "final_report_preparation" TEXT,
    "final_report_conclusions" TEXT,
    "celebration_notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_activity_items" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "activity_id" UUID,
    "title" VARCHAR(160) NOT NULL,
    "kind" "ProjectActivityKind" NOT NULL DEFAULT 'CENTRAL',
    "is_completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "project_activity_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_group_members" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID,
    "support_contact_id" UUID,
    "external_name" VARCHAR(160),
    "external_organization" VARCHAR(160),
    "task_role" VARCHAR(160) NOT NULL,
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_network_contacts_is_active_idx" ON "support_network_contacts"("is_active");

-- CreateIndex
CREATE INDEX "projects_cycle_id_step_idx" ON "projects"("cycle_id", "step");

-- CreateIndex
CREATE INDEX "projects_responsible_user_id_idx" ON "projects"("responsible_user_id");

-- CreateIndex
CREATE INDEX "projects_work_group_status_idx" ON "projects"("work_group_status");

-- CreateIndex
CREATE INDEX "project_activity_items_project_id_kind_idx" ON "project_activity_items"("project_id", "kind");

-- CreateIndex
CREATE INDEX "project_activity_items_activity_id_idx" ON "project_activity_items"("activity_id");

-- CreateIndex
CREATE INDEX "work_group_members_project_id_idx" ON "work_group_members"("project_id");

-- CreateIndex
CREATE INDEX "work_group_members_user_id_idx" ON "work_group_members"("user_id");

-- CreateIndex
CREATE INDEX "work_group_members_support_contact_id_idx" ON "work_group_members"("support_contact_id");

-- CreateIndex
CREATE INDEX "route_sheets_project_id_idx" ON "route_sheets"("project_id");

-- CreateIndex
CREATE INDEX "unit_resources_is_published_sort_order_idx" ON "unit_resources"("is_published", "sort_order");

-- CreateIndex
CREATE INDEX "unit_resources_proposed_by_id_idx" ON "unit_resources"("proposed_by_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "program_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_responsible_user_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_accompanying_aa_id_fkey" FOREIGN KEY ("accompanying_aa_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activity_items" ADD CONSTRAINT "project_activity_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activity_items" ADD CONSTRAINT "project_activity_items_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_group_members" ADD CONSTRAINT "work_group_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_group_members" ADD CONSTRAINT "work_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_group_members" ADD CONSTRAINT "work_group_members_support_contact_id_fkey" FOREIGN KEY ("support_contact_id") REFERENCES "support_network_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_sheets" ADD CONSTRAINT "route_sheets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_resources" ADD CONSTRAINT "unit_resources_proposed_by_id_fkey" FOREIGN KEY ("proposed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
