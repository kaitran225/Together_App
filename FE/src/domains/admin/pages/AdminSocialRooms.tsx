import { useState, useEffect } from 'react'
import { Button, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/common'
import { AdminActionToast, AdminConfirmDialog, AdminKpiCard, AdminPageSection, AdminStatusBadge } from '../components'
import { useAdminActions } from '../hooks/useAdminActions'
import { workflowApi } from '../../../api/client'
import { useTranslation } from '../../../contexts/LanguageContext'

export default function AdminSocialRooms() {
  const { t } = useTranslation()
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingCloseId, setPendingCloseId] = useState<number | null>(null)
  const [closing, setClosing] = useState(false)
  const { toast, showToast, closeToast } = useAdminActions()

  const loadRooms = async () => {
    setLoading(true)
    try {
      const res = await workflowApi.getAdminRooms()
      if (res.success && res.data) setRooms(res.data)
    } catch (err) {
      console.error('Failed to load admin rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRooms()
  }, [])

  const pendingRoom = rooms.find((r) => r.roomId === pendingCloseId) ?? null
  const isClosed = (status?: string) => {
    const s = (status || '').toUpperCase()
    return s === 'EXPIRED' || s.includes('CLOSE')
  }

  const handleForceClose = async () => {
    if (!pendingCloseId) return
    setClosing(true)
    try {
      const res = await workflowApi.forceCloseAdminRoom(pendingCloseId)
      if (res.success) {
        showToast(t('admin.socialRooms.closedToast', { name: pendingRoom?.name ?? pendingCloseId }), 'warning')
        setPendingCloseId(null)
        await loadRooms()
      } else {
        showToast(res.message || t('admin.socialRooms.closeFailed'), 'error')
      }
    } catch {
      showToast(t('admin.socialRooms.closeError'), 'error')
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageSection title={t('admin.socialRooms.title')} subtitle={t('admin.socialRooms.subtitle')}>
        <div className="max-w-sm">
          <AdminKpiCard label={t('admin.socialRooms.totalRooms')} value={`${rooms.length}`} hint={t('admin.socialRooms.totalRoomsHint')} />
        </div>
      </AdminPageSection>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : rooms.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-8">{t('admin.socialRooms.empty')}</p>
        ) : (
          <Table className="min-w-[860px]">
            <TableHead>
              <TableRow className="bg-transparent">
                <TableHeaderCell>{t('admin.socialRooms.roomName')}</TableHeaderCell>
                <TableHeaderCell>{t('admin.socialRooms.owner')}</TableHeaderCell>
                <TableHeaderCell>{t('admin.socialRooms.maxMembers')}</TableHeaderCell>
                <TableHeaderCell>{t('common.status')}</TableHeaderCell>
                <TableHeaderCell className="text-right">{t('common.actions')}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms.map((row) => (
                <TableRow key={row.roomId} className="hover:brightness-[1.01]">
                  <TableCell className="px-2 py-3 text-sm font-semibold text-neutral-900">{row.name}</TableCell>
                  <TableCell className="px-2 py-3 text-sm text-neutral-800">{row.createdBy || '—'}</TableCell>
                  <TableCell className="px-2 py-3 text-sm text-neutral-800">{row.maxMembers ?? '—'}</TableCell>
                  <TableCell className="px-2 py-3"><AdminStatusBadge status={row.status || 'UNKNOWN'} /></TableCell>
                  <TableCell className="px-2 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isClosed(row.status)}
                      onClick={() => setPendingCloseId(row.roomId)}
                    >
                      {isClosed(row.status) ? t('common.closed') : t('admin.socialRooms.forceClose')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AdminConfirmDialog
        open={!!pendingRoom}
        title={t('admin.socialRooms.forceCloseTitle')}
        message={pendingRoom ? t('admin.socialRooms.forceCloseMessage', { name: pendingRoom.name }) : ''}
        confirmLabel={closing ? t('admin.socialRooms.closing') : t('admin.socialRooms.forceClose')}
        onCancel={() => setPendingCloseId(null)}
        onConfirm={handleForceClose}
      />
      {toast && <AdminActionToast message={toast.message} variant={toast.variant} onClose={closeToast} />}
    </div>
  )
}
