CREATE TABLE "room_events" (
  "event_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "room_id" BIGINT NOT NULL,
  "event_type" VARCHAR NOT NULL,
  "actor_sso" VARCHAR,
  "payload" JSONB,
  "event_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

ALTER TABLE "rooms"
  ADD COLUMN IF NOT EXISTS "version" BIGINT;

ALTER TABLE "room_members"
  ADD COLUMN IF NOT EXISTS "version" BIGINT;

ALTER TABLE "room_events"
  ADD FOREIGN KEY ("room_id") REFERENCES "rooms" ("room_id") ON DELETE CASCADE;
