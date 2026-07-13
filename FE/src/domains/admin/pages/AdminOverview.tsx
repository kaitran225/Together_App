import { useState, useEffect } from 'react'
import { Button } from '../../../components/common'
import { ChartContainer, LineChart, PieChart, useChartExport, usePdfExport } from '../charts'
import { AdminKpiCard, AdminPageSection } from '../components'
import { userGrowthSeries, planDistribution } from '../data/dashboardData'
import { workflowApi } from '../../../api/client'

export default function AdminOverview() {
  const growthExport = useChartExport()
  const distExport = useChartExport()
  const { exportSingleChartPdf, exportPageChartsPdf } = usePdfExport()

  const [kpis, setKpis] = useState([
    { label: 'Total Users', value: '—', hint: 'Loading...' },
    { label: 'Active Users', value: '—', hint: 'Loading...' },
  ])

  useEffect(() => {
    workflowApi.getAdminOverview()
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data
          setKpis([
            { label: 'Total Users', value: String(d.totalUsers ?? 0), hint: 'Tổng số người dùng' },
            { label: 'Active Users', value: String(d.activeUsers ?? 0), hint: 'Người dùng đang hoạt động' },
          ])
        }
      })
      .catch((err) => console.error('Failed to load admin overview:', err))
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <AdminPageSection
        title="Dashboard"
        subtitle="Platform performance snapshot"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              exportPageChartsPdf([growthExport.chartRef.current, distExport.chartRef.current], {
                title: 'Admin Dashboard Charts',
                subtitle: 'Generated from admin overview',
              })
            }
          >
            Export Page PDF
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <AdminKpiCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} />
          ))}
        </div>
      </AdminPageSection>

      <div className="grid gap-4 xl:grid-cols-2">
        <div ref={growthExport.chartRef}>
          <ChartContainer
            title="User growth"
            subtitle="Monthly user signups"
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  exportSingleChartPdf(growthExport.chartRef.current, {
                    title: 'User Growth',
                    subtitle: 'Monthly user signups',
                  })
                }
              >
                Export PDF
              </Button>
            }
            legend={[{ label: 'Users', color: '#5CB5F2' }]}
          >
            <LineChart
              data={userGrowthSeries}
              series={[{ key: 'users', label: 'Users', color: '#5CB5F2' }]}
            />
          </ChartContainer>
        </div>

        <div ref={distExport.chartRef}>
          <ChartContainer
            title="Plan distribution"
            subtitle="Current subscription split"
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  exportSingleChartPdf(distExport.chartRef.current, {
                    title: 'Plan Distribution',
                    subtitle: 'Current subscription split',
                  })
                }
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
            <PieChart data={planDistribution} colors={['#8FC766', '#5CB5F2', '#A896F2']} />
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}
