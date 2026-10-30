-- v1.3.1: los logros dejan de usar CUID y pasan a UUID para alinearse con el
-- resto del esquema (Notification.entityId y AuditLog.entityId son @db.Uuid).
--
-- Se conservan las filas existentes remapeando sus identificadores:
--   1. Se genera un UUID nuevo para cada logro y cada asignación.
--   2. Las asignaciones apuntan al UUID nuevo de su logro.
--   3. Se reemplazan las columnas y se reconstruyen claves e índices.

ALTER TABLE "achievements" ADD COLUMN "id_uuid" UUID;
UPDATE "achievements" SET "id_uuid" = gen_random_uuid();
ALTER TABLE "achievements" ALTER COLUMN "id_uuid" SET NOT NULL;

ALTER TABLE "user_achievements" ADD COLUMN "id_uuid" UUID;
UPDATE "user_achievements" SET "id_uuid" = gen_random_uuid();
ALTER TABLE "user_achievements" ALTER COLUMN "id_uuid" SET NOT NULL;

ALTER TABLE "user_achievements" ADD COLUMN "achievement_id_uuid" UUID;
UPDATE "user_achievements" ua
SET "achievement_id_uuid" = a."id_uuid"
FROM "achievements" a
WHERE a."id" = ua."achievement_id";
ALTER TABLE "user_achievements" ALTER COLUMN "achievement_id_uuid" SET NOT NULL;

DROP INDEX "user_achievements_user_id_achievement_id_key";
DROP INDEX "user_achievements_achievement_id_idx";
ALTER TABLE "user_achievements" DROP CONSTRAINT "user_achievements_achievement_id_fkey";
ALTER TABLE "achievements" DROP CONSTRAINT "achievements_pkey";
ALTER TABLE "user_achievements" DROP CONSTRAINT "user_achievements_pkey";

ALTER TABLE "achievements" DROP COLUMN "id";
ALTER TABLE "achievements" RENAME COLUMN "id_uuid" TO "id";
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");

ALTER TABLE "user_achievements" DROP COLUMN "id";
ALTER TABLE "user_achievements" RENAME COLUMN "id_uuid" TO "id";
ALTER TABLE "user_achievements" DROP COLUMN "achievement_id";
ALTER TABLE "user_achievements" RENAME COLUMN "achievement_id_uuid" TO "achievement_id";
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id");

ALTER TABLE "user_achievements"
  ADD CONSTRAINT "user_achievements_achievement_id_fkey"
  FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "user_achievements_achievement_id_idx"
  ON "user_achievements"("achievement_id");
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key"
  ON "user_achievements"("user_id", "achievement_id");
