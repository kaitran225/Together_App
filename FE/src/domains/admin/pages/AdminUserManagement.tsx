import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Modal, Select, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/common'
import { AdminActionToast, AdminConfirmDialog, AdminFiltersRow, AdminPageSection, AdminPagination, AdminStatusBadge } from '../components'
import type { AdminUserRow } from '../data/usersData'
import { useAdminActions } from '../hooks/useAdminActions'
import { workflowApi } from '../../../api/client'

const PAGE_SIZE = 6

function normalizeUserRow(row: any): AdminUserRow {
  const status = row.status?.toUpperCase() === 'BANNED' ? 'Banned' : 'Active'
  const plan = row.planType?.toLowerCase() === 'pro' ? 'Pro' : row.planType?.toLowerCase() === 'premium' ? 'Premium' : 'Basic'
  const registerDate = row.createdAt ? new Date(row.createdAt).toLocaleDateString('vi-VN') : '-'
  const expiryDate = row.planExpiresAt ? new Date(row.planExpiresAt).toLocaleDateString('vi-VN') : '-'

  return {
    id: String(row.userSso ?? row.userId ?? row.id ?? ''),
    username: row.fullName || row.userSso || row.email || 'User',
    email: row.email || '-',
    status,
    plan,
    registerDate,
    expiryDate,
  }
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [plan, setPlan] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  const [pendingBanId, setPendingBanId] = useState<string | null>(null)
  
  // Wallet adjustment states
  const [walletAdjustAmount, setWalletAdjustAmount] = useState<number>(0)
  const [walletAdjustReason, setWalletAdjustReason] = useState<string>('')

  const { toast, showToast, closeToast, toggleUserBan } = useAdminActions()

  const filtered = useMemo(() => {
    return users.filter((row) => {
      const q = query.trim().toLowerCase()
      const matchesQ = !q || row.username.toLowerCase().includes(q) || row.email.toLowerCase().includes(q) || row.id.toLowerCase().includes(q)
      const matchesStatus = status === 'all' || row.status === status
      const matchesPlan = plan === 'all' || row.plan === plan
      return matchesQ && matchesStatus && matchesPlan
    })
  }, [users, query, status, plan])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pendingUser = users.find((u) => u.id === pendingBanId) ?? null

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    let active = true
    const loadUsers = async () => {
      setIsLoading(true)
      try {
        const res = await workflowApi.getUsers()
        if (active && res.success) {
          const nextUsers = Array.isArray(res.data) ? res.data.map(normalizeUserRow) : []
          setUsers(nextUsers)
        }
      } catch {
        if (active) setUsers([])
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadUsers()
    return () => {
      active = false
    }
  }, [])

  const handleAdjustWallet = async () => {
    if (!selectedUser || !walletAdjustAmount) return
    try {
      const res = await workflowApi.adjustUserWallet(selectedUser.id, walletAdjustAmount, walletAdjustReason)
      if (res.success) {
        showToast(`Adjusted wallet for ${selectedUser.username} by ${walletAdjustAmount} coins.`, 'success')
        setWalletAdjustAmount(0)
        setWalletAdjustReason('')
        setSelectedUser(null)
      } else {
        showToast(res.message || 'Failed to adjust wallet', 'error')
      }
    } catch (e) {
      showToast('Error adjusting wallet', 'error')
    }
  }

  const handleConfirmBanToggle = async () => {
    if (!pendingBanId || !pendingUser) return
    const nextStatus = pendingUser.status === 'Banned' ? 'ACTIVE' : 'BANNED'
    try {
      const res = await workflowApi.changeUserStatus(pendingBanId, nextStatus)
      if (res.success) {
        setUsers((prev) => toggleUserBan(prev, pendingBanId))
        showToast(
          pendingUser.status === 'Banned' ? `${pendingUser.username} was unbanned` : `${pendingUser.username} was banned`,
          pendingUser.status === 'Banned' ? 'success' : 'warning',
        )
      } else {
        showToast(res.message || 'Failed to update user status', 'error')
      }
    } catch (e) {
      showToast('Error updating user status', 'error')
    } finally {
      setPendingBanId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageSection title="Users" subtitle="Search, filter and moderate user accounts">
        <AdminFiltersRow
          left={<Input placeholder="Search by user id, username or email" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} />}
          right={
            <>
              <Select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1) }}
                options={[
                  { value: 'all', label: 'All status' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Banned', label: 'Banned' },
                ]}
              />
              <Select
                value={plan}
                onChange={(e) => { setPlan(e.target.value); setPage(1) }}
                options={[
                  { value: 'all', label: 'All plans' },
                  { value: 'Basic', label: 'Basic' },
                  { value: 'Pro', label: 'Pro' },
                  { value: 'Premium', label: 'Premium' },
                ]}
              />
            </>
          }
        />
      </AdminPageSection>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <Table className="min-w-[980px]">
          <TableHead>
            <TableRow className="bg-transparent">
              <TableHeaderCell>User ID</TableHeaderCell>
              <TableHeaderCell>Username</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Plan</TableHeaderCell>
              <TableHeaderCell>Register Date</TableHeaderCell>
              <TableHeaderCell>Expiry Date</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="px-2 py-6 text-center text-sm text-neutral-600">Loading users…</TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="px-2 py-6 text-center text-sm text-neutral-600">No users found.</TableCell>
              </TableRow>
            ) : pageRows.map((row) => (
              <TableRow key={row.id} className="hover:brightness-[1.01]">
                <TableCell className="px-2 py-3 text-xs font-semibold text-neutral-800">{row.id}</TableCell>
                <TableCell className="px-2 py-3 text-sm font-medium text-neutral-900">{row.username}</TableCell>
                <TableCell className="px-2 py-3 text-sm text-neutral-800">{row.email}</TableCell>
                <TableCell className="px-2 py-3"><AdminStatusBadge status={row.status} /></TableCell>
                <TableCell className="px-2 py-3"><AdminStatusBadge status={row.plan} /></TableCell>
                <TableCell className="px-2 py-3 text-sm text-neutral-800">{row.registerDate}</TableCell>
                <TableCell className="px-2 py-3 text-sm text-neutral-800">{row.expiryDate}</TableCell>
                <TableCell className="px-2 py-3">
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setSelectedUser(row)}>View</Button>
                    <Button variant="ghost" size="sm" onClick={() => setPendingBanId(row.id)}>
                      {row.status === 'Banned' ? 'Unban' : 'Ban'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <Modal open={!!selectedUser} onClose={() => { setSelectedUser(null); setWalletAdjustAmount(0); setWalletAdjustReason('') }} title="User Detail & Wallet Admin">
        {selectedUser && (
          <div className="space-y-4 text-sm text-neutral-700">
            <div className="space-y-1.5 border-b border-[var(--color-border)] pb-3">
              <p><span className="font-semibold text-neutral-900">ID:</span> {selectedUser.id}</p>
              <p><span className="font-semibold text-neutral-900">Username:</span> {selectedUser.username}</p>
              <p><span className="font-semibold text-neutral-900">Email:</span> {selectedUser.email}</p>
              <p><span className="font-semibold text-neutral-900">Plan:</span> {selectedUser.plan}</p>
              <p><span className="font-semibold text-neutral-900">Status:</span> {selectedUser.status}</p>
              <p><span className="font-semibold text-neutral-900">Registered:</span> {selectedUser.registerDate}</p>
              <p><span className="font-semibold text-neutral-900">Expiry:</span> {selectedUser.expiryDate}</p>
            </div>
            
            {/* Wallet adjustment form */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-neutral-950 text-xs uppercase tracking-wider">Adjust User Wallet</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  label="Coin Amount (e.g. 50 or -20)"
                  value={walletAdjustAmount || ''}
                  onChange={(e) => setWalletAdjustAmount(Number(e.target.value))}
                />
                <Input
                  label="Adjustment Reason"
                  placeholder="e.g. Refund"
                  value={walletAdjustReason}
                  onChange={(e) => setWalletAdjustReason(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full mt-2"
                onClick={handleAdjustWallet}
                disabled={!walletAdjustAmount}
              >
                Submit Wallet Adjustment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <AdminConfirmDialog
        open={!!pendingUser}
        title={pendingUser?.status === 'Banned' ? 'Unban User' : 'Ban User'}
        message={
          pendingUser
            ? `Do you want to ${pendingUser.status === 'Banned' ? 'unban' : 'ban'} ${pendingUser.username}?`
            : ''
        }
        confirmLabel={pendingUser?.status === 'Banned' ? 'Unban' : 'Ban'}
        onCancel={() => setPendingBanId(null)}
        onConfirm={handleConfirmBanToggle}
      />
      {toast && <AdminActionToast message={toast.message} variant={toast.variant} onClose={closeToast} />}
    </div>
  )
}
