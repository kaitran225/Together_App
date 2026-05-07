import { useMemo, useState } from 'react'
import { Badge, Button, Card, Input, Select, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/common'
import { useAuth } from '../../../contexts/AuthContext'
import type { PublicUser, UserRole } from '../../../mocks/auth'

const roleOptions = [
  { value: 'USER', label: 'USER' },
  { value: 'ADMIN', label: 'ADMIN' },
]

type NewUserForm = {
  username: string
  fullName: string
  email: string
  password: string
  role: UserRole
}

const initialForm: NewUserForm = {
  username: '',
  fullName: '',
  email: '',
  password: '',
  role: 'USER',
}

export default function AdminUsers() {
  const { users, createMockUser, updateMockUser, toggleMockUserStatus } = useAuth()
  const [form, setForm] = useState<NewUserForm>(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')

  const editingUser = useMemo(
    () => users.find((u) => u.id === editingId) ?? null,
    [editingId, users]
  )

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username || !form.email || !form.fullName || !form.password) {
      setMessage('Please complete all required fields.')
      return
    }
    const result = createMockUser(form)
    if (!result.ok) {
      setMessage(result.error ?? 'Failed to create user.')
      return
    }
    setForm(initialForm)
    setMessage('User created.')
  }

  const onQuickUpdate = (user: PublicUser, updates: Partial<PublicUser>) => {
    const result = updateMockUser(user.id, updates)
    setMessage(result.ok ? 'User updated.' : result.error ?? 'Failed to update user.')
  }

  const onToggleStatus = (userId: string) => {
    const result = toggleMockUserStatus(userId)
    setMessage(result.ok ? 'User status updated.' : result.error ?? 'Failed to toggle status.')
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-900">Admin Users</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-500 mt-1">Create, edit, disable, and assign roles for mock users.</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-900 mb-4">Create user</h2>
        <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Username" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
          <Input label="Full name" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
          <Select
            label="Role"
            options={roleOptions}
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
          />
          <div className="flex items-end">
            <Button type="submit" variant="primary" className="w-full">Create user</Button>
          </div>
        </form>
        {message && <p className="text-sm text-neutral-700 dark:text-primary mt-3">{message}</p>}
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-charcoal)]">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-900">Users</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHead className="bg-neutral-50 dark:bg-[var(--color-surface)]">
              <TableRow>
                <TableHeaderCell className="px-4 py-3 text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-500">Name</TableHeaderCell>
                <TableHeaderCell className="px-4 py-3 text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-500">Email</TableHeaderCell>
                <TableHeaderCell className="px-4 py-3 text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-500">Role</TableHeaderCell>
                <TableHeaderCell className="px-4 py-3 text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-500">Status</TableHeaderCell>
                <TableHeaderCell className="px-4 py-3 text-right text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-500">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-t border-[var(--color-charcoal)]">
                  <TableCell className="px-4 py-3">
                    <p className="font-medium text-neutral-900 dark:text-neutral-900">{user.fullName}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">@{user.username}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-neutral-700 dark:text-neutral-600">{user.email}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Select
                      options={roleOptions}
                      value={user.role}
                      onChange={(e) => onQuickUpdate(user, { role: e.target.value as UserRole })}
                      className="min-h-[2.25rem] py-1 px-3 pr-8"
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant={user.active ? 'success' : 'error'}>
                      {user.active ? 'Active' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setEditingId(user.id)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => onToggleStatus(user.id)}>
                        {user.active ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {editingUser && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-900">Edit user</h2>
            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Close</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Full name"
              value={editingUser.fullName}
              onChange={(e) => onQuickUpdate(editingUser, { fullName: e.target.value })}
            />
            <Input
              label="Email"
              value={editingUser.email}
              onChange={(e) => onQuickUpdate(editingUser, { email: e.target.value })}
            />
            <Input
              label="Avatar URL"
              value={editingUser.avatarUrl ?? ''}
              onChange={(e) => onQuickUpdate(editingUser, { avatarUrl: e.target.value })}
            />
          </div>
        </Card>
      )}
    </div>
  )
}
