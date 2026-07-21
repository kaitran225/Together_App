import { Link } from 'react-router-dom'
import { Card } from '../../../components/common'
import { useTranslation } from '../../../contexts/LanguageContext'

export default function StudyRoomDashboard() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">{t('studyRooms.dashboardTitle')}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card heading={t('studyRooms.activeRooms')}>
          <p className="text-neutral-600">{t('studyRooms.noActiveRooms')} <Link to="/study-rooms/create-new" className="underline font-medium">{t('studyRooms.createOne')}</Link>.</p>
        </Card>
        <Card heading={t('studyRooms.recentActivity')}>
          <p className="text-neutral-600 text-sm">{t('studyRooms.recentActivityEmpty')}</p>
        </Card>
      </div>
    </div>
  )
}
