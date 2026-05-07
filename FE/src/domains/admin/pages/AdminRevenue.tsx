import { Button } from '../../../components/common'
import { ChartContainer, LineChart, PieChart, useChartExport, usePdfExport } from '../charts'
import { AdminKpiCard, AdminPageSection } from '../components'
import { revenueDistribution, revenueKpis, revenueOverTime } from '../data/revenueData'

export default function AdminRevenue() {
  const overTimeExport = useChartExport()
  const distExport = useChartExport()
  const { exportSingleChartPdf, exportPageChartsPdf } = usePdfExport()

  return (
    <div className="flex flex-col gap-4">
      <AdminPageSection
        title="Revenue"
        subtitle="Revenue performance and distribution"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              exportPageChartsPdf([overTimeExport.chartRef.current, distExport.chartRef.current], {
                title: 'Admin Revenue Charts',
                subtitle: 'Revenue report',
              })
            }
          >
            Export Page PDF
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          {revenueKpis.map((kpi) => (
            <AdminKpiCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} />
          ))}
        </div>
      </AdminPageSection>

      <div className="grid gap-4 xl:grid-cols-2">
        <div ref={overTimeExport.chartRef}>
          <ChartContainer
            title="Revenue over time"
            legend={[{ label: 'Revenue', color: '#5CB5F2' }]}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportSingleChartPdf(overTimeExport.chartRef.current, { title: 'Revenue Over Time', subtitle: 'Monthly trend' })}
              >
                Export PDF
              </Button>
            }
          >
            <LineChart data={revenueOverTime} series={[{ key: 'revenue', label: 'Revenue', color: '#5CB5F2' }]} />
          </ChartContainer>
        </div>
        <div ref={distExport.chartRef}>
          <ChartContainer
            title="Revenue distribution"
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportSingleChartPdf(distExport.chartRef.current, { title: 'Revenue Distribution', subtitle: 'Plan share' })}
              >
                Export PDF
              </Button>
            }
            legend={[
              { label: 'Basic', color: '#8FC766' },
              { label: 'Pro', color: '#5CB5F2' },
              { label: 'Premium', color: '#A896F2' },
            ]}
          >
            <PieChart data={revenueDistribution} colors={['#8FC766', '#5CB5F2', '#A896F2']} />
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}

