export type AdminPlanType = 'FREE' | 'PRO' | 'PLUS' | 'TEAM' | 'ENTERPRISE'

export type AdminUserRow = {
  id: string
  username: string
  email: string
  status: 'Active' | 'Banned'
  plan: AdminPlanType | string
  role: 'USER' | 'ADMIN'
  registerDate: string
  expiryDate: string
  rawPlanExpiresAt?: string | null
}

export const ADMIN_PLAN_OPTIONS: { value: AdminPlanType; label: string }[] = [
  { value: 'FREE', label: 'FREE' },
  { value: 'PRO', label: 'PRO' },
  { value: 'PLUS', label: 'PLUS' },
  { value: 'TEAM', label: 'TEAM' },
  { value: 'ENTERPRISE', label: 'ENTERPRISE' },
]

export const adminUsersData: AdminUserRow[] = [
  { id: 'U-1001', username: 'jamesk', email: 'james@example.com', status: 'Active', plan: 'PRO', role: 'USER', registerDate: '2025-02-12', expiryDate: '2026-02-12' },
  { id: 'U-1002', username: 'annam', email: 'anna@example.com', status: 'Banned', plan: 'FREE', role: 'USER', registerDate: '2025-01-18', expiryDate: '-' },
  { id: 'U-1003', username: 'lucas', email: 'lucas@example.com', status: 'Active', plan: 'PLUS', role: 'USER', registerDate: '2025-03-09', expiryDate: '2026-03-09' },
]
