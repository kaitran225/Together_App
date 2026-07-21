import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Modal, Select, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/common'
import { AdminActionToast, AdminConfirmDialog, AdminFiltersRow, AdminPageSection, AdminPagination, AdminStatusBadge } from '../components'
import type { AdminPlanType, AdminUserRow } from '../data/usersData'
import { ADMIN_PLAN_OPTIONS } from '../data/usersData'
import { useAdminActions } from '../hooks/useAdminActions'
import { workflowApi } from '../../../api/client'

const PAGE_SIZE = 6

// Định nghĩa các tùy chọn cho lý do điều chỉnh ví
const adjustmentReasonOptions = [
  { value: 'Refund', label: 'Refund (Hoàn tiền)' },
  { value: 'Bonus', label: 'Bonus (Thưởng)' },
  { value: 'Compensation', label: 'Compensation (Đền bù)' },
  { value: 'Correction', label: 'Correction (Sửa lỗi hệ thống)' },
  { value: 'Other', label: 'Other (Lý do khác)' },
]

function normalizePlan(raw: unknown): string {
  const value = String(raw ?? 'FREE').trim().toUpperCase()
  if (value === 'PERSONAL') return 'PLUS'
  if (value === 'TEAMS') return 'TEAM'
  if (value === 'COMBO') return 'COMBO'
  if (value === 'BASIC' || value === 'PREMIUM') return value === 'PREMIUM' ? 'PLUS' : 'FREE'
  return value || 'FREE'
}

function normalizeUserRow(row: any): AdminUserRow {
  const status = row.status?.toUpperCase() === 'BANNED' ? 'Banned' : 'Active'
  const plan = normalizePlan(row.planType)
  const registerDate = row.createdAt ? new Date(row.createdAt).toLocaleDateString('vi-VN') : '-'
  const expiryDate = row.planExpiresAt ? new Date(row.planExpiresAt).toLocaleDateString('vi-VN') : '-'

  return {
    id: String(row.userSso ?? row.userId ?? row.id ?? ''),
    username: row.fullName || row.userSso || row.email || 'User',
    email: row.email || '-',
    status,
    plan,
    role: row.systemRole === 'ADMIN' ? 'ADMIN' : 'USER',
    registerDate,
    expiryDate,
    rawPlanExpiresAt: row.planExpiresAt ?? null,
  }
}

const roleOptions = [
  { value: 'USER', label: 'USER' },
  { value: 'ADMIN', label: 'ADMIN' },
]

type NewUserForm = {
  email: string
  fullName: string
  password: string
  role: 'USER' | 'ADMIN'
}

const initialNewUserForm: NewUserForm = { email: '', fullName: '', password: '', role: 'USER' }

export default function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [plan, setPlan] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  const [pendingBanId, setPendingBanId] = useState<string | null>(null)

  const [walletAdjustAmount, setWalletAdjustAmount] = useState<number>(0)
  const [walletAdjustReason, setWalletAdjustReason] = useState<string>('Refund') // Mặc định là Refund

  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUserForm, setNewUserForm] = useState<NewUserForm>(initialNewUserForm)
  const [createUserError, setCreateUserError] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)
  const [roleDraft, setRoleDraft] = useState<'USER' | 'ADMIN'>('USER')
  const [planDraft, setPlanDraft] = useState<AdminPlanType>('FREE')
  const [planDurationDays, setPlanDurationDays] = useState('30')
  const [savingPlan, setSavingPlan] = useState(false)

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

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const res = await workflowApi.getUsers()
      if (res.success) {
        const nextUsers = Array.isArray(res.data) ? res.data.map(normalizeUserRow) : []
        setUsers(nextUsers)
      }
    } catch {
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const openUserDetail = (row: AdminUserRow) => {
    setSelectedUser(row)
    setRoleDraft(row.role)
    setPlanDraft((ADMIN_PLAN_OPTIONS.some((o) => o.value === row.plan) ? row.plan : 'FREE') as AdminPlanType)
    setPlanDurationDays('30')
    setWalletAdjustAmount(0)
    setWalletAdjustReason('Refund') // Reset về giá trị mặc định khi mở modal mới
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserForm.email || !newUserForm.fullName || !newUserForm.password) {
      setCreateUserError('Please complete all required fields.')
      return
    }
    setCreateUserError('')
    setCreatingUser(true)
    try {
      const res = await workflowApi.createAdminUser(newUserForm.email, newUserForm.password, newUserForm.fullName, newUserForm.role)
      if (res.success) {
        showToast(`User ${newUserForm.email} created.`, 'success')
        setShowCreateUser(false)
        setNewUserForm(initialNewUserForm)
        await loadUsers()
      } else {
        setCreateUserError(res.message || 'Failed to create user.')
      }
    } catch (err: any) {
      setCreateUserError(err.message || 'Failed to create user.')
    } finally {
      setCreatingUser(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedUser) return
    try {
      const res = await workflowApi.updateAdminUserRole(selectedUser.id, roleDraft)
      if (res.success) {
        showToast(`${selectedUser.username}'s role updated to ${roleDraft}.`, 'success')
        setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, role: roleDraft } : u)))
        setSelectedUser((prev) => (prev ? { ...prev, role: roleDraft } : prev))
      } else {
        showToast(res.message || 'Failed to update role', 'error')
      }
    } catch {
      showToast('Error updating role', 'error')
    }
  }

  const handleUpdatePlan = async () => {
    if (!selectedUser) return
    const days = planDraft === 'FREE' ? undefined : Number(planDurationDays)
    if (planDraft !== 'FREE' && (!days || days <= 0)) {
      showToast('Duration days must be greater than 0 for paid plans.', 'error')
      return
    }
    setSavingPlan(true)
    try {
      const res = await workflowApi.updateAdminUserPlan(selectedUser.id, planDraft, days)
      if (res.success) {
        showToast(`${selectedUser.username}'s plan updated to ${planDraft}.`, 'success')
        const listRes = await workflowApi.getUsers()
        if (listRes.success && Array.isArray(listRes.data)) {
          const nextUsers = listRes.data.map(normalizeUserRow)
          setUsers(nextUsers)
          const refreshed = nextUsers.find((u) => u.id === selectedUser.id) ?? null
          setSelectedUser(refreshed)
          if (refreshed) {
            setPlanDraft((ADMIN_PLAN_OPTIONS.some((o) => o.value === refreshed.plan) ? refreshed.plan : 'FREE') as AdminPlanType)
          }
        }
      } else {
        showToast(res.message || 'Failed to update plan', 'error')
      }
    } catch {
      showToast('Error updating plan', 'error')
    } finally {
      setSavingPlan(false)
    }
  }

  const handleAdjustWallet = async () => {
    if (!selectedUser || !walletAdjustAmount) return
    try {
      const res = await workflowApi.adjustUserWallet(selectedUser.id, walletAdjustAmount, walletAdjustReason)
      if (res.success) {
        showToast(`Adjusted wallet for ${selectedUser.username} by ${walletAdjustAmount} coins.`, 'success')
        setWalletAdjustAmount(0)
        setWalletAdjustReason('Refund')
        setSelectedUser(null)
      } else {
        showToast(res.message || 'Failed to adjust wallet', 'error')
      }
    } catch {
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
    } catch {
      showToast('Error updating user status', 'error')
    } finally {
      setPendingBanId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageSection
        title="Users"
        subtitle="Search, filter and moderate user accounts"
        action={<Button variant="primary" size="sm" onClick={() => setShowCreateUser(true)}>+ Create user</Button>}
      >
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
                  ...ADMIN_PLAN_OPTIONS,
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
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Register Date</TableHeaderCell>
              <TableHeaderCell>Expiry Date</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="px-2 py-6 text-center text-sm text-neutral-600">Loading users…</TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="px-2 py-6 text-center text-sm text-neutral-600">No users found.</TableCell>
              </TableRow>
            ) : pageRows.map((row) => (
              <TableRow key={row.id} className="hover:brightness-[1.01]">
                <TableCell className="px-2 py-3 text-xs font-semibold text-neutral-800">{row.id}</TableCell>
                <TableCell className="px-2 py-3 text-sm font-medium text-neutral-900">{row.username}</TableCell>
                <TableCell className="px-2 py-3 text-sm text-neutral-800">{row.email}</TableCell>
                <TableCell className="px-2 py-3"><AdminStatusBadge status={row.status} /></TableCell>
                <TableCell className="px-2 py-3"><AdminStatusBadge status={row.plan} /></TableCell>
                <TableCell className="px-2 py-3"><AdminStatusBadge status={row.role} /></TableCell>
                <TableCell className="px-2 py-3 text-sm text-neutral-800">{row.registerDate}</TableCell>
                <TableCell className="px-2 py-3 text-sm text-neutral-800">{row.expiryDate}</TableCell>
                <TableCell className="px-2 py-3">
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openUserDetail(row)}>View</Button>
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

      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Detail & Admin Actions">
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

            <div className="space-y-3 pt-2 border-b border-[var(--color-border)] pb-4">
              <h4 className="font-bold text-neutral-950 text-xs uppercase tracking-wider">Change plan</h4>
              <Select
                label="Plan tier"
                options={ADMIN_PLAN_OPTIONS}
                value={planDraft}
                onChange={(e) => setPlanDraft(e.target.value as AdminPlanType)}
              />
              {planDraft !== 'FREE' && (
                <Input
                  type="number"
                  label="Duration days"
                  value={planDurationDays}
                  onChange={(e) => setPlanDurationDays(e.target.value)}
                />
              )}
              <Button variant="primary" size="sm" className="w-full" onClick={handleUpdatePlan} disabled={savingPlan}>
                {savingPlan ? 'Saving...' : 'Update plan'}
              </Button>
            </div>

            <div className="space-y-3 pt-2 border-b border-[var(--color-border)] pb-4">
              <h4 className="font-bold text-neutral-950 text-xs uppercase tracking-wider">Assign Role</h4>
              <div className="flex gap-3 items-end">
                <Select
                  options={roleOptions}
                  value={roleDraft}
                  onChange={(e) => setRoleDraft(e.target.value as 'USER' | 'ADMIN')}
                  className="flex-1"
                />
                <Button variant="primary" size="sm" onClick={handleUpdateRole} disabled={roleDraft === selectedUser.role}>
                  Update role
                </Button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-neutral-950 text-xs uppercase tracking-wider">Adjust User Wallet</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  label="Coin Amount"
                  value={walletAdjustAmount || ''}
                  onChange={(e) => setWalletAdjustAmount(Number(e.target.value))}
                />
                {/* Thay đổi trường nhập tay text thành Select dropdown */}
                <Select
                  label="Adjustment Reason"
                  options={adjustmentReasonOptions}
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

      <Modal open={showCreateUser} onClose={() => { setShowCreateUser(false); setCreateUserError('') }} title="Create user">
        <form onSubmit={handleCreateUser} className="space-y-4">
          {createUserError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{createUserError}</div>
          )}
          <Input label="Full name" value={newUserForm.fullName} onChange={(e) => setNewUserForm((p) => ({ ...p, fullName: e.target.value }))} />
          <Input label="Email" type="email" value={newUserForm.email} onChange={(e) => setNewUserForm((p) => ({ ...p, email: e.target.value }))} />
          <Input label="Password" type="password" value={newUserForm.password} onChange={(e) => setNewUserForm((p) => ({ ...p, password: e.target.value }))} />
          <Select
            label="Role"
            options={roleOptions}
            value={newUserForm.role}
            onChange={(e) => setNewUserForm((p) => ({ ...p, role: e.target.value as 'USER' | 'ADMIN' }))}
          />
          <Button type="submit" variant="primary" className="w-full" disabled={creatingUser}>
            {creatingUser ? 'Creating...' : 'Create user'}
          </Button>
        </form>
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