-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_sso ON "notifications" ("user_sso");
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON "notifications" ("is_read");

-- Indexes for study_sessions
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_master_data_id ON "study_sessions" ("user_master_data_id");
CREATE INDEX IF NOT EXISTS idx_study_sessions_room_id ON "study_sessions" ("room_id");
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON "study_sessions" ("start_time");

-- Indexes for room_members
CREATE INDEX IF NOT EXISTS idx_room_members_user_sso ON "room_members" ("user_sso");

-- Indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON "tasks" ("project_id");
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON "tasks" ("team_id");
CREATE INDEX IF NOT EXISTS idx_tasks_room_id ON "tasks" ("room_id");
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON "tasks" ("due_date");

-- Indexes for room_posts
CREATE INDEX IF NOT EXISTS idx_room_posts_room_id ON "room_posts" ("room_id");

-- Indexes for room_events
CREATE INDEX IF NOT EXISTS idx_room_events_room_id ON "room_events" ("room_id");

-- Indexes for schedules
CREATE INDEX IF NOT EXISTS idx_schedules_user_sso ON "schedules" ("user_sso");
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON "schedules" ("start_time");
