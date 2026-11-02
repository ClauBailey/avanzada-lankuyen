-- DropIndex
DROP INDEX "route_sheets_activity_id_version_key";

-- AlterTable
ALTER TABLE "route_sheets" ADD COLUMN     "community_id" UUID;

-- CreateIndex
CREATE INDEX "route_sheets_activity_id_community_id_idx" ON "route_sheets"("activity_id", "community_id");

-- CreateIndex
CREATE UNIQUE INDEX "route_sheets_activity_id_community_id_version_key" ON "route_sheets"("activity_id", "community_id", "version");

-- AddForeignKey
ALTER TABLE "route_sheets" ADD CONSTRAINT "route_sheets_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
