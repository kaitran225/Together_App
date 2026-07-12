-- V7: Thêm cột extracted_text để lưu nội dung text đã trích xuất từ file tài liệu
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_text TEXT;
