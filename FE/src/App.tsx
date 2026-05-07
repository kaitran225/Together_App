import type { ReactElement } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthLayout } from './components/layout/AuthLayout'
import { DashboardLayout } from './components/layout/DashboardLayout'
import Callback from './pages/Callback'
import DebugComponents from './pages/DebugComponents'
import { RequireAuth } from './components/auth/RequireAuth'
import { RequireRole } from './components/auth/RequireRole'
import { useAuth } from './contexts/AuthContext'
import {
  Welcome,
  SignUp,
  ConfirmMail,
  ResetPassword,
  Dashboard,
  StudyRoomDiscovery,
  CreateNewRoomStudy,
  CreateRoom,
  RecommendRoomMatching,
  StudyRoom,
  StudyRoomDashboard,
  FocusRoom,
  FocusRoomDialog,
  MeetingLobby,
  MainMeetingBoard,
  BoardPage,
  SprintMemberBoard,
  AllTeams,
  TeamManagement,
  MeetAi,
  AiSupport,
  Quizlet,
  QuizletResult,
  ProfileWithSidebar,
  Personalize,
  Personalize2,
  Personalize3,
  Calendar,
  Notification,
  Transaction,
  Subscription,
  Shop,
  AdminUsers,
  AdminAccountSettings,
  AdminOverview,
  AdminUserManagement,
  AdminModeration,
  AdminSocialRooms,
  AdminReports,
  AdminRevenue,
  AdminSupport,
} from './pages/app'

const STANDALONE_PATHS = ['/callback', '/welcome', '/sign-up', '/confirm-mail', '/reset-password', '/debug']

function ProtectedDashboardRoute({ element }: { element: ReactElement }) {
  return (
    <RequireAuth>
      <DashboardLayout>{element}</DashboardLayout>
    </RequireAuth>
  )
}

function AdminRoute({ element }: { element: ReactElement }) {
  return (
    <RequireAuth>
      <RequireRole role="ADMIN">
        <DashboardLayout>{element}</DashboardLayout>
      </RequireRole>
    </RequireAuth>
  )
}

export default function App() {
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()
  const isStandalone = STANDALONE_PATHS.includes(location.pathname)
  const defaultAuthedRoute = user?.role === 'ADMIN' ? '/admin' : '/dashboard'

  return (
    <div className={isStandalone ? 'min-h-screen bg-neutral-100 dark:bg-neutral-900' : ''}>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? defaultAuthedRoute : '/welcome'} replace />} />
        <Route path="/login" element={<Navigate to="/welcome" replace />} />
        <Route path="/callback" element={<main className="p-3 md:p-4 md:py-6 max-w-[1200px] mx-auto min-h-[calc(100vh-4rem)]"><Callback /></main>} />
        <Route path="/welcome" element={<AuthLayout><Welcome /></AuthLayout>} />
        <Route path="/sign-up" element={<AuthLayout><SignUp /></AuthLayout>} />
        <Route path="/confirm-mail" element={<AuthLayout><ConfirmMail /></AuthLayout>} />
        <Route path="/reset-password" element={<AuthLayout><ResetPassword /></AuthLayout>} />
        <Route path="/debug" element={<DebugComponents />} />
        <Route path="/dashboard" element={<ProtectedDashboardRoute element={<Dashboard />} />} />
        <Route path="/study-rooms" element={<ProtectedDashboardRoute element={<StudyRoomDiscovery />} />} />
        <Route path="/study-rooms/create" element={<ProtectedDashboardRoute element={<CreateRoom />} />} />
        <Route path="/study-rooms/create-new" element={<ProtectedDashboardRoute element={<CreateNewRoomStudy />} />} />
        <Route path="/study-rooms/recommend" element={<ProtectedDashboardRoute element={<RecommendRoomMatching />} />} />
        <Route path="/study-room" element={<RequireAuth><StudyRoom /></RequireAuth>} />
        <Route path="/study-room-dashboard" element={<ProtectedDashboardRoute element={<StudyRoomDashboard />} />} />
        <Route path="/focus-room" element={<RequireAuth><FocusRoom /></RequireAuth>} />
        <Route path="/focus-room-dialog" element={<ProtectedDashboardRoute element={<FocusRoomDialog />} />} />
        <Route path="/meetings" element={<ProtectedDashboardRoute element={<MeetingLobby />} />} />
        <Route path="/meetings/room" element={<ProtectedDashboardRoute element={<MainMeetingBoard />} />} />
        <Route path="/teams/board" element={<ProtectedDashboardRoute element={<BoardPage />} />} />
        <Route path="/sprint-board" element={<Navigate to="/teams/board?tab=sprint" replace />} />
        <Route path="/sprint-member-board" element={<ProtectedDashboardRoute element={<SprintMemberBoard />} />} />
        <Route path="/teams" element={<ProtectedDashboardRoute element={<AllTeams />} />} />
        <Route path="/team-management" element={<ProtectedDashboardRoute element={<TeamManagement />} />} />
        <Route path="/scrum-board" element={<Navigate to="/teams/board?tab=scrum" replace />} />
        <Route path="/meet-ai" element={<ProtectedDashboardRoute element={<MeetAi />} />} />
        <Route path="/ai-support" element={<ProtectedDashboardRoute element={<AiSupport />} />} />
        <Route path="/quizlet" element={<ProtectedDashboardRoute element={<Quizlet />} />} />
        <Route path="/quizlet-result" element={<ProtectedDashboardRoute element={<QuizletResult />} />} />
        <Route path="/profile" element={<ProtectedDashboardRoute element={<ProfileWithSidebar />} />} />
        <Route path="/personalize" element={<ProtectedDashboardRoute element={<Personalize />} />} />
        <Route path="/personalize-2" element={<ProtectedDashboardRoute element={<Personalize2 />} />} />
        <Route path="/personalize-3" element={<ProtectedDashboardRoute element={<Personalize3 />} />} />
        <Route path="/calendar" element={<ProtectedDashboardRoute element={<Calendar />} />} />
        <Route path="/notifications" element={<ProtectedDashboardRoute element={<Notification />} />} />
        <Route path="/transaction" element={<ProtectedDashboardRoute element={<Transaction />} />} />
        <Route path="/subscription" element={<ProtectedDashboardRoute element={<Subscription />} />} />
        <Route path="/shop" element={<ProtectedDashboardRoute element={<Shop />} />} />
        <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
        <Route path="/admin/overview" element={<AdminRoute element={<AdminOverview />} />} />
        <Route path="/admin/users-management" element={<AdminRoute element={<AdminUserManagement />} />} />
        <Route path="/admin/moderation" element={<AdminRoute element={<AdminModeration />} />} />
        <Route path="/admin/social-rooms" element={<AdminRoute element={<AdminSocialRooms />} />} />
        <Route path="/admin/reports" element={<AdminRoute element={<AdminReports />} />} />
        <Route path="/admin/revenue" element={<AdminRoute element={<AdminRevenue />} />} />
        <Route path="/admin/support" element={<AdminRoute element={<AdminSupport />} />} />
        <Route path="/admin/users" element={<AdminRoute element={<AdminUsers />} />} />
        <Route path="/admin/account" element={<AdminRoute element={<AdminAccountSettings />} />} />
      </Routes>
    </div>
  )
}
