-- CreateTable
CREATE TABLE "activity_evaluations" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "affectivity_score" INTEGER NOT NULL,
    "corporality_score" INTEGER NOT NULL,
    "spirituality_score" INTEGER NOT NULL,
    "character_score" INTEGER NOT NULL,
    "creativity_score" INTEGER NOT NULL,
    "sociability_score" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "activity_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_evaluations_user_id_idx" ON "activity_evaluations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_evaluations_activity_id_user_id_key" ON "activity_evaluations"("activity_id", "user_id");

-- AddForeignKey
ALTER TABLE "activity_evaluations" ADD CONSTRAINT "activity_evaluations_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_evaluations" ADD CONSTRAINT "activity_evaluations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Las seis áreas se evalúan en la escala 1–7.
ALTER TABLE "activity_evaluations"
  ADD CONSTRAINT "activity_evaluations_scores_check"
  CHECK (
    "affectivity_score" BETWEEN 1 AND 7
    AND "corporality_score" BETWEEN 1 AND 7
    AND "spirituality_score" BETWEEN 1 AND 7
    AND "character_score" BETWEEN 1 AND 7
    AND "creativity_score" BETWEEN 1 AND 7
    AND "sociability_score" BETWEEN 1 AND 7
  );
