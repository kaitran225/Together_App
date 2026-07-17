import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, Input } from '../../../components/common'
import { workflowApi } from '../../../api/client'
import { useAuth } from '../../../contexts/AuthContext'
import { useTranslation } from '../../../contexts/LanguageContext'

export default function MeetingLobby() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeNowCount, setActiveNowCount] = useState(0)
  const [roomCode, setRoomCode] = useState('')
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [meetingTitle, setMeetingTitle] = useState('')
  const [agenda, setAgenda] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    workflowApi.getMyTeams()
      .then(async (res) => {
        if (res.success && res.data) {
          setTeams(res.data)
          if (res.data.length > 0) {
            setSelectedTeamId(res.data[0].teamId.toString())

            try {
              const activePromises = res.data.map((team: any) => workflowApi.getActiveMeeting(team.teamId))
              const activeResults = await Promise.all(activePromises)
              const count = activeResults.filter((r) => r.success && r.data != null).length
              setActiveNowCount(count)
            } catch (e) {
              console.error('Error fetching active meetings:', e)
            }
          }
        }
      })
      .catch((err) => console.error('Error fetching teams:', err))
  }, [])

  useEffect(() => {
    if (!selectedTeamId) return
    workflowApi.getProjects(selectedTeamId)
      .then((res) => {
        if (res.success && res.data) {
          setProjects(res.data)
          if (res.data.length > 0) {
            setSelectedProjectId(res.data[0].projectId.toString())
          } else {
            setSelectedProjectId('')
          }
        }
      })
      .catch((err) => console.error('Error fetching projects:', err))
  }, [selectedTeamId])

  const handleStartNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeamId) {
      setError(t('meetings.errorSelectTeam'))
      return
    }
    if (!meetingTitle.trim()) {
      setError(t('meetings.errorTitle'))
      return
    }

    setLoading(true)
    setError('')
    try {
      const projId = selectedProjectId ? parseInt(selectedProjectId) : undefined
      const res = await workflowApi.createMeeting(
        parseInt(selectedTeamId),
        meetingTitle.trim(),
        projId,
        agenda.trim() || undefined
      )
      if (res.success && res.data) {
        await workflowApi.joinMeeting(res.data.meetingId)
        navigate(`/meetings/room?meetingId=${res.data.meetingId}`)
      } else {
        setError(res.message || t('meetings.errorCreate'))
      }
    } catch (err: any) {
      console.error(err)
      setError(t('meetings.errorServer'))
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCode.trim()) return
    const id = parseInt(roomCode.trim())
    if (isNaN(id)) {
      setError(t('meetings.errorIdNumber'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await workflowApi.joinMeeting(id)
      if (res.success) {
        navigate(`/meetings/room?meetingId=${id}`)
      } else {
        setError(res.message || t('meetings.errorCreate'))
      }
    } catch (err: any) {
      console.error(err)
      setError(t('meetings.errorServer'))
    } finally {
      setLoading(false)
    }
  }

  const selectClass =
    'w-full h-10 px-3 rounded-lg border-2 border-neutral-200 dark:border-[var(--color-border)] text-sm focus:border-neutral-900 bg-[var(--color-surface)] text-neutral-900'

  return (
    <div className="w-full max-w-5xl mx-auto py-4 md:py-8 space-y-6">
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-6 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight uppercase tracking-[0.06em]">
              {t('meetings.heroTitle')}
            </h1>
            <p className="text-sm md:text-base text-neutral-500 mt-2">
              {t('meetings.heroSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-3 text-center">
            <Card className="p-3 md:p-4">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">{t('meetings.activeNow')}</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-primary">{activeNowCount}</p>
            </Card>
            <Card className="p-3 md:p-4">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">{t('meetings.studyTeams')}</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-success">{teams.length}</p>
            </Card>
            <Card className="p-3 md:p-4">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">{t('meetings.dailyGoal')}</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-highlight">
                {user?.planType === 'PREMIUM' || user?.planType === 'TEAM' || user?.planType === 'COMBO' ? '8h' : '2h'}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 dark:bg-red-950/40 dark:text-red-300 rounded-lg" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 md:gap-5">
        <Card className="p-5 md:p-6 space-y-6">
          <section>
            <h2 className="text-base font-bold text-neutral-900 mb-2">{t('meetings.createTitle')}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-4">{t('meetings.createDesc')}</p>

            <form onSubmit={handleStartNew} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5">{t('meetings.selectTeam')}</label>
                  <select
                    className={selectClass}
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    required
                  >
                    <option value="">{t('meetings.selectTeamPlaceholder')}</option>
                    {teams.map((team) => (
                      <option key={team.teamId} value={team.teamId}>{team.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5">{t('meetings.selectProject')}</label>
                  <select
                    className={selectClass}
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    <option value="">{t('meetings.noProject')}</option>
                    {projects.map((p) => (
                      <option key={p.projectId} value={p.projectId}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5">{t('meetings.meetingTitle')}</label>
                <Input
                  type="text"
                  placeholder={t('meetings.meetingTitlePlaceholder')}
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5">{t('meetings.agenda')}</label>
                <Input
                  type="text"
                  placeholder={t('meetings.agendaPlaceholder')}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                />
              </div>

              <Button type="submit" variant="primary" className="w-full md:w-auto px-6" disabled={loading}>
                {loading ? t('meetings.creating') : t('meetings.start')}
              </Button>
            </form>
          </section>

          <hr className="border-neutral-200 dark:border-[var(--color-border)]" />

          <section>
            <h2 className="text-base font-bold text-neutral-900 mb-3">{t('meetings.joinTitle')}</h2>
            <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                placeholder={t('meetings.joinPlaceholder')}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="secondary" disabled={loading || !roomCode.trim()}>
                {t('meetings.join')}
              </Button>
            </form>
          </section>
        </Card>

        <Card className="p-5 md:p-6">
          <h3 className="text-base font-bold text-neutral-900 mb-3">{t('meetings.tipsTitle')}</h3>
          <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-500">
            <li className="flex items-start gap-2">
              <Badge variant="milestone" className="mt-0.5">1</Badge>
              {t('meetings.tip1')}
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="streak" className="mt-0.5">2</Badge>
              {t('meetings.tip2')}
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="focus" className="mt-0.5">3</Badge>
              {t('meetings.tip3')}
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
