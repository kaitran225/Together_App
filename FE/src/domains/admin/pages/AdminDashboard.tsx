import { Badge, Card } from '../../../components/common'
import { useAuth } from '../../../contexts/AuthContext'
import { useTranslation } from '../../../contexts/LanguageContext'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { users } = useAuth()
  const adminCount = users.filter((u) => u.role === 'ADMIN').length
  const activeCount = users.filter((u) => u.active).length

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-900">{t('admin.dashboard.title')}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-500 mt-1">
          {t('admin.dashboard.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-500">{t('admin.dashboard.totalUsers')}</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-900">{users.length}</p>
          <Badge variant="milestone" className="mt-2 normal-case tracking-normal">{t('admin.dashboard.platformGrowth')}</Badge>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-500">{t('admin.dashboard.activeUsers')}</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-success">{activeCount}</p>
          <Badge variant="focus" className="mt-2 normal-case tracking-normal">{t('admin.dashboard.healthyEngagement')}</Badge>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-500">{t('admin.dashboard.adminAccounts')}</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-primary">{adminCount}</p>
          <Badge variant="primary" className="mt-2 normal-case tracking-normal">{t('admin.dashboard.governanceReady')}</Badge>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-900 mb-2">{t('admin.dashboard.gettingStarted')}</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-500">
          {t('admin.dashboard.gettingStartedBody')}
        </p>
      </Card>
    </div>
  )
}
