CREATE TABLE "subscription_plans" (
  "plan_id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "tier_code" VARCHAR NOT NULL UNIQUE,
  "name" VARCHAR NOT NULL,
  "description" TEXT,
  "price_per_day_coins" INTEGER NOT NULL,
  "is_active" BOOLEAN DEFAULT TRUE,
  "display_order" INTEGER,
  "features" TEXT,
  "created_at" TIMESTAMP,
  "created_by" VARCHAR,
  "updated_at" TIMESTAMP,
  "updated_by" VARCHAR
);

INSERT INTO "subscription_plans" ("tier_code", "name", "description", "price_per_day_coins", "is_active", "display_order", "features")
VALUES
('PRO', 'Pro', 'Mở khóa toàn bộ tính năng cơ bản không giới hạn coin.', 5, true, 1, '["Tạo phòng học không giới hạn","Tạo team không giới hạn","Upload tài liệu PDF không giới hạn","AI hỗ trợ học tập không giới hạn"]'),
('TEAM', 'Team', 'Dành cho nhóm học tập, thêm quyền quản lý team nâng cao.', 10, true, 2, '["Toàn bộ quyền lợi gói Pro","Quản lý nhiều team cùng lúc","Ưu tiên hỗ trợ"]'),
('PLUS', 'Plus', 'Gói cao cấp nhất với đầy đủ tính năng và ưu tiên cao nhất.', 15, true, 3, '["Toàn bộ quyền lợi gói Team","Giới hạn dung lượng tài liệu cao nhất","Hỗ trợ ưu tiên 24/7"]')
ON CONFLICT ("tier_code") DO NOTHING;

INSERT INTO "achievements" ("name", "display_name", "description", "icon_url", "exp_reward", "coin_reward", "requirement_type", "requirement_value", "is_active", "created_at", "updated_at")
VALUES
('FIRST_SUBSCRIBER', 'Nhà Đầu Tư Thông Thái', 'Nâng cấp thành công lên gói trả phí đầu tiên', 'https://cdn-icons-png.flaticon.com/512/2583/2583319.png', 100, 50, 'MANUAL', 1, true, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;
