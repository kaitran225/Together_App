import { Link } from 'react-router-dom'
import { Button, Card } from '../../../components/common'
import { useTranslation } from '../../../contexts/LanguageContext'

export default function FocusRoomDialog() {
  const { t } = useTranslation()
  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="text-center">
        <h2 className="text-xl font-bold mb-4">{t('focusRoom.dialogTitle')}</h2>
        <p className="text-neutral-600 mb-6">{t('focusRoom.dialogSubtitle')}</p>
        <div className="flex gap-4 justify-center">
          <Link to="/focus-room"><Button variant="primary">{t('common.start')}</Button></Link>
          <Link to="/dashboard"><Button variant="secondary">{t('common.cancel')}</Button></Link>
        </div>
      </Card>
    </div>
  )
}
