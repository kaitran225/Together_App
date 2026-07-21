import { useMemo, useState } from 'react'
import { Button, Card, Checkbox, Input, SegmentedControl } from '../../../components/common'
import { useAuth } from '../../../contexts/AuthContext'
import { useTranslation } from '../../../contexts/LanguageContext'

type UserPreferences = {
  theme: 'light' | 'dark' | 'system'
  notifications: { email: boolean; push: boolean; inApp: boolean }
}

export default function AdminAccountSettings() {
  const { t } = useTranslation()
  const { user, updateOwnProfile, changeOwnPassword, updateOwnPreferences } = useAuth()

  const [profile, setProfile] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    avatarUrl: user?.avatarUrl ?? '',
  })
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const initialPrefs = useMemo<UserPreferences>(() => ({
    theme: 'system',
    notifications: { email: true, push: true, inApp: true },
  }), [])
  const [preferences, setPreferences] = useState<UserPreferences>(initialPrefs)
  const [message, setMessage] = useState('')

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await updateOwnProfile(profile)
    setMessage(result.ok ? t('admin.account.profileUpdated') : result.error ?? t('admin.account.profileFailed'))
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      const result = await changeOwnPassword(passwordForm.current, passwordForm.next, passwordForm.confirm)
      setMessage(result.ok ? t('admin.account.passwordUpdated') : result.error ?? t('admin.account.passwordFailed'))
      if (result.ok) setPasswordForm({ current: '', next: '', confirm: '' })
    } catch (err: any) {
      setMessage(err.message || t('admin.account.passwordFailed'))
    }
  }

  const savePreferences = (e: React.FormEvent) => {
    e.preventDefault()
    const result = updateOwnPreferences(preferences)
    setMessage(result.ok ? t('admin.account.prefsSaved') : result.error ?? t('admin.account.prefsFailed'))
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-900">{t('admin.account.title')}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-500 mt-1">
          {t('admin.account.subtitle')}
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-900 mb-4">{t('admin.account.profile')}</h2>
        <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label={t('common.fullName')} value={profile.fullName} onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} />
          <Input label={t('common.email')} type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
          <Input label={t('admin.account.avatarUrl')} value={profile.avatarUrl} onChange={(e) => setProfile((p) => ({ ...p, avatarUrl: e.target.value }))} />
          <div className="md:col-span-3">
            <Button type="submit" variant="primary">{t('admin.account.saveProfile')}</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-900 mb-4">{t('admin.account.changePassword')}</h2>
        <form onSubmit={savePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label={t('admin.account.currentPassword')}
            type="password"
            value={passwordForm.current}
            onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
          />
          <Input
            label={t('admin.account.newPassword')}
            type="password"
            value={passwordForm.next}
            onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))}
          />
          <Input
            label={t('admin.account.confirmPassword')}
            type="password"
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
          />
          <div className="md:col-span-3">
            <Button type="submit" variant="primary">{t('admin.account.updatePassword')}</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-900 mb-4">{t('admin.account.preferences')}</h2>
        <form onSubmit={savePreferences} className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-500 mb-2">{t('admin.account.themePreference')}</p>
            <SegmentedControl
              value={preferences.theme}
              onChange={(next) => setPreferences((p) => ({ ...p, theme: next as UserPreferences['theme'] }))}
              options={[
                { value: 'system', label: t('admin.account.themeSystem') },
                { value: 'light', label: t('theme.light') },
                { value: 'dark', label: t('theme.dark') },
              ]}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-500 mb-2">{t('admin.account.notifications')}</p>
            <div className="flex flex-col gap-2 text-sm">
              {([
                ['email', 'admin.account.notifEmail'],
                ['push', 'admin.account.notifPush'],
                ['inApp', 'admin.account.notifInApp'],
              ] as const).map(([key, labelKey]) => (
                <Checkbox
                  key={key}
                  label={t(labelKey)}
                  checked={preferences.notifications[key]}
                  onChange={(e) => setPreferences((p) => ({
                    ...p,
                    notifications: { ...p.notifications, [key]: e.target.checked },
                  }))}
                />
              ))}
            </div>
          </div>

          <Button type="submit" variant="primary">{t('admin.account.savePreferences')}</Button>
        </form>
      </Card>

      {message && <p className="text-sm text-neutral-700 dark:text-primary">{message}</p>}
    </div>
  )
}
