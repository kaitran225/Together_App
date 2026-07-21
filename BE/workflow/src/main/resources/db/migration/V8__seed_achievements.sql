INSERT INTO "achievements" ("name", "display_name", "description", "icon_url", "exp_reward", "coin_reward", "requirement_type", "requirement_value", "is_active", "created_at", "updated_at")
VALUES
('FIRST_STEP', 'Khởi Đầu Vững Chắc', 'Đạt chuỗi học tập liên tiếp 1 ngày', 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png', 50, 10, 'STREAK', 1, true, NOW(), NOW()),
('THREE_DAY_STREAK', 'Nỗ Lực Không Ngừng', 'Duy trì chuỗi học tập 3 ngày liên tiếp', 'https://cdn-icons-png.flaticon.com/512/2583/2583272.png', 100, 20, 'STREAK', 3, true, NOW(), NOW()),
('SEVEN_DAY_STREAK', 'Thói Quen Vàng', 'Duy trì chuỗi học tập liên tiếp 7 ngày', 'https://cdn-icons-png.flaticon.com/512/190/190411.png', 250, 50, 'STREAK', 7, true, NOW(), NOW()),
('XP_NOVICE', 'Học Giả Tập Sự', 'Tích lũy được tổng cộng 500 EXP', 'https://cdn-icons-png.flaticon.com/512/2621/2621111.png', 50, 10, 'EXP', 500, true, NOW(), NOW()),
('XP_EXPERT', 'Tri Thức Bao La', 'Tích lũy được tổng cộng 2000 EXP', 'https://cdn-icons-png.flaticon.com/512/2621/2621124.png', 200, 40, 'EXP', 2000, true, NOW(), NOW()),
('LEVEL_TWO', 'Tiến Bộ Vượt Bậc', 'Đạt cấp độ học tập 2', 'https://cdn-icons-png.flaticon.com/512/4730/4730597.png', 50, 10, 'LEVEL', 2, true, NOW(), NOW()),
('LEVEL_FIVE', 'Bậc Thầy Chuyên Cần', 'Đạt cấp độ học tập 5', 'https://cdn-icons-png.flaticon.com/512/4730/4730616.png', 150, 30, 'LEVEL', 5, true, NOW(), NOW()),
('LEVEL_TEN', 'Huyền Thoại Trí Tuệ', 'Đạt cấp độ học tập 10', 'https://cdn-icons-png.flaticon.com/512/4730/4730618.png', 500, 100, 'LEVEL', 10, true, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;
