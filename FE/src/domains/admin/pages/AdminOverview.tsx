import { useState, useEffect } from 'react'
import { Button } from '../../../components/common'
import { ChartContainer, LineChart, PieChart, useChartExport, usePdfExport } from '../charts'
import { AdminKpiCard, AdminPageSection } from '../components'
import { workflowApi } from '../../../api/client'
import { useTranslation } from '../../../contexts/LanguageContext'

export default function AdminOverview() {
  const { t } = useTranslation()
  const growthExport = useChartExport()
  const distExport = useChartExport()
  const { exportSingleChartPdf, exportPageChartsPdf } = usePdfExport()

  const [kpis, setKpis] = useState([
    { label: t('admin.overview.totalUsers'), value: '—', hint: t('common.loading') },
    { label: t('admin.overview.activeUsers'), value: '—', hint: t('common.loading') },
  ])
  const [userGrowthSeries, setUserGrowthSeries] = useState<{ label: string; series: { users: number } }[]>([])
  const [planDistribution, setPlanDistribution] = useState<{ label: string; value: number }[]>([])

  useEffect(() => {
    setKpis([
      { label: t('admin.overview.totalUsers'), value: '—', hint: t('common.loading') },
      { label: t('admin.overview.activeUsers'), value: '—', hint: t('common.loading') },
    ])
    workflowApi.getAdminOverview()
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data
          setKpis([
            { label: t('admin.overview.totalUsers'), value: String(d.totalUsers ?? 0), hint: t('admin.overview.totalUsersHint') },
            { label: t('admin.overview.activeUsers'), value: String(d.activeUsers ?? 0), hint: t('admin.overview.activeUsersHint') },
          ])
        }
      })
      .catch((err) => console.error('Failed to load admin overview:', err))

    workflowApi.getAdminUserGrowth(6)
      .then((res) => {
        if (res.success && res.data) {
          setUserGrowthSeries(res.data.map((d) => ({ label: d.label, series: { users: d.value } })))
        }
      })
      .catch((err) => console.error('Failed to load user growth:', err))

    workflowApi.getAdminPlanDistribution()
      .then((res) => {
        if (res.success && res.data) {
          setPlanDistribution(res.data)
        }
      })
      .catch((err) => console.error('Failed to load plan distribution:', err))
  }, [t])

  return (
    <div className="flex flex-col gap-5">
      <AdminPageSection
        title={t('admin.overview.title')}
        subtitle={t('admin.overview.subtitle')}
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              exportPageChartsPdf([growthExport.chartRef.current, distExport.chartRef.current], {
                title: t('admin.overview.pdfTitle'),
                subtitle: t('admin.overview.pdfSubtitle'),
              })
            }
          >
            {t('admin.exportPagePdf')}
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
            title={t('admin.overview.userGrowth')}
            subtitle={t('admin.overview.userGrowthSubtitle')}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  exportSingleChartPdf(growthExport.chartRef.current, {
                    title: t('admin.overview.userGrowthPdf'),
                    subtitle: t('admin.overview.userGrowthSubtitle'),
                  })
                }
              >
                {t('common.exportPdf')}
              </Button>
            }
            legend={[{ label: t('admin.legendUsers'), color: '#5CB5F2' }]}
          >
            <LineChart
              data={userGrowthSeries}
              series={[{ key: 'users', label: t('admin.legendUsers'), color: '#5CB5F2' }]}
            />
          </ChartContainer>
        </div>

        <div ref={distExport.chartRef}>
          <ChartContainer
            title={t('admin.overview.planDistribution')}
            subtitle={t('admin.overview.planDistributionSubtitle')}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  exportSingleChartPdf(distExport.chartRef.current, {
                    title: t('admin.overview.planDistributionPdf'),
                    subtitle: t('admin.overview.planDistributionSubtitle'),
                  })
                }
              >
                {t('common.exportPdf')}
              </Button>
            }
            legend={[
              { label: t('admin.planBasic'), color: '#8FC766' },
              { label: t('admin.planPro'), color: '#5CB5F2' },
              { label: t('admin.planPremium'), color: '#A896F2' },
            ]}
          >
            <PieChart data={planDistribution} colors={['#8FC766', '#5CB5F2', '#A896F2']} />
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}
