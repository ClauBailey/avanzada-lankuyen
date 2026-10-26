-- Restricciones e índices que Prisma no puede expresar en el schema.
-- Se aplican después de la migración inicial.

-- Unicidad sin distinguir mayúsculas.
CREATE UNIQUE INDEX "users_username_lower_key"
  ON "users" (lower("username"));

CREATE UNIQUE INDEX "users_email_lower_key"
  ON "users" (lower("email"))
  WHERE "email" IS NOT NULL;

CREATE UNIQUE INDEX "communities_name_lower_active_key"
  ON "communities" (lower("name"))
  WHERE "deleted_at" IS NULL;

-- Una sola concesión activa de una insignia por usuario.
CREATE UNIQUE INDEX "user_badges_active_unique"
  ON "user_badges" ("user_id", "badge_id")
  WHERE "revoked_at" IS NULL;

-- Una sola hoja de ruta aprobada por actividad.
CREATE UNIQUE INDEX "route_sheets_one_approved_per_activity"
  ON "route_sheets" ("activity_id")
  WHERE "status" = 'APROBADA' AND "deleted_at" IS NULL;

-- Un solo semestre activo a la vez.
CREATE UNIQUE INDEX "semesters_single_active"
  ON "semesters" ("is_active")
  WHERE "is_active" = true;

-- Integridad de dominio.
ALTER TABLE "users"
  ADD CONSTRAINT "users_community_required_check"
  CHECK ("role" = 'AA' OR "community_id" IS NOT NULL);

ALTER TABLE "activities"
  ADD CONSTRAINT "activities_time_range_check"
  CHECK ("ends_at" > "starts_at");

ALTER TABLE "semesters"
  ADD CONSTRAINT "semesters_date_range_check"
  CHECK ("ends_on" > "starts_on");

ALTER TABLE "badges"
  ADD CONSTRAINT "badges_stage_check"
  CHECK (("category" = 'ETAPA') = ("stage_code" IS NOT NULL));
