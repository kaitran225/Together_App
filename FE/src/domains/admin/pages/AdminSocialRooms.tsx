import { useState, useEffect } from 'react'
import { Button, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/common'
import { AdminActionToast, AdminConfirmDialog, AdminKpiCard, AdminPageSection, AdminStatusBadge } from '../components'
import { useAdminActions } from '../hooks/useAdminActions'
import { workflowApi } from '../../../api/client'

export default function AdminSocialRooms() {
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
        showToast(`Room "${pendingRoom?.name ?? pendingCloseId}" was force-closed.`, 'warning')
        setPendingCloseId(null)
        await loadRooms()
      } else {
        showToast(res.message || 'Failed to force-close room.', 'error')
      }
    } catch {
      showToast('Error force-closing room.', 'error')
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageSection title="Social Rooms" subtitle="Monitor room activity and force-close if needed">
        <div className="max-w-sm">
          <AdminKpiCard label="Total Rooms" value={`${rooms.length}`} hint="Across all categories" />
        </div>
      </AdminPageSection>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : rooms.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-8">Chưa có phòng học nào.</p>
        ) : (
          <Table className="min-w-[860px]">
            <TableHead>
              <TableRow className="bg-transparent">
                <TableHeaderCell>Room Name</TableHeaderCell>
                <TableHeaderCell>Owner</TableHeaderCell>
                <TableHeaderCell>Max Members</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
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
                      {isClosed(row.status) ? 'Closed' : 'Force close'}
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
        title="Force close room"
        message={pendingRoom ? `Force-close room "${pendingRoom.name}"? All active members will be removed.` : ''}
        confirmLabel={closing ? 'Closing...' : 'Force close'}
        onCancel={() => setPendingCloseId(null)}
        onConfirm={handleForceClose}
      />
      {toast && <AdminActionToast message={toast.message} variant={toast.variant} onClose={closeToast} />}
    </div>
  )
}
