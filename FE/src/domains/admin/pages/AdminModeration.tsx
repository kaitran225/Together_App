import { useEffect, useState } from 'react'
import { Button, Modal, SegmentedControl, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/common'
import { AdminActionToast, AdminConfirmDialog, AdminPageSection, AdminStatusBadge } from '../components'
import { useAdminActions } from '../hooks/useAdminActions'
import { workflowApi } from '../../../api/client'

export default function AdminModeration() {
  const [tab, setTab] = useState<'reported' | 'banned'>('reported')
  const [reportedUsers, setReportedUsers] = useState<any[]>([])
  const [bannedUsers, setBannedUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState<{ title: string; details: string[] } | null>(null)
  const [pendingBanSso, setPendingBanSso] = useState<string | null>(null)
  const { toast, showToast, closeToast } = useAdminActions()

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'reported') {
        const res = await workflowApi.getReportedUsers()
        if (res.success && res.data) {
          setReportedUsers(res.data)
        }
      } else {
        const res = await workflowApi.getUsers()
        if (res.success && res.data) {
          // Filter users who are Banned
          const banned = res.data.filter((u: any) => u.status?.toUpperCase() === 'BANNED')
          setBannedUsers(banned)
        }
      }
    } catch (err) {
      console.error('Failed to load moderation data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [tab])

  const handleConfirmBan = async () => {
    if (!pendingBanSso) return
    try {
      const res = await workflowApi.banReportedUser(pendingBanSso)
      if (res.success) {
        showToast(`User ${pendingBanSso} has been banned successfully.`, 'warning')
        setPendingBanSso(null)
        loadData()
      } else {
        showToast(res.message || 'Failed to ban user.', 'error')
      }
    } catch (err) {
      showToast('Error banning user.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageSection
        title="Moderation"
        subtitle="Review reports and ban records"
        action={
          <SegmentedControl
            value={tab}
            onChange={(v) => setTab(v as 'reported' | 'banned')}
            options={[
              { value: 'reported', label: 'Reported Users' },
              { value: 'banned', label: 'Banned Users' },
            ]}
          />
        }
      >
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tab === 'reported' ? (
            reportedUsers.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">Không có báo cáo nào chưa xử lý.</p>
            ) : (
              <Table className="min-w-[760px]">
                <TableHead>
                  <TableRow className="bg-transparent">
                    <TableHeaderCell>User SSO</TableHeaderCell>
                    <TableHeaderCell>Username / Name</TableHeaderCell>
                    <TableHeaderCell>Reason</TableHeaderCell>
                    <TableHeaderCell>Action</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportedUsers.map((row) => (
                    <TableRow key={row.reportId} className="hover:brightness-[1.01]">
                      <TableCell className="px-2 py-3 text-xs font-semibold text-neutral-800">{row.reportedUserSso}</TableCell>
                      <TableCell className="px-2 py-3 text-sm text-neutral-900">{row.username || '—'}</TableCell>
                      <TableCell className="px-2 py-3 text-sm text-neutral-700">{row.reason}</TableCell>
                      <TableCell className="px-2 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setSelectedCase({
                                title: `Report Detail`,
                                details: [
                                  `Report ID: ${row.reportId}`,
                                  `Reported User SSO: ${row.reportedUserSso}`,
                                  `Username: ${row.username || 'N/A'}`,
                                  `Email: ${row.email || 'N/A'}`,
                                  `Reporter SSO: ${row.reporterSso}`,
                                  `Reason: ${row.reason}`,
                                  `Room ID: ${row.roomId || 'None'}`,
                                  `Status: ${row.status}`,
                                  `Created At: ${row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : '—'}`,
                                ],
                              })
                            }
                          >
                            View
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setPendingBanSso(row.reportedUserSso)}>Ban</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : bannedUsers.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">Không có người dùng bị cấm.</p>
          ) : (
            <Table className="min-w-[760px]">
              <TableHead>
                <TableRow className="bg-transparent">
                  <TableHeaderCell>User SSO</TableHeaderCell>
                  <TableHeaderCell>Username / Name</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bannedUsers.map((row) => (
                  <TableRow key={row.userSso} className="hover:brightness-[1.01]">
                    <TableCell className="px-2 py-3 text-xs font-semibold text-neutral-800">{row.userSso}</TableCell>
                    <TableCell className="px-2 py-3 text-sm font-semibold text-neutral-900">{row.fullName || '—'}</TableCell>
                    <TableCell className="px-2 py-3 text-sm text-neutral-700">{row.email || '—'}</TableCell>
                    <TableCell className="px-2 py-3"><AdminStatusBadge status="Banned" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </AdminPageSection>
      <Modal open={!!selectedCase} onClose={() => setSelectedCase(null)} title={selectedCase?.title ?? 'Case detail'}>
        <div className="space-y-2 text-sm text-neutral-700">
          {selectedCase?.details.map((line) => (
            <p key={line} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-charcoal)] px-3 py-2 text-neutral-100">
              {line}
            </p>
          ))}
        </div>
      </Modal>
      <AdminConfirmDialog
        open={!!pendingBanSso}
        title="Ban Reported User"
        message={pendingBanSso ? `Confirm ban for user SSO ${pendingBanSso}?` : ''}
        confirmLabel="Ban"
        onCancel={() => setPendingBanSso(null)}
        onConfirm={handleConfirmBan}
      />
      {toast && <AdminActionToast message={toast.message} variant={toast.variant} onClose={closeToast} />}
    </div>
  )
}
