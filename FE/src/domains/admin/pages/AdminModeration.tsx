import { useEffect, useState } from 'react'
import { Button, Modal, SegmentedControl, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/common'
import { AdminActionToast, AdminConfirmDialog, AdminPageSection, AdminStatusBadge } from '../components'
import { useAdminActions } from '../hooks/useAdminActions'
import { workflowApi } from '../../../api/client'
import { useTranslation } from '../../../contexts/LanguageContext'

export default function AdminModeration() {
  const { t } = useTranslation()
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
        showToast(t('admin.moderation.banSuccess', { sso: pendingBanSso }), 'warning')
        setPendingBanSso(null)
        loadData()
      } else {
        showToast(res.message || t('admin.moderation.banFailed'), 'error')
      }
    } catch {
      showToast(t('admin.moderation.banError'), 'error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageSection
        title={t('admin.moderation.title')}
        subtitle={t('admin.moderation.subtitle')}
        action={
          <SegmentedControl
            value={tab}
            onChange={(v) => setTab(v as 'reported' | 'banned')}
            options={[
              { value: 'reported', label: t('admin.moderation.reportedUsers') },
              { value: 'banned', label: t('admin.moderation.bannedUsers') },
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
              <p className="text-sm text-neutral-500 text-center py-8">{t('admin.moderation.noReports')}</p>
            ) : (
              <Table className="min-w-[760px]">
                <TableHead>
                  <TableRow className="bg-transparent">
                    <TableHeaderCell>{t('admin.moderation.userSso')}</TableHeaderCell>
                    <TableHeaderCell>{t('admin.moderation.usernameName')}</TableHeaderCell>
                    <TableHeaderCell>{t('admin.moderation.reason')}</TableHeaderCell>
                    <TableHeaderCell>{t('admin.moderation.action')}</TableHeaderCell>
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
                                title: t('admin.moderation.reportDetail'),
                                details: [
                                  t('admin.moderation.reportId', { id: row.reportId }),
                                  t('admin.moderation.reportedUserSso', { sso: row.reportedUserSso }),
                                  t('admin.moderation.usernameLine', { name: row.username || t('common.na') }),
                                  t('admin.moderation.emailLine', { email: row.email || t('common.na') }),
                                  t('admin.moderation.reporterSso', { sso: row.reporterSso }),
                                  t('admin.moderation.reasonLine', { reason: row.reason }),
                                  t('admin.moderation.roomIdLine', { room: row.roomId || t('common.noneValue') }),
                                  t('admin.moderation.statusLine', { status: row.status }),
                                  t('admin.moderation.createdAtLine', {
                                    date: row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : '—',
                                  }),
                                ],
                              })
                            }
                          >
                            {t('common.view')}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setPendingBanSso(row.reportedUserSso)}>{t('common.ban')}</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : bannedUsers.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">{t('admin.moderation.noBanned')}</p>
          ) : (
            <Table className="min-w-[760px]">
              <TableHead>
                <TableRow className="bg-transparent">
                  <TableHeaderCell>{t('admin.moderation.userSso')}</TableHeaderCell>
                  <TableHeaderCell>{t('admin.moderation.usernameName')}</TableHeaderCell>
                  <TableHeaderCell>{t('common.email')}</TableHeaderCell>
                  <TableHeaderCell>{t('common.status')}</TableHeaderCell>
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
      <Modal open={!!selectedCase} onClose={() => setSelectedCase(null)} title={selectedCase?.title ?? t('admin.moderation.caseDetail')}>
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
        title={t('admin.moderation.banReportedTitle')}
        message={pendingBanSso ? t('admin.moderation.banConfirm', { sso: pendingBanSso }) : ''}
        confirmLabel={t('common.ban')}
        onCancel={() => setPendingBanSso(null)}
        onConfirm={handleConfirmBan}
      />
      {toast && <AdminActionToast message={toast.message} variant={toast.variant} onClose={closeToast} />}
    </div>
  )
}
