import { useState } from 'react'
import { Button, Modal, SegmentedControl, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/common'
import { AdminActionToast, AdminConfirmDialog, AdminPageSection, AdminStatusBadge } from '../components'
import { bannedUsersData, reportedUsersData } from '../data/moderationData'
import { useAdminActions } from '../hooks/useAdminActions'

export default function AdminModeration() {
  const [tab, setTab] = useState<'reported' | 'banned'>('reported')
  const [reportedUsers, setReportedUsers] = useState(reportedUsersData)
  const [bannedUsers, setBannedUsers] = useState(bannedUsersData)
  const [selectedCase, setSelectedCase] = useState<{ title: string; details: string[] } | null>(null)
  const [pendingBan, setPendingBan] = useState<string | null>(null)
  const { toast, showToast, closeToast } = useAdminActions()

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
          {tab === 'reported' ? (
            <Table className="min-w-[760px]">
              <TableHead>
                <TableRow className="bg-transparent">
                  <TableHeaderCell>Username</TableHeaderCell>
                  <TableHeaderCell>Report Count</TableHeaderCell>
                  <TableHeaderCell>Reason</TableHeaderCell>
                  <TableHeaderCell>Action</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportedUsers.map((row) => (
                  <TableRow key={row.username} className="hover:brightness-[1.01]">
                    <TableCell className="px-2 py-3 text-sm font-semibold text-neutral-900">{row.username}</TableCell>
                    <TableCell className="px-2 py-3 text-sm text-neutral-700">{row.reportCount}</TableCell>
                    <TableCell className="px-2 py-3 text-sm text-neutral-700">{row.reason}</TableCell>
                    <TableCell className="px-2 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setSelectedCase({
                              title: `${row.username} report`,
                              details: [
                                `Username: ${row.username}`,
                                `Email: ${row.email}`,
                                `Plan: ${row.plan}`,
                                `Status: ${row.status}`,
                                `Report count: ${row.reportCount}`,
                                `Main reason: ${row.reason}`,
                                `Latest room: ${row.latestRoom}`,
                                `Latest report: ${row.latestReportAt}`,
                                `Prior warnings: ${row.priorWarnings}`,
                                `Account created: ${row.accountCreatedAt}`,
                              ],
                            })
                          }
                        >
                          View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPendingBan(row.username)}>Ban</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table className="min-w-[760px]">
              <TableHead>
                <TableRow className="bg-transparent">
                  <TableHeaderCell>Username</TableHeaderCell>
                  <TableHeaderCell>Ban Reason</TableHeaderCell>
                  <TableHeaderCell>Ban Date</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bannedUsers.map((row) => (
                  <TableRow key={row.username} className="hover:brightness-[1.01]">
                    <TableCell className="px-2 py-3 text-sm font-semibold text-neutral-900">{row.username}</TableCell>
                    <TableCell className="px-2 py-3 text-sm text-neutral-700">{row.banReason}</TableCell>
                    <TableCell className="px-2 py-3 text-sm text-neutral-700">{row.banDate}</TableCell>
                    <TableCell className="px-2 py-3"><AdminStatusBadge status={row.type} /></TableCell>
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
            <p key={line} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-charcoal)] px-3 py-2">
              {line}
            </p>
          ))}
        </div>
      </Modal>
      <AdminConfirmDialog
        open={!!pendingBan}
        title="Ban Reported User"
        message={pendingBan ? `Confirm ban for ${pendingBan}?` : ''}
        confirmLabel="Ban"
        onCancel={() => setPendingBan(null)}
        onConfirm={() => {
          if (!pendingBan) return
          const target = reportedUsers.find((r) => r.username === pendingBan)
          if (!target) return
          setReportedUsers((prev) => prev.filter((r) => r.username !== pendingBan))
          setBannedUsers((prev) => [
            ...prev,
            {
              username: target.username,
              banReason: target.reason,
              banDate: new Date().toISOString().slice(0, 10),
              type: 'Temporary',
            },
          ])
          setPendingBan(null)
          showToast(`${target.username} moved to banned users`, 'warning')
          setTab('banned')
        }}
      />
      {toast && <AdminActionToast message={toast.message} variant={toast.variant} onClose={closeToast} />}
    </div>
  )
}

