ALTER TABLE "subscription_plans"
  ADD COLUMN IF NOT EXISTS "is_popular" BOOLEAN DEFAULT FALSE;

UPDATE "subscription_plans"
SET "is_popular" = FALSE
WHERE "is_popular" IS NULL;
