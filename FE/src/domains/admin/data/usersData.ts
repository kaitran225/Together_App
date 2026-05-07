export type AdminUserRow = {
  id: string
  username: string
  email: string
  status: 'Active' | 'Banned'
  plan: 'Basic' | 'Pro' | 'Premium'
  registerDate: string
  expiryDate: string
}

export const adminUsersData: AdminUserRow[] = [
  { id: 'U-1001', username: 'jamesk', email: 'james@example.com', status: 'Active', plan: 'Pro', registerDate: '2025-02-12', expiryDate: '2026-02-12' },
  { id: 'U-1002', username: 'annam', email: 'anna@example.com', status: 'Banned', plan: 'Basic', registerDate: '2025-01-18', expiryDate: '2025-07-18' },
  { id: 'U-1003', username: 'lucas', email: 'lucas@example.com', status: 'Active', plan: 'Premium', registerDate: '2025-03-09', expiryDate: '2026-03-09' },
  { id: 'U-1004', username: 'noahb', email: 'noah@example.com', status: 'Active', plan: 'Basic', registerDate: '2024-11-01', expiryDate: '2025-11-01' },
  { id: 'U-1005', username: 'miaw', email: 'mia@example.com', status: 'Active', plan: 'Pro', registerDate: '2024-12-14', expiryDate: '2025-12-14' },
  { id: 'U-1006', username: 'linaq', email: 'lina@example.com', status: 'Banned', plan: 'Basic', registerDate: '2024-09-27', expiryDate: '2025-03-27' },
  { id: 'U-1007', username: 'ethanx', email: 'ethan@example.com', status: 'Active', plan: 'Premium', registerDate: '2025-04-03', expiryDate: '2026-04-03' },
  { id: 'U-1008', username: 'sofiar', email: 'sofia@example.com', status: 'Active', plan: 'Pro', registerDate: '2025-02-23', expiryDate: '2026-02-23' },
  { id: 'U-1009', username: 'jackm', email: 'jack@example.com', status: 'Active', plan: 'Basic', registerDate: '2025-05-10', expiryDate: '2025-11-10' },
  { id: 'U-1010', username: 'zoet', email: 'zoe@example.com', status: 'Banned', plan: 'Pro', registerDate: '2024-10-06', expiryDate: '2025-04-06' },
]

