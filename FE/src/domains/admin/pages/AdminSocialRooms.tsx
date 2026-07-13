import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/common'
import { AdminKpiCard, AdminPageSection, AdminStatusBadge } from '../components'
import { workflowApi } from '../../../api/client'

export default function AdminSocialRooms() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    workflowApi.getAdminRooms()
      .then((res) => {
        if (res.success && res.data) {
          setRooms(res.data)
        }
      })
      .catch((err) => console.error('Failed to load admin rooms:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <AdminPageSection title="Social Rooms" subtitle="Monitor room activity and engagement">
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
          <Table className="min-w-[760px]">
            <TableHead>
              <TableRow className="bg-transparent">
                <TableHeaderCell>Room Name</TableHeaderCell>
                <TableHeaderCell>Owner</TableHeaderCell>
                <TableHeaderCell>Max Members</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms.map((row) => (
                <TableRow key={row.roomId} className="hover:brightness-[1.01]">
                  <TableCell className="px-2 py-3 text-sm font-semibold text-neutral-900">{row.name}</TableCell>
                  <TableCell className="px-2 py-3 text-sm text-neutral-800">{row.createdBy || '—'}</TableCell>
                  <TableCell className="px-2 py-3 text-sm text-neutral-800">{row.maxMembers ?? '—'}</TableCell>
                  <TableCell className="px-2 py-3"><AdminStatusBadge status={row.status || 'UNKNOWN'} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
