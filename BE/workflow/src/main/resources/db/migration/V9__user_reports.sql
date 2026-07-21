CREATE TABLE "user_reports" (
  "report_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "reporter_sso" VARCHAR NOT NULL,
  "reported_user_sso" VARCHAR NOT NULL,
  "reason" VARCHAR NOT NULL,
  "room_id" BIGINT,
  "status" VARCHAR NOT NULL,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);
