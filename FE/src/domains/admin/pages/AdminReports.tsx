import { useState, useEffect } from 'react'
import { Button } from '../../../components/common'
import { ChartContainer, BarChart, LineChart, useChartExport, usePdfExport } from '../charts'
import { AdminKpiCard, AdminPageSection } from '../components'
import { subscriptionsVsCancellation } from '../data/reportsData'
import { workflowApi } from '../../../api/client'
import { useTranslation } from '../../../contexts/LanguageContext'

export default function AdminReports() {
  const { t } = useTranslation()
  const [fromDate, setFromDate] = useState('2026-01-01')
  const [toDate, setToDate] = useState('2026-06-30')
  const usersExport = useChartExport()
  const subExport = useChartExport()
  const { exportSingleChartPdf, exportPageChartsPdf } = usePdfExport()

  const [kpis, setKpis] = useState([
    { label: t('admin.reports.totalUsers'), value: '—', hint: t('common.loading') },
    { label: t('admin.reports.activeUsers'), value: '—', hint: t('common.loading') },
  ])
  const [newUsersByMonth, setNewUsersByMonth] = useState<{ label: string; value: number }[]>([])

  useEffect(() => {
    setKpis([
      { label: t('admin.reports.totalUsers'), value: '—', hint: t('common.loading') },
      { label: t('admin.reports.activeUsers'), value: '—', hint: t('common.loading') },
    ])
    workflowApi.getAdminOverview()
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data
          setKpis([
            { label: t('admin.reports.totalUsers'), value: String(d.totalUsers ?? 0), hint: t('admin.reports.totalUsersHint') },
            { label: t('admin.reports.activeUsers'), value: String(d.activeUsers ?? 0), hint: t('admin.reports.activeUsersHint') },
          ])
        }
      })
      .catch((err) => console.error('Failed to load reports kpis:', err))

    workflowApi.getAdminUserGrowth(6)
      .then((res) => {
        if (res.success && res.data) {
          setNewUsersByMonth(res.data)
        }
      })
      .catch((err) => console.error('Failed to load new users by month:', err))
  }, [t])

  const rangeSubtitle = t('admin.reports.pdfRange', { from: fromDate, to: toDate })

  return (
    <div className="flex flex-col gap-4">
      <AdminPageSection
        title={t('admin.reports.title')}
        subtitle={t('admin.reports.subtitle')}
        action={
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-neutral-900" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-neutral-900" />
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                exportPageChartsPdf([usersExport.chartRef.current, subExport.chartRef.current], {
                  title: t('admin.reports.pdfTitle'),
                  subtitle: rangeSubtitle,
                })
              }
            >
              {t('admin.exportPagePdf')}
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          {kpis.map((kpi) => (
            <AdminKpiCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} />
          ))}
        </div>
      </AdminPageSection>

      <div className="grid gap-4 xl:grid-cols-2">
        <div ref={usersExport.chartRef}>
          <ChartContainer
            title={t('admin.reports.newUsersPerMonth')}
            legend={[{ label: t('admin.legendUsers'), color: '#5CB5F2' }]}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportSingleChartPdf(usersExport.chartRef.current, { title: t('admin.reports.newUsersPdf'), subtitle: rangeSubtitle })}
              >
                {t('common.exportPdf')}
              </Button>
            }
          >
            <BarChart data={newUsersByMonth} />
          </ChartContainer>
        </div>
        {/* Still mock: the backend has no subscription/cancellation lifecycle tracking yet —
            payment_transactions only records generic purchases, with no way to distinguish a
            new subscription from a coin top-up or to record a cancellation event at all. Wiring
            this up for real requires adding that tracking first, not just an API call. */}
        <div ref={subExport.chartRef}>
          <ChartContainer
            title={t('admin.reports.subsVsCancel')}
            legend={[{ label: t('admin.reports.subscriptions'), color: '#8FC766' }, { label: t('admin.reports.cancellations'), color: '#DE6B38' }]}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportSingleChartPdf(subExport.chartRef.current, { title: t('admin.reports.subsVsCancelPdf'), subtitle: rangeSubtitle })}
              >
                {t('common.exportPdf')}
              </Button>
            }
          >
            <p className="text-xs text-neutral-500 mb-2 px-1">
              {t('admin.reports.subsVsCancelNote')}
            </p>
            <LineChart
              data={subscriptionsVsCancellation}
              series={[
                { key: 'subscriptions', label: t('admin.reports.subscriptions'), color: '#8FC766' },
                { key: 'cancellations', label: t('admin.reports.cancellations'), color: '#DE6B38' },
              ]}
            />
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}
