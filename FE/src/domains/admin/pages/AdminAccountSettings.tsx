import { useMemo, useState } from 'react'
import { Button, Card, Checkbox, Input, SegmentedControl } from '../../../components/common'
import { useAuth } from '../../../contexts/AuthContext'
import type { UserPreferences } from '../../../mocks/auth'

export default function AdminAccountSettings() {
  const { user, updateOwnProfile, changeOwnPassword, updateOwnPreferences } = useAuth()

  const [profile, setProfile] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    avatarUrl: user?.avatarUrl ?? '',
  })
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const initialPrefs = useMemo<UserPreferences>(() => (
    user?.preferences ?? {
      theme: 'system',
      notifications: { email: true, push: true, inApp: true },
    }
  ), [user?.preferences])
  const [preferences, setPreferences] = useState<UserPreferences>(initialPrefs)
  const [message, setMessage] = useState('')

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    const result = updateOwnProfile(profile)
    setMessage(result.ok ? 'Profile updated.' : result.error ?? 'Failed to update profile.')
  }

  const savePassword = (e: React.FormEvent) => {
    e.preventDefault()
    const result = changeOwnPassword(passwordForm.current, passwordForm.next, passwordForm.confirm)
    setMessage(result.ok ? 'Password updated.' : result.error ?? 'Failed to update password.')
    if (result.ok) setPasswordForm({ current: '', next: '', confirm: '' })
  }

  const savePreferences = (e: React.FormEvent) => {
    e.preventDefault()
    const result = updateOwnPreferences(preferences)
    setMessage(result.ok ? 'Preferences saved.' : result.error ?? 'Failed to save preferences.')
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-900">Admin Account</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-500 mt-1">
          Customize your profile, password, and personal preferences.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-900 mb-4">Profile</h2>
        <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Full name" value={profile.fullName} onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} />
          <Input label="Email" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
          <Input label="Avatar URL" value={profile.avatarUrl} onChange={(e) => setProfile((p) => ({ ...p, avatarUrl: e.target.value }))} />
          <div className="md:col-span-3">
            <Button type="submit" variant="primary">Save profile</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-900 mb-4">Change password</h2>
        <form onSubmit={savePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Current password"
            type="password"
            value={passwordForm.current}
            onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
          />
          <Input
            label="New password"
            type="password"
            value={passwordForm.next}
            onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))}
          />
          <Input
            label="Confirm new password"
            type="password"
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
          />
          <div className="md:col-span-3">
            <Button type="submit" variant="primary">Update password</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-900 mb-4">Preferences</h2>
        <form onSubmit={savePreferences} className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-500 mb-2">Theme preference</p>
            <SegmentedControl
              value={preferences.theme}
              onChange={(next) => setPreferences((p) => ({ ...p, theme: next as UserPreferences['theme'] }))}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-500 mb-2">Notifications</p>
            <div className="flex flex-col gap-2 text-sm">
              {([
                ['email', 'Email notifications'],
                ['push', 'Push notifications'],
                ['inApp', 'In-app notifications'],
              ] as const).map(([key, label]) => (
                <Checkbox
                  key={key}
                  label={label}
                  checked={preferences.notifications[key]}
                  onChange={(e) => setPreferences((p) => ({
                    ...p,
                    notifications: { ...p.notifications, [key]: e.target.checked },
                  }))}
                />
              ))}
            </div>
          </div>

          <Button type="submit" variant="primary">Save preferences</Button>
        </form>
      </Card>

      {message && <p className="text-sm text-neutral-700 dark:text-primary">{message}</p>}
    </div>
  )
}
