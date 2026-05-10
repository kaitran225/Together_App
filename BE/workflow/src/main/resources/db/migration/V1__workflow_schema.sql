CREATE TABLE "schedule_categories" (
  "category_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_sso" VARCHAR NOT NULL,
  "name" VARCHAR NOT NULL,
  "color" VARCHAR,
  "icon" VARCHAR,
  "is_system" BOOLEAN,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "coin_packages" (
  "package_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "package_name" VARCHAR NOT NULL,
  "coins_amount" INT NOT NULL,
  "bonus_coins" INT,
  "price_vnd" BIGINT NOT NULL,
  "is_popular" BOOLEAN,
  "is_active" BOOLEAN,
  "display_order" INT,
  "description" TEXT,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "user_master_data" (
  "master_data_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_sso" VARCHAR UNIQUE NOT NULL,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "achievements" (
  "achievement_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "name" VARCHAR UNIQUE NOT NULL,
  "display_name" VARCHAR NOT NULL,
  "description" TEXT,
  "icon_url" TEXT,
  "exp_reward" INT,
  "coin_reward" INT,
  "requirement_type" VARCHAR,
  "requirement_value" INT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "user_achievements" (
  "user_sso" VARCHAR NOT NULL,
  "achievement_id" BIGINT NOT NULL,
  "progress" INT,
  "unlocked_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  PRIMARY KEY ("user_sso", "achievement_id")
);

CREATE TABLE "user_room_slots" (
  "user_sso" VARCHAR PRIMARY KEY,
  "total_slots" INT,
  "used_slots" INT,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "transactions" (
  "transaction_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_master_data_id" BIGINT NOT NULL,
  "amount" INT NOT NULL,
  "type" VARCHAR NOT NULL,
  "category" VARCHAR,
  "description" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "payment_transactions" (
  "payment_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_sso" VARCHAR NOT NULL,
  "transaction_type" VARCHAR NOT NULL,
  "amount" BIGINT NOT NULL,
  "coins_amount" INT,
  "currency" VARCHAR,
  "payment_method" VARCHAR,
  "payment_gateway_id" VARCHAR,
  "status" VARCHAR,
  "metadata" JSONB,
  "paid_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "chat_conversations" (
  "conversation_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_sso" VARCHAR NOT NULL,
  "title" VARCHAR,
  "context_type" VARCHAR,
  "started_at" TIMESTAMP,
  "last_message_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "chat_messages" (
  "message_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "conversation_id" BIGINT NOT NULL,
  "sender" VARCHAR NOT NULL,
  "message_text" TEXT NOT NULL,
  "action_taken" VARCHAR,
  "action_metadata" JSONB,
  "sent_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "rooms" (
  "room_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "title" VARCHAR NOT NULL,
  "description" TEXT,
  "goal_description" TEXT,
  "goal_duration_days" INT,
  "max_members" INT,
  "is_premium" BOOLEAN,
  "is_public" BOOLEAN,
  "invite_code" VARCHAR UNIQUE,
  "status" VARCHAR,
  "created_by" VARCHAR NOT NULL,
  "created_at" TIMESTAMP,
  "activated_at" TIMESTAMP,
  "expires_at" TIMESTAMP,
  "closed_at" TIMESTAMP,
  "closed_by" VARCHAR,
  "metadata" JSONB,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "room_requests" (
  "request_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_sso" VARCHAR NOT NULL,
  "goal_description" TEXT NOT NULL,
  "goal_duration_days" INT,
  "preferred_size" INT,
  "tags" "TEXT[]",
  "status" VARCHAR,
  "matched_room_id" BIGINT,
  "priority_score" INT,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  "expires_at" TIMESTAMP NOT NULL,
  "matched_at" TIMESTAMP,
  "cancelled_at" TIMESTAMP
);

CREATE TABLE "room_members" (
  "room_id" BIGINT,
  "user_sso" VARCHAR NOT NULL,
  "role" VARCHAR,
  "last_active_at" TIMESTAMP,
  "is_active" BOOLEAN,
  "joined_at" TIMESTAMP,
  "left_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  PRIMARY KEY ("room_id", "user_sso")
);

CREATE TABLE "room_posts" (
  "post_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "room_id" BIGINT NOT NULL,
  "user_sso" VARCHAR NOT NULL,
  "parent_post_id" BIGINT,
  "content" TEXT NOT NULL,
  "attachments" JSONB,
  "is_pinned" BOOLEAN,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "study_sessions" (
  "session_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_master_data_id" BIGINT NOT NULL,
  "room_id" BIGINT,
  "session_type" VARCHAR,
  "start_time" TIMESTAMP NOT NULL,
  "end_time" TIMESTAMP,
  "exp_earned" INT,
  "notes" TEXT,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "room_activities" (
  "activity_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "room_id" BIGINT,
  "user_master_data_id" BIGINT NOT NULL,
  "activity_type" VARCHAR NOT NULL,
  "duration_minutes" INT,
  "metadata" JSONB,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "documents" (
  "document_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_sso" VARCHAR NOT NULL,
  "category_id" BIGINT,
  "title" VARCHAR NOT NULL,
  "file_path" TEXT NOT NULL,
  "file_name" VARCHAR NOT NULL,
  "file_size" BIGINT,
  "file_type" VARCHAR,
  "mime_type" VARCHAR,
  "processing_status" VARCHAR,
  "error_message" TEXT,
  "page_count" INT,
  "word_count" INT,
  "language" VARCHAR,
  "tags" VARCHAR,
  "search_vector" tsvector,
  "metadata" JSONB,
  "last_accessed_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "summaries" (
  "summary_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "document_id" BIGINT NOT NULL,
  "summary_type" VARCHAR,
  "content" TEXT NOT NULL,
  "model_used" VARCHAR,
  "generated_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "flashcard_reviews" (
  "review_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "flashcard_id" BIGINT NOT NULL,
  "user_master_data_id" BIGINT NOT NULL,
  "quality" INT,
  "time_spent_seconds" INT,
  "reviewed_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "mindmaps" (
  "mindmap_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "document_id" BIGINT,
  "user_sso" VARCHAR NOT NULL,
  "title" VARCHAR NOT NULL,
  "content" JSONB NOT NULL,
  "thumbnail_url" TEXT,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "quizzes" (
  "quiz_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "document_id" BIGINT,
  "user_sso" VARCHAR NOT NULL,
  "title" VARCHAR NOT NULL,
  "description" TEXT,
  "difficulty" VARCHAR,
  "time_limit_minutes" INT,
  "passing_score" INT,
  "is_randomized" BOOLEAN,
  "show_answers" BOOLEAN,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "quiz_questions" (
  "question_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "quiz_id" BIGINT NOT NULL,
  "question_type" VARCHAR,
  "question_text" TEXT NOT NULL,
  "options" JSONB,
  "correct_answer" TEXT NOT NULL,
  "explanation" TEXT,
  "points" INT,
  "position" INT,
  "metadata" JSONB,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "flashcards" (
  "flashcard_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "quiz_id" BIGINT NOT NULL,
  "quiz_question_id" BIGINT NOT NULL,
  "ease_factor" DOUBLE PRECISION,
  "interval" INT,
  "repetitions" INT,
  "next_review_date" DATE,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "quiz_attempts" (
  "attempt_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "quiz_id" BIGINT NOT NULL,
  "user_sso" VARCHAR NOT NULL,
  "score" DOUBLE PRECISION,
  "user_answer" JSONB,
  "is_correct" BOOLEAN,
  "points_earned" INT,
  "points_possible" INT,
  "time_spent_seconds" INT,
  "status" VARCHAR,
  "started_at" TIMESTAMP,
  "completed_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "quiz_analytics" (
  "analytics_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_master_data_id" BIGINT NOT NULL,
  "weak_topics" JSONB,
  "strong_topics" JSONB,
  "mistake_patterns" JSONB,
  "recommendations" TEXT,
  "improvement_areas" "TEXT[]",
  "generated_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "schedules" (
  "schedule_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_sso" VARCHAR NOT NULL,
  "category_id" BIGINT,
  "title" VARCHAR NOT NULL,
  "description" TEXT,
  "location" VARCHAR,
  "start_time" TIMESTAMP NOT NULL,
  "end_time" TIMESTAMP NOT NULL,
  "is_all_day" BOOLEAN,
  "timezone" VARCHAR,
  "is_recurring" BOOLEAN,
  "recurrence_rule" TEXT,
  "recurrence_end_date" DATE,
  "source" VARCHAR,
  "external_id" VARCHAR,
  "reminder_minutes" "INT[]",
  "status" VARCHAR,
  "metadata" JSONB,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "schedule_exceptions" (
  "exception_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "schedule_id" BIGINT NOT NULL,
  "exception_date" DATE NOT NULL,
  "is_cancelled" BOOLEAN,
  "new_start_time" TIMESTAMP,
  "new_end_time" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "quick_notes" (
  "note_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_sso" VARCHAR NOT NULL,
  "content" TEXT NOT NULL,
  "is_pinned" BOOLEAN,
  "tags" "TEXT[]",
  "linked_to_type" VARCHAR,
  "linked_to_id" BIGINT,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "teams" (
  "team_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "name" VARCHAR NOT NULL,
  "description" TEXT,
  "avatar_url" TEXT,
  "is_private" BOOLEAN,
  "invite_code" VARCHAR UNIQUE,
  "max_members" INT,
  "created_by" VARCHAR NOT NULL,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "team_members" (
  "team_id" BIGINT,
  "user_sso" VARCHAR NOT NULL,
  "role" VARCHAR,
  "nickname" VARCHAR,
  "joined_at" TIMESTAMP,
  "left_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  PRIMARY KEY ("team_id", "user_sso")
);

CREATE TABLE "projects" (
  "project_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "team_id" BIGINT NOT NULL,
  "name" VARCHAR NOT NULL,
  "description" TEXT,
  "status" VARCHAR,
  "start_date" DATE,
  "due_date" DATE,
  "completed_at" TIMESTAMP,
  "created_by" VARCHAR NOT NULL,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "tasks" (
  "task_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "project_id" BIGINT,
  "team_id" BIGINT,
  "room_id" BIGINT,
  "parent_task_id" BIGINT,
  "title" VARCHAR NOT NULL,
  "description" TEXT,
  "status" VARCHAR,
  "priority" VARCHAR,
  "estimated_hours" INT,
  "actual_hours" INT,
  "start_date" DATE,
  "due_date" DATE,
  "completed_at" TIMESTAMP,
  "attachments" JSONB,
  "metadata" JSONB,
  "created_by" VARCHAR NOT NULL,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "task_assignments" (
  "task_id" BIGINT,
  "user_sso" VARCHAR NOT NULL,
  "assigned_by" VARCHAR,
  "assigned_at" TIMESTAMP,
  "accepted_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  PRIMARY KEY ("task_id", "user_sso")
);

CREATE TABLE "task_dependencies" (
  "task_id" BIGINT,
  "depends_on_task_id" BIGINT,
  "dependency_type" VARCHAR,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  PRIMARY KEY ("task_id", "depends_on_task_id")
);

CREATE TABLE "task_comments" (
  "comment_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "task_id" BIGINT NOT NULL,
  "user_sso" VARCHAR NOT NULL,
  "content" TEXT NOT NULL,
  "attachments" JSONB,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  "deleted_at" TIMESTAMP
);

CREATE TABLE "task_activities" (
  "activity_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "task_id" BIGINT NOT NULL,
  "user_sso" VARCHAR,
  "activity_type" VARCHAR NOT NULL,
  "old_value" TEXT,
  "new_value" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "task_attachments" (
  "attachment_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "task_id" BIGINT NOT NULL,
  "attachment_type" VARCHAR NOT NULL,
  "title" VARCHAR NOT NULL,
  "url" TEXT NOT NULL,
  "uploaded_by" VARCHAR NOT NULL,
  "uploaded_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "meetings" (
  "meeting_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "team_id" BIGINT,
  "room_id" BIGINT,
  "project_id" BIGINT,
  "title" VARCHAR NOT NULL,
  "description" TEXT,
  "agenda" TEXT,
  "meeting_url" TEXT,
  "meeting_platform" VARCHAR,
  "scheduled_start" TIMESTAMP NOT NULL,
  "scheduled_end" TIMESTAMP NOT NULL,
  "actual_start" TIMESTAMP,
  "actual_end" TIMESTAMP,
  "max_duration" INT,
  "status" VARCHAR,
  "recording_url" TEXT,
  "transcript_url" TEXT,
  "created_by" VARCHAR NOT NULL,
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  "cancelled_at" TIMESTAMP
);

CREATE TABLE "meeting_participants" (
  "meeting_id" BIGINT,
  "user_sso" VARCHAR NOT NULL,
  "invitation_status" VARCHAR,
  "attendance_status" VARCHAR,
  "joined_at" TIMESTAMP,
  "left_at" TIMESTAMP,
  "metadata" JSONB,
  "invited_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  PRIMARY KEY ("meeting_id", "user_sso")
);

CREATE TABLE "meeting_summaries" (
  "summary_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "meeting_id" BIGINT UNIQUE NOT NULL,
  "content" TEXT NOT NULL,
  "key_points" "TEXT[]",
  "action_items" JSONB,
  "decisions_made" "TEXT[]",
  "next_steps" "TEXT[]",
  "model_used" VARCHAR,
  "generated_at" TIMESTAMP,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "meeting_notes" (
  "note_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "meeting_id" BIGINT NOT NULL,
  "user_sso" VARCHAR NOT NULL,
  "content" TEXT NOT NULL,
  "is_shared" BOOLEAN,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "notifications" (
  "notification_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_sso" VARCHAR NOT NULL,
  "type" VARCHAR NOT NULL,
  "title" VARCHAR NOT NULL,
  "message" TEXT NOT NULL,
  "link_type" VARCHAR,
  "link_id" BIGINT,
  "is_read" BOOLEAN,
  "read_at" TIMESTAMP,
  "sent_via" "VARCHAR[]",
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR,
  "expires_at" TIMESTAMP
);

CREATE TABLE "audit_logs" (
  "log_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_sso" VARCHAR,
  "action" VARCHAR NOT NULL,
  "table_name" VARCHAR NOT NULL,
  "record_id" BIGINT,
  "old_values" JSONB,
  "new_values" JSONB,
  "ip_address" INET,
  "user_agent" TEXT,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE TABLE "app_config" (
  "config_key" VARCHAR PRIMARY KEY,
  "config_type" VARCHAR NOT NULL,
  "value" TEXT,
  "description" TEXT,
  "display_name" VARCHAR,
  "is_public" BOOLEAN,
  "is_enabled" BOOLEAN,
  "rollout_percentage" INT,
  "target_users" "BIGINT[]",
  "feature_type" VARCHAR,
  "unlock_level" INT,
  "icon_url" TEXT,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

CREATE UNIQUE INDEX ON "summaries" ("document_id", "summary_type");

CREATE UNIQUE INDEX ON "flashcards" ("quiz_id", "quiz_question_id");

CREATE UNIQUE INDEX ON "schedule_exceptions" ("schedule_id", "exception_date");

ALTER TABLE "transactions" ADD FOREIGN KEY ("user_master_data_id") REFERENCES "user_master_data" ("master_data_id") ON DELETE CASCADE;
ALTER TABLE "user_achievements" ADD FOREIGN KEY ("achievement_id") REFERENCES "achievements" ("achievement_id") ON DELETE CASCADE;
ALTER TABLE "chat_messages" ADD FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations" ("conversation_id") ON DELETE CASCADE;
ALTER TABLE "room_requests" ADD FOREIGN KEY ("matched_room_id") REFERENCES "rooms" ("room_id");
ALTER TABLE "room_members" ADD FOREIGN KEY ("room_id") REFERENCES "rooms" ("room_id") ON DELETE CASCADE;
ALTER TABLE "room_posts" ADD FOREIGN KEY ("room_id") REFERENCES "rooms" ("room_id") ON DELETE CASCADE;
ALTER TABLE "room_posts" ADD FOREIGN KEY ("parent_post_id") REFERENCES "room_posts" ("post_id") ON DELETE CASCADE;
ALTER TABLE "study_sessions" ADD FOREIGN KEY ("user_master_data_id") REFERENCES "user_master_data" ("master_data_id") ON DELETE CASCADE;
ALTER TABLE "room_activities" ADD FOREIGN KEY ("user_master_data_id") REFERENCES "user_master_data" ("master_data_id") ON DELETE CASCADE;
ALTER TABLE "summaries" ADD FOREIGN KEY ("document_id") REFERENCES "documents" ("document_id") ON DELETE CASCADE;
ALTER TABLE "flashcard_reviews" ADD FOREIGN KEY ("user_master_data_id") REFERENCES "user_master_data" ("master_data_id") ON DELETE CASCADE;
ALTER TABLE "mindmaps" ADD FOREIGN KEY ("document_id") REFERENCES "documents" ("document_id") ON DELETE CASCADE;
ALTER TABLE "quizzes" ADD FOREIGN KEY ("document_id") REFERENCES "documents" ("document_id") ON DELETE CASCADE;
ALTER TABLE "quiz_questions" ADD FOREIGN KEY ("quiz_id") REFERENCES "quizzes" ("quiz_id") ON DELETE CASCADE;
ALTER TABLE "flashcards" ADD FOREIGN KEY ("quiz_id") REFERENCES "quizzes" ("quiz_id") ON DELETE CASCADE;
ALTER TABLE "flashcards" ADD FOREIGN KEY ("quiz_question_id") REFERENCES "quiz_questions" ("question_id") ON DELETE CASCADE;
ALTER TABLE "quiz_attempts" ADD FOREIGN KEY ("quiz_id") REFERENCES "quizzes" ("quiz_id") ON DELETE CASCADE;
ALTER TABLE "quiz_analytics" ADD FOREIGN KEY ("user_master_data_id") REFERENCES "user_master_data" ("master_data_id") ON DELETE CASCADE;
ALTER TABLE "schedules" ADD FOREIGN KEY ("category_id") REFERENCES "schedule_categories" ("category_id") ON DELETE SET NULL;
ALTER TABLE "schedule_exceptions" ADD FOREIGN KEY ("schedule_id") REFERENCES "schedules" ("schedule_id") ON DELETE CASCADE;
ALTER TABLE "team_members" ADD FOREIGN KEY ("team_id") REFERENCES "teams" ("team_id") ON DELETE CASCADE;
ALTER TABLE "projects" ADD FOREIGN KEY ("team_id") REFERENCES "teams" ("team_id") ON DELETE CASCADE;
ALTER TABLE "tasks" ADD FOREIGN KEY ("project_id") REFERENCES "projects" ("project_id") ON DELETE CASCADE;
ALTER TABLE "tasks" ADD FOREIGN KEY ("team_id") REFERENCES "teams" ("team_id") ON DELETE CASCADE;
ALTER TABLE "tasks" ADD FOREIGN KEY ("room_id") REFERENCES "rooms" ("room_id") ON DELETE SET NULL;
ALTER TABLE "tasks" ADD FOREIGN KEY ("parent_task_id") REFERENCES "tasks" ("task_id") ON DELETE CASCADE;
ALTER TABLE "task_assignments" ADD FOREIGN KEY ("task_id") REFERENCES "tasks" ("task_id") ON DELETE CASCADE;
ALTER TABLE "task_dependencies" ADD FOREIGN KEY ("task_id") REFERENCES "tasks" ("task_id") ON DELETE CASCADE;
ALTER TABLE "task_dependencies" ADD FOREIGN KEY ("depends_on_task_id") REFERENCES "tasks" ("task_id") ON DELETE CASCADE;
ALTER TABLE "task_comments" ADD FOREIGN KEY ("task_id") REFERENCES "tasks" ("task_id") ON DELETE CASCADE;
ALTER TABLE "task_activities" ADD FOREIGN KEY ("task_id") REFERENCES "tasks" ("task_id") ON DELETE CASCADE;
ALTER TABLE "task_attachments" ADD FOREIGN KEY ("task_id") REFERENCES "tasks" ("task_id") ON DELETE CASCADE;
ALTER TABLE "meetings" ADD FOREIGN KEY ("team_id") REFERENCES "teams" ("team_id") ON DELETE CASCADE;
ALTER TABLE "meetings" ADD FOREIGN KEY ("room_id") REFERENCES "rooms" ("room_id") ON DELETE CASCADE;
ALTER TABLE "meetings" ADD FOREIGN KEY ("project_id") REFERENCES "projects" ("project_id") ON DELETE SET NULL;
ALTER TABLE "meeting_participants" ADD FOREIGN KEY ("meeting_id") REFERENCES "meetings" ("meeting_id") ON DELETE CASCADE;
ALTER TABLE "meeting_summaries" ADD FOREIGN KEY ("meeting_id") REFERENCES "meetings" ("meeting_id") ON DELETE CASCADE;
ALTER TABLE "meeting_notes" ADD FOREIGN KEY ("meeting_id") REFERENCES "meetings" ("meeting_id") ON DELETE CASCADE;
