import { Link } from 'react-router-dom'
import { Badge, Button, Card, Input } from '../../../components/common'
import { useTranslation } from '../../../contexts/LanguageContext'

export default function ConfirmMail() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full">
      <Card className="w-full max-w-[420px] p-7 md:p-8 border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-6">
        <div className="text-center space-y-2">
          <Badge variant="focus" className="normal-case tracking-normal">{t('auth.accountRecovery')}</Badge>
          <h2 className="text-neutral-900 text-3xl font-bold tracking-tight">{t('auth.forgotPasswordTitle')}</h2>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <Input label={t('auth.email')} placeholder={t('auth.emailPlaceholder')} type="email" />
          <Button type="submit" variant="primary" size="lg" className="w-full min-h-[48px] rounded-xl border-0 font-semibold uppercase tracking-wide">
            {t('auth.send')}
          </Button>
        </form>
        <hr className="border-[var(--color-border)]" />
        <p className="text-center text-sm text-neutral-500">
          <Link to="/welcome" className="font-semibold text-accent hover:opacity-90">{t('auth.backToLogin')}</Link>
        </p>
      </Card>
    </div>
  )
}
