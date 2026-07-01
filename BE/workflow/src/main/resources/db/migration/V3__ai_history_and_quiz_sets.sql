DROP INDEX IF EXISTS "summaries_document_id_summary_type_idx";

CREATE INDEX IF NOT EXISTS "idx_summaries_document_generated_at"
  ON "summaries" ("document_id", "generated_at" DESC);

ALTER TABLE "quizzes"
  ADD COLUMN IF NOT EXISTS "visibility" VARCHAR DEFAULT 'PRIVATE',
  ADD COLUMN IF NOT EXISTS "source" VARCHAR DEFAULT 'USER_GENERATED',
  ADD COLUMN IF NOT EXISTS "shared_at" TIMESTAMP;

UPDATE "quizzes"
SET "visibility" = COALESCE("visibility", 'PRIVATE'),
    "source" = COALESCE("source", 'USER_GENERATED');

CREATE INDEX IF NOT EXISTS "idx_quizzes_visibility"
  ON "quizzes" ("visibility");

CREATE INDEX IF NOT EXISTS "idx_quizzes_user_deleted"
  ON "quizzes" ("user_sso", "deleted_at");
