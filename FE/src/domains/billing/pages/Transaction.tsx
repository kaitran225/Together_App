import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/common'

export default function Transaction() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-900">Transactions</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-500 mt-1">Track your study rewards and usage history.</p>
      </div>
      <Card>
        <Table>
          <TableHead>
            <TableRow className="border-b border-white/10">
              <TableHeaderCell className="py-2">Date</TableHeaderCell>
              <TableHeaderCell className="py-2">Type</TableHeaderCell>
              <TableHeaderCell className="py-2 text-right">Amount</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow className="border-b border-white/10">
              <TableCell className="py-2">Today</TableCell>
              <TableCell className="py-2"><Badge variant="milestone" className="normal-case tracking-normal">XP earned</Badge></TableCell>
              <TableCell className="py-2 text-right font-semibold text-success">+50</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
