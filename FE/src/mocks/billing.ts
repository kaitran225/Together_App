/** Billing: subscription features, shop packs */

export const FREE_FEATURES = [
  'Phòng học trực tuyến',
  'Phòng họp trực tuyến',
  'Lưu trữ ghi chú',
  'Lên kế hoạch',
]

export const PERSONAL_FEATURES = [
  'Phòng học trực tuyến',
  'Phòng họp trực tuyến',
  'Lưu trữ ghi chú',
  'Lên kế hoạch',
  'Sơ đồ tư duy',
  'Flashcard',
  'Tải lên PDF',
  'Tóm tắt AI',
  'Phân tích bài tập',
  'Lộ trình học tập cá nhân',
  'Lưu trữ đã lưu',
]

export const TEAMS_FEATURES = [
  'Tạo tối đa ba nhóm',
  'Tối đa 6 thành viên mỗi nhóm',
  'Tóm tắt AI',
  'Phân tích tham gia của thành viên',
  'Tạo câu đố nhanh sau cuộc họp',
  'Lên lịch thông minh',
  'Lưu trữ đã lưu',
  'Tạo nhóm',
  'Nhắc nhở deadline',
  'Báo cáo đóng góp cuối kỳ',
]

export const COMBO_FEATURES = [
  'Phòng học trực tuyến',
  'Sơ đồ tư duy & flashcards',
  'Tải lên PDF, dung lượng không giới hạn',
  'Tạo cuộc họp',
  'Tóm tắt AI',
  'Phân tích học tập nâng cao',
  'Lộ trình học tập cá nhân',
  'Phân tích tham gia của thành viên',
  'Tạo câu đố nhanh sau cuộc họp',
  'Lên lịch thông minh',
  'Nhắc nhở deadline',
  'Báo cáo đóng góp cuối kỳ',
]

export const PACKS = [
  { id: 'starter', name: 'Khởi động', coins: 10, price: 10000, iconKey: 'starter' },
  { id: 'student', name: 'Học sinh', coins: 50, price: 50000, iconKey: 'student' },
  { id: 'pro', name: 'Pro', coins: 100, price: 100000, iconKey: 'pro', popular: true },
  { id: 'squad', name: 'Nhóm', coins: 200, price: 200000, iconKey: 'squad' },
  { id: 'mastery', name: 'Thạc sĩ', coins: 250, price: 250000, iconKey: 'mastery' },
  { id: 'ultimate', name: 'Tối ưu', coins: 300, price: 300000, iconKey: 'ultimate' },
]
