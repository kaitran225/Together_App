import { useState, useEffect } from 'react'
import { Button } from '../../../components/common'
import { ChartContainer, LineChart, PieChart, useChartExport, usePdfExport } from '../charts'
import { AdminKpiCard, AdminPageSection } from '../components'
import { workflowApi } from '../../../api/client'
import { useTranslation } from '../../../contexts/LanguageContext'

export default function AdminRevenue() {
  const { t } = useTranslation()
  const overTimeExport = useChartExport()
  const distExport = useChartExport()
  const { exportSingleChartPdf, exportPageChartsPdf } = usePdfExport()

  const [kpis, setKpis] = useState([
    { label: t('admin.revenue.totalRevenue'), value: '—', hint: t('common.loading') },
    { label: t('admin.revenue.totalTransactions'), value: '—', hint: t('common.loading') },
  ])
  const [revenueOverTime, setRevenueOverTime] = useState<{ label: string; series: { revenue: number } }[]>([])
  const [revenueDistribution, setRevenueDistribution] = useState<{ label: string; value: number }[]>([])

  useEffect(() => {
    setKpis([
      { label: t('admin.revenue.totalRevenue'), value: '—', hint: t('common.loading') },
      { label: t('admin.revenue.totalTransactions'), value: '—', hint: t('common.loading') },
    ])
    workflowApi.getAdminRevenueKpis()
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data
          setKpis([
            { label: t('admin.revenue.totalRevenue'), value: `${Number(d.totalRevenue ?? 0).toLocaleString('vi-VN')} ${d.currency || 'VND'}`, hint: t('admin.revenue.totalRevenueHint') },
            { label: t('admin.revenue.totalTransactions'), value: String(d.totalTransactions ?? 0), hint: t('admin.revenue.totalTransactionsHint') },
          ])
        }
      })
      .catch((err) => console.error('Failed to load revenue kpis:', err))

    workflowApi.getAdminRevenueOverTime(6)
      .then((res) => {
        if (res.success && res.data) {
          setRevenueOverTime(res.data.map((d) => ({ label: d.label, series: { revenue: d.value } })))
        }
      })
      .catch((err) => console.error('Failed to load revenue over time:', err))

    workflowApi.getAdminRevenueDistribution()
      .then((res) => {
        if (res.success && res.data) {
          setRevenueDistribution(res.data)
        }
      })
      .catch((err) => console.error('Failed to load revenue distribution:', err))
  }, [t])

  return (
    <div className="flex flex-col gap-4">
      <AdminPageSection
        title={t('admin.revenue.title')}
        subtitle={t('admin.revenue.subtitle')}
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              exportPageChartsPdf([overTimeExport.chartRef.current, distExport.chartRef.current], {
                title: t('admin.revenue.pdfTitle'),
                subtitle: t('admin.revenue.pdfSubtitle'),
              })
            }
          >
            {t('admin.exportPagePdf')}
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          {kpis.map((kpi) => (
            <AdminKpiCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} />
          ))}
        </div>
      </AdminPageSection>

      <div className="grid gap-4 xl:grid-cols-2">
        <div ref={overTimeExport.chartRef}>
          <ChartContainer
            title={t('admin.revenue.overTime')}
            legend={[{ label: t('admin.revenue.legend'), color: '#5CB5F2' }]}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportSingleChartPdf(overTimeExport.chartRef.current, { title: t('admin.revenue.overTimePdf'), subtitle: t('admin.revenue.overTimeSubtitle') })}
              >
                {t('common.exportPdf')}
              </Button>
            }
          >
            <LineChart data={revenueOverTime} series={[{ key: 'revenue', label: t('admin.revenue.legend'), color: '#5CB5F2' }]} />
          </ChartContainer>
        </div>
        <div ref={distExport.chartRef}>
          <ChartContainer
            title={t('admin.revenue.distribution')}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportSingleChartPdf(distExport.chartRef.current, { title: t('admin.revenue.distributionPdf'), subtitle: t('admin.revenue.distributionSubtitle') })}
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
            <PieChart data={revenueDistribution} colors={['#8FC766', '#5CB5F2', '#A896F2']} />
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}
