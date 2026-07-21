CREATE TABLE "user_feature_usage" (
  "user_sso" VARCHAR NOT NULL,
  "feature_code" VARCHAR NOT NULL,
  "last_charged_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  PRIMARY KEY ("user_sso", "feature_code")
);
