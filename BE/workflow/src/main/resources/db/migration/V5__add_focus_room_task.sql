CREATE TABLE IF NOT EXISTS "focus_room_task" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_sso" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "due_date" TIMESTAMP,
    "is_completed" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_focus_room_task_user_sso" ON "focus_room_task" ("user_sso");
