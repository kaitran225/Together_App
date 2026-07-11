-- Add features column (JSON array stored as TEXT) to coin_packages
ALTER TABLE "coin_packages" ADD COLUMN "features" TEXT;

-- Insert subscription packages with features
INSERT INTO "coin_packages" ("package_name", "coins_amount", "bonus_coins", "price_vnd", "is_popular", "is_active", "display_order", "description", "features", "created_at", "updated_at")
VALUES
(
  'Free', 0, 0, 0, false, true, 1,
  'Gói miễn phí',
  '["Phòng học trực tuyến","Phòng họp trực tuyến","Lưu trữ ghi chú","Lên kế hoạch"]',
  NOW(), NOW()
),
(
  'Personal', 0, 0, 59000, false, true, 2,
  'Dành cho cá nhân',
  '["Phòng học trực tuyến","Phòng họp trực tuyến","Lưu trữ ghi chú","Lên kế hoạch","Sơ đồ tư duy","Flashcard","Tải lên PDF","Tóm tắt AI","Phân tích bài tập","Lộ trình học tập cá nhân","Lưu trữ đã lưu"]',
  NOW(), NOW()
),
(
  'Teams', 0, 0, 249000, true, true, 3,
  'Dành cho nhóm học tập nghiêm túc',
  '["Tạo tối đa ba nhóm","Tối đa 6 thành viên mỗi nhóm","Tóm tắt AI","Phân tích tham gia của thành viên","Tạo câu đố nhanh sau cuộc họp","Lên lịch thông minh","Lưu trữ đã lưu","Tạo nhóm","Nhắc nhở deadline","Báo cáo đóng góp cuối kỳ"]',
  NOW(), NOW()
),
(
  'Combo', 0, 0, 299000, false, true, 4,
  'Dành cho tổ chức và nhóm lớn',
  '["Phòng học trực tuyến","Sơ đồ tư duy & flashcards","Tải lên PDF, dung lượng không giới hạn","Tạo cuộc họp","Tóm tắt AI","Phân tích học tập nâng cao","Lộ trình học tập cá nhân","Phân tích tham gia của thành viên","Tạo câu đố nhanh sau cuộc họp","Lên lịch thông minh","Nhắc nhở deadline","Báo cáo đóng góp cuối kỳ"]',
  NOW(), NOW()
);
