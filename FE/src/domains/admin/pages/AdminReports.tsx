import { useState } from 'react'
import { Button } from '../../../components/common'
import { ChartContainer, BarChart, LineChart, useChartExport, usePdfExport } from '../charts'
import { AdminKpiCard, AdminPageSection } from '../components'
import { newUsersByMonth, reportsKpis, subscriptionsVsCancellation } from '../data/reportsData'

export default function AdminReports() {
  const [fromDate, setFromDate] = useState('2026-01-01')
  const [toDate, setToDate] = useState('2026-06-30')
  const usersExport = useChartExport()
  const subExport = useChartExport()
  const { exportSingleChartPdf, exportPageChartsPdf } = usePdfExport()

  return (
    <div className="flex flex-col gap-4">
      <AdminPageSection
        title="Reports"
        subtitle="Date range based reporting snapshot"
        action={
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-neutral-900" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-neutral-900" />
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                exportPageChartsPdf([usersExport.chartRef.current, subExport.chartRef.current], {
                  title: 'Admin Reports Charts',
                  subtitle: `${fromDate} to ${toDate}`,
                })
              }
            >
              Export Page PDF
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          {reportsKpis.map((kpi) => (
            <AdminKpiCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} />
          ))}
        </div>
      </AdminPageSection>

      <div className="grid gap-4 xl:grid-cols-2">
        <div ref={usersExport.chartRef}>
          <ChartContainer
            title="New users per month"
            legend={[{ label: 'Users', color: '#5CB5F2' }]}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportSingleChartPdf(usersExport.chartRef.current, { title: 'New Users Per Month', subtitle: `${fromDate} to ${toDate}` })}
              >
                Export PDF
              </Button>
            }
          >
            <BarChart data={newUsersByMonth} />
          </ChartContainer>
        </div>
        <div ref={subExport.chartRef}>
          <ChartContainer
            title="Subscriptions vs cancellation"
            legend={[{ label: 'Subscriptions', color: '#8FC766' }, { label: 'Cancellations', color: '#DE6B38' }]}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportSingleChartPdf(subExport.chartRef.current, { title: 'Subscriptions Vs Cancellation', subtitle: `${fromDate} to ${toDate}` })}
              >
                Export PDF
              </Button>
            }
          >
            <LineChart
              data={subscriptionsVsCancellation}
              series={[
                { key: 'subscriptions', label: 'Subscriptions', color: '#8FC766' },
                { key: 'cancellations', label: 'Cancellations', color: '#DE6B38' },
              ]}
            />
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}

