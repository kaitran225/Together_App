import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Input, RadioGroup, Textarea, Select, Switch } from '../../../components/common'
import { workflowApi } from '../../../api/client'
import { useTranslation } from '../../../contexts/LanguageContext'

export default function CreateNewRoomStudy() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalDurationDays, setGoalDurationDays] = useState(7)
  const [maxMembers, setMaxMembers] = useState(10)
  const [isPremium, setIsPremium] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!title.trim()) {
      setError(t('studyRooms.errorRoomNameRequired'))
      return
    }
    if (!goalDescription.trim()) {
      setError(t('studyRooms.errorGoalRequired'))
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await workflowApi.createRoom(
        title.trim(),
        description.trim(),
        goalDescription.trim(),
        goalDurationDays,
        maxMembers,
        isPremium,
        isPublic,
        'SOCIAL', // roomType defaults to 'SOCIAL'
        topic || undefined
      )
      if (res.success) {
        if (res.data?.roomId) {
          navigate(`/study-room?roomId=${res.data.roomId}`)
        } else {
          navigate('/study-rooms')
        }
      } else {
        setError(res.message || t('studyRooms.errorFailed'))
      }
    } catch (err: any) {
      setError(err.message || t('studyRooms.errorConnect'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      <div className="pb-6 border-b border-neutral-200">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">{t('studyRooms.createTitle')}</h1>
        <p className="text-lg text-neutral-600">{t('studyRooms.createSubtitle')}</p>
      </div>
      <div className="flex flex-col gap-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <Card>
          <div className="flex flex-col gap-6">
            <Input
              label={t('studyRooms.roomNameLabel')}
              placeholder={t('studyRooms.roomNamePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              label={t('studyRooms.roomDescLabel')}
              placeholder={t('studyRooms.roomDescPlaceholder')}
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label={t('studyRooms.topicLabel')}
              placeholder={t('studyRooms.topicPlaceholder')}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}            
            />
            <Textarea
              label={t('studyRooms.goalLabel')}
              placeholder={t('studyRooms.goalPlaceholder')}
              rows={3}
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              required
            />
            <Select
              label={t('studyRooms.goalDurationLabel')}
              options={[{value:"1",label:t("studyRooms.duration1")},{value:"3",label:t("studyRooms.duration3")},{value:"7",label:t("studyRooms.duration7")},{value:"14",label:t("studyRooms.duration14")},{value:"30",label:t("studyRooms.duration30")}]}
              value={String(goalDurationDays)}
              onChange={(e) => setGoalDurationDays(Number(e.target.value))}
            />
          </div>
        </Card>
        <Card heading={t("studyRooms.accessCapacity")}>
          <div className="flex flex-col gap-6">
            <div className="p-4 border border-neutral-200 rounded-lg flex flex-col gap-3">
              <div>
                <p className="font-bold text-sm text-neutral-900">{t('studyRooms.roomPrivacy')}</p>
                <p className="text-xs text-neutral-500">{t('studyRooms.roomPrivacyDesc')}</p>
              </div>
              <RadioGroup
                name="access"
                value={isPublic ? 'public' : 'private'}
                options={[
                  { value: 'public', label: t('studyRooms.publicRoom') },
                  { value: 'private', label: t('studyRooms.privateRoom') },
                ]}
                onChange={(val) => setIsPublic(val === 'public')}
              />
            </div>
            <Select
              label={t('studyRooms.maxMembersLabel')}
              value={String(maxMembers)}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              options={Array.from({ length: 20 }, (_, i) => ({
                value: String(i + 1),
                label: t('studyRooms.memberCount', { count: i + 1 })
              }))}
            />
            <div className="p-4 border border-neutral-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                  <span>{t('studyRooms.premiumRoom')}</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">PRO</span>
                </p>
                <p className="text-xs text-neutral-500">{t('studyRooms.premiumRoomDesc')}</p>
              </div>
              <Switch
                checked={isPremium}
                onChange={setIsPremium}
              />
            </div>
          </div>
        </Card>
        <div className="flex gap-4">
          <Link to="/study-rooms">
            <Button variant="secondary">{t('common.cancel')}</Button>
          </Link>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? t('studyRooms.creating') : t('studyRooms.createRoom')}
          </Button>
        </div>
      </div>
    </div>
  )
}
