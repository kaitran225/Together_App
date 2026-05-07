import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/common'
import { AdminKpiCard, AdminPageSection, AdminStatusBadge } from '../components'
import { socialRoomsData, totalRooms } from '../data/socialRoomsData'

export default function AdminSocialRooms() {
  return (
    <div className="flex flex-col gap-4">
      <AdminPageSection title="Social Rooms" subtitle="Monitor room activity and engagement">
        <div className="max-w-sm">
          <AdminKpiCard label="Total Rooms" value={`${totalRooms}`} hint="Across all categories" />
        </div>
      </AdminPageSection>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <Table className="min-w-[760px]">
          <TableHead>
            <TableRow className="bg-transparent">
              <TableHeaderCell>Room Name</TableHeaderCell>
              <TableHeaderCell>Owner</TableHeaderCell>
              <TableHeaderCell>Participants Count</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {socialRoomsData.map((row) => (
              <TableRow key={row.roomName} className="hover:brightness-[1.01]">
                <TableCell className="px-2 py-3 text-sm font-semibold text-neutral-900">{row.roomName}</TableCell>
                <TableCell className="px-2 py-3 text-sm text-neutral-800">{row.owner}</TableCell>
                <TableCell className="px-2 py-3 text-sm text-neutral-800">{row.participants}</TableCell>
                <TableCell className="px-2 py-3"><AdminStatusBadge status={row.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

