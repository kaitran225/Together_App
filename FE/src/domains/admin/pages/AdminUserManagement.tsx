import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Modal, Select, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/common'
import { AdminActionToast, AdminConfirmDialog, AdminFiltersRow, AdminPageSection, AdminPagination, AdminStatusBadge } from '../components'
import { adminUsersData, type AdminUserRow } from '../data/usersData'
import { useAdminActions } from '../hooks/useAdminActions'

const PAGE_SIZE = 6

export default function AdminUserManagement() {
  const [users, setUsers] = useState(adminUsersData)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [plan, setPlan] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  const [pendingBanId, setPendingBanId] = useState<string | null>(null)
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
            {pageRows.map((row) => (
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
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Detail">
        {selectedUser && (
          <div className="space-y-2 text-sm text-neutral-700">
            <p><span className="font-semibold text-neutral-900">ID:</span> {selectedUser.id}</p>
            <p><span className="font-semibold text-neutral-900">Username:</span> {selectedUser.username}</p>
            <p><span className="font-semibold text-neutral-900">Email:</span> {selectedUser.email}</p>
            <p><span className="font-semibold text-neutral-900">Plan:</span> {selectedUser.plan}</p>
            <p><span className="font-semibold text-neutral-900">Status:</span> {selectedUser.status}</p>
            <p><span className="font-semibold text-neutral-900">Registered:</span> {selectedUser.registerDate}</p>
            <p><span className="font-semibold text-neutral-900">Expiry:</span> {selectedUser.expiryDate}</p>
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
        onConfirm={() => {
          if (!pendingBanId) return
          setUsers((prev) => toggleUserBan(prev, pendingBanId))
          const user = users.find((u) => u.id === pendingBanId)
          showToast(
            user?.status === 'Banned' ? `${user.username} was unbanned` : `${user?.username ?? 'User'} was banned`,
            user?.status === 'Banned' ? 'success' : 'warning',
          )
          setPendingBanId(null)
        }}
      />
      {toast && <AdminActionToast message={toast.message} variant={toast.variant} onClose={closeToast} />}
    </div>
  )
}

