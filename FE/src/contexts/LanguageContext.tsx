import { createContext, useContext, useState, ReactNode } from 'react'

export type Language = 'en' | 'vi'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header & Sidebar
    'nav.home': 'Home',
    'nav.profile': 'Profile',
    'nav.studyRooms': 'Study Rooms',
    'nav.meetings': 'Meetings',
    'nav.teams': 'Teams',
    'nav.calendar': 'Calendar',
    'nav.subscription': 'Subscription',
    'nav.shop': 'Shop',
    'nav.focusRoom': 'Focus Room',
    'nav.logout': 'Logout',
    'nav.guest': 'Guest',
    'nav.togetherAi': 'Together AI',
    'nav.admin.dashboard': 'Dashboard',
    'nav.admin.users': 'Users',
    'nav.admin.moderation': 'Moderation',
    'nav.admin.socialRooms': 'Social Rooms',
    'nav.admin.reports': 'Reports',
    'nav.admin.revenue': 'Revenue',
    'nav.admin.support': 'Support',
    'nav.collapse': 'Collapse',
    'nav.expand': 'Expand',

    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.subWelcome': 'Keep your streak alive. Check your teams and study rooms below.',
    'dashboard.experiencePoints': 'Experience points',
    'dashboard.plan': 'Plan',
    'dashboard.currentStreak': 'Current streak',
    'dashboard.keepGoing': 'Keep going',
    'dashboard.days': 'Days',
    'dashboard.teamsJoined': 'Teams joined',
    'dashboard.noTeams': 'No teams yet.',
    'dashboard.browseTeams': 'Browse teams',
    'dashboard.personalNotes': 'Personal notes',
    'dashboard.saveNote': 'Save Note',
    'dashboard.saving': 'Saving...',
    'dashboard.notePlaceholder': 'Write a quick study note here...',
    'dashboard.savedNotesTitle': 'Your saved notes',
    'dashboard.delete': 'Delete',
    'dashboard.noteDetails': 'Note Details',
    'dashboard.close': 'Close',

    // Profile & Settings
    'profile.title': 'Profile',
    'profile.statistics': 'Statistics',
    'profile.studyTime': 'Focused study time',
    'profile.tasksCompleted': 'Tasks completed',
    'profile.groupProjects': 'Group projects',
    'profile.globalRank': 'Global rank',
    'profile.account': 'Account',
    'profile.nextReward': 'Next reward',
    'profile.levelReward': 'Lv. {level} Reward',

    // Shop & Billing
    'shop.title': 'Buy Coins',
    'shop.subtitle': 'Boost your learning experience with additional coins.',
    'shop.buy': 'Buy',
    'shop.mostPopular': 'Most Popular',
    'shop.coins': 'Coins',
    'shop.termsOfService': 'Terms of service',
    'shop.support': 'Support',
    'shop.securePayment': 'Secure payment',
    'shop.history': 'Transaction history',
  },
  vi: {
    // Header & Sidebar
    'nav.home': 'Trang chủ',
    'nav.profile': 'Cá nhân',
    'nav.studyRooms': 'Phòng học',
    'nav.meetings': 'Cuộc họp',
    'nav.teams': 'Đội nhóm',
    'nav.calendar': 'Lịch biểu',
    'nav.subscription': 'Gói đăng ký',
    'nav.shop': 'Cửa hàng xu',
    'nav.focusRoom': 'Phòng tập trung',
    'nav.logout': 'Đăng xuất',
    'nav.guest': 'Khách',
    'nav.togetherAi': 'Trợ lý AI',
    'nav.admin.dashboard': 'Bảng điều khiển',
    'nav.admin.users': 'Người dùng',
    'nav.admin.moderation': 'Kiểm duyệt',
    'nav.admin.socialRooms': 'Phòng cộng đồng',
    'nav.admin.reports': 'Báo cáo',
    'nav.admin.revenue': 'Doanh thu',
    'nav.admin.support': 'Hỗ trợ',
    'nav.collapse': 'Thu gọn',
    'nav.expand': 'Mở rộng',

    // Dashboard
    'dashboard.welcome': 'Chào mừng bạn quay trở lại',
    'dashboard.subWelcome': 'Hãy giữ vững phong độ. Kiểm tra đội nhóm và phòng học của bạn bên dưới.',
    'dashboard.experiencePoints': 'Điểm kinh nghiệm',
    'dashboard.plan': 'Gói dịch vụ',
    'dashboard.currentStreak': 'Chuỗi ngày học',
    'dashboard.keepGoing': 'Tiếp tục duy trì',
    'dashboard.days': 'Ngày',
    'dashboard.teamsJoined': 'Nhóm đã tham gia',
    'dashboard.noTeams': 'Chưa tham gia nhóm nào.',
    'dashboard.browseTeams': 'Tìm kiếm nhóm',
    'dashboard.personalNotes': 'Ghi chú cá nhân',
    'dashboard.saveNote': 'Lưu ghi chú',
    'dashboard.saving': 'Đang lưu...',
    'dashboard.notePlaceholder': 'Viết nhanh ghi chú học tập vào đây...',
    'dashboard.savedNotesTitle': 'Ghi chú đã lưu',
    'dashboard.delete': 'Xóa',
    'dashboard.noteDetails': 'Chi tiết ghi chú',
    'dashboard.close': 'Đóng',

    // Profile & Settings
    'profile.title': 'Trang cá nhân',
    'profile.statistics': 'Số liệu thống kê',
    'profile.studyTime': 'Thời gian học tập',
    'profile.tasksCompleted': 'Nhiệm vụ hoàn thành',
    'profile.groupProjects': 'Dự án nhóm',
    'profile.globalRank': 'Thứ hạng toàn cầu',
    'profile.account': 'Tài khoản',
    'profile.nextReward': 'Phần thưởng tiếp theo',
    'profile.levelReward': 'Phần thưởng Cấp {level}',

    // Shop & Billing
    'shop.title': 'Mua xu',
    'shop.subtitle': 'Nâng cao trải nghiệm học tập của bạn bằng cách mua thêm xu.',
    'shop.buy': 'Mua',
    'shop.mostPopular': 'Phổ biến nhất',
    'shop.coins': 'Xu',
    'shop.termsOfService': 'Điều khoản dịch vụ',
    'shop.support': 'Hỗ trợ',
    'shop.securePayment': 'Thanh toán bảo mật',
    'shop.history': 'Lịch sử giao dịch',
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'vi'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
