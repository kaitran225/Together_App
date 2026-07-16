CREATE TABLE "support_messages" (
  "message_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_sso" VARCHAR NOT NULL,
  "sender" VARCHAR NOT NULL,
  "message" TEXT NOT NULL,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE INDEX idx_support_messages_user_sso ON "support_messages" ("user_sso");
