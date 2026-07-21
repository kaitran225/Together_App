import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Input, Select, SegmentedControl } from '../../../components/common'
import { useTranslation } from '../../../contexts/LanguageContext'

export default function Personalize() {
  const { t } = useTranslation()
  const [goal, setGoal] = useState('2')

  const majorOptions = [
    { value: '', label: t('profile.personalizeSelectMajor') },
    { value: 'cs', label: t('profile.personalizeMajorCs') },
    { value: 'eng', label: t('profile.personalizeMajorEng') },
    { value: 'bio', label: t('profile.personalizeMajorBio') },
    { value: 'econ', label: t('profile.personalizeMajorEcon') },
    { value: 'other', label: t('profile.personalizeOther') },
  ]

  const institutionOptions = [
    { value: '', label: t('profile.personalizeSelectInstitution') },
    { value: 'uni-a', label: t('profile.personalizeUniA') },
    { value: 'uni-b', label: t('profile.personalizeUniB') },
    { value: 'college', label: t('profile.personalizeCollege') },
    { value: 'other', label: t('profile.personalizeOther') },
  ]

  const studyGoals = [
    { value: '1', label: t('profile.personalizeGoalBasic') },
    { value: '2', label: t('profile.personalizeGoalGood') },
    { value: '4', label: t('profile.personalizeGoalExcellent') },
    { value: '6', label: t('profile.personalizeGoalElite') },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">{t('profile.personalizeStep', { current: 1, total: 3 })}</span>
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-[width]" style={{ width: '33%' }} />
          </div>
          <span className="text-sm font-medium text-neutral-600 w-10">33%</span>
        </div>
      </div>

      <Card className="p-6 shadow-sm border-2 border-neutral-200">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">{t('profile.personalizeTitle')}</h1>

        <div className="space-y-5">
          <Select
            label={t('profile.personalizeMajor')}
            options={majorOptions}
            defaultValue=""
          />
          <Select
            label={t('profile.personalizeInstitution')}
            options={institutionOptions}
            defaultValue=""
          />
          <Input
            label={t('profile.personalizeYear')}
            placeholder={t('profile.personalizeYearPlaceholder')}
          />

          <div>
            <p className="text-sm font-medium text-neutral-900 mb-3">{t('profile.personalizeDailyGoal')}</p>
            <SegmentedControl
              value={goal}
              onChange={setGoal}
              options={studyGoals.map((g) => ({ value: g.value, label: g.label }))}
            />
          </div>
        </div>

        <div className="flex justify-between mt-8 pt-6 border-t border-neutral-200">
          <Link to="/welcome">
            <Button variant="secondary">{t('profile.personalizeBack')}</Button>
          </Link>
          <Link to="/personalize-2">
            <Button variant="primary">{t('profile.personalizeNext')}</Button>
          </Link>
        </div>
      </Card>

      <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent-muted/50 p-4 flex items-center gap-4">
        <span className="w-12 h-12 rounded-full border-2 border-dashed border-accent flex items-center justify-center text-accent shrink-0" aria-hidden>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{t('profile.personalizeUnlockTitle')}</p>
          <p className="text-xs text-neutral-600 mt-0.5">{t('profile.personalizeUnlockDesc')}</p>
        </div>
      </div>
    </div>
  )
}
