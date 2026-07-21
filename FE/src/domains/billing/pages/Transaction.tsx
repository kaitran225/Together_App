import { useState, useEffect } from 'react'
import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../../components/common'
import { workflowApi } from '../../../api/client'
import { useTranslation } from '../../../contexts/LanguageContext'

export default function Transaction() {
  const { t } = useTranslation()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    workflowApi.getTransactions()
      .then((res) => {
        if (res.success && res.data) {
          setTransactions(res.data)
        }
      })
      .catch((err) => console.error('Failed to load transactions:', err))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  const getBadgeVariant = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'PURCHASE': return 'milestone'
      case 'BONUS': return 'success'
      case 'SPEND': return 'error'
      case 'REWARD': return 'success'
      default: return 'outline'
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{t('transaction.title')}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{t('transaction.subtitle')}</p>
      </div>
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <svg className="w-12 h-12 mb-3 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">{t('transaction.emptyTitle')}</p>
            <p className="text-xs mt-1">{t('transaction.emptyHint')}</p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow className="border-b border-[var(--color-border)]">
                <TableHeaderCell className="py-2.5">{t('transaction.colTime')}</TableHeaderCell>
                <TableHeaderCell className="py-2.5">{t('transaction.colType')}</TableHeaderCell>
                <TableHeaderCell className="py-2.5">{t('transaction.colCategory')}</TableHeaderCell>
                <TableHeaderCell className="py-2.5">{t('transaction.colDescription')}</TableHeaderCell>
                <TableHeaderCell className="py-2.5 text-right">{t('transaction.colAmount')}</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.transactionId} className="border-b border-[var(--color-border)] hover:bg-[var(--color-accent-muted)] transition-colors">
                  <TableCell className="py-2.5 text-xs text-neutral-600">{formatDate(tx.createdAt)}</TableCell>
                  <TableCell className="py-2.5">
                    <Badge variant={getBadgeVariant(tx.type)} className="normal-case tracking-normal text-[11px]">
                      {tx.type || t('common.na')}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-neutral-700">{tx.category || '—'}</TableCell>
                  <TableCell className="py-2.5 text-xs text-neutral-600 max-w-[300px] truncate">{tx.description || '—'}</TableCell>
                  <TableCell className={`py-2.5 text-right font-semibold text-sm ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
