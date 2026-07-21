ALTER TABLE "subscription_plans"
  ADD COLUMN IF NOT EXISTS "price_vnd" BIGINT;

-- Convert old coin/day pricing into a rough package VND price:
-- price_vnd ≈ max(price_per_day_coins * COALESCE(duration_days, 30) * 1000, 1000)
UPDATE "subscription_plans"
SET "price_vnd" = GREATEST(
  COALESCE("price_per_day_coins", 0) * COALESCE("duration_days", 30) * 1000,
  1000
)
WHERE "price_vnd" IS NULL;

ALTER TABLE "subscription_plans"
  ALTER COLUMN "price_vnd" SET NOT NULL;

ALTER TABLE "subscription_plans"
  ALTER COLUMN "price_per_day_coins" DROP NOT NULL;
