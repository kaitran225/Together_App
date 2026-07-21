import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input, Modal, Card, Checkbox } from '../../../components/common'
import { myTeamsData, archivedData } from '../../../mocks'
import { workflowApi } from '../../../api/client'
import { useTranslation } from '../../../contexts/LanguageContext'

function MyTeamCard({
  id,
  tag,
  code,
  subtitle,
  members,
  avatarUrl,
  memberPreviews = [],
}: {
  id: string
  tag: string
  code: string
  subtitle: string
  members: number
  avatarUrl?: string
  memberPreviews?: { userSso: string; nickname?: string; avatarUrl?: string }[]
}) {
  const { t } = useTranslation()
  const previews = memberPreviews.slice(0, 3)
  const tagLabel =
    tag === 'PRIVATE' ? t('teams.tagPrivate') : tag === 'PUBLIC' ? t('teams.tagPublic') : tag
  return (
    <Link
      to={`/teams/board?teamId=${id}`}
      className="group flex-shrink-0 min-w-[180px] w-[210px] sm:min-w-[220px] sm:w-[240px] md:w-[260px] flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden transition-all duration-200 shadow-none hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="p-3 pb-2">
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] bg-[var(--color-charcoal)] border border-[var(--color-border)] text-neutral-800">
          {tagLabel}
        </span>
      </div>
      <div className="px-3 pb-3 flex flex-col flex-1 min-h-0">
        <div className="w-full aspect-[4/3] max-h-[120px] rounded-lg border border-[var(--color-border)] bg-[var(--color-charcoal)] overflow-hidden flex items-center justify-center text-[9px] font-semibold text-neutral-700 uppercase">
          {avatarUrl ? (
            <img src={avatarUrl} alt={code} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-neutral-500">{code.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <p className="mt-2 text-sm font-bold text-neutral-900 truncate">{code}</p>
        <p className="text-xs text-neutral-600 truncate">{subtitle}</p>
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div className="flex -space-x-1">
            {(previews.length > 0 ? previews : [1, 2, 3].slice(0, Math.min(3, Math.max(members, 1)))).map((m, i) => {
              const preview = typeof m === 'object' ? m : null
              const label = preview?.nickname || preview?.userSso || '?'
              const initials = label.slice(0, 2).toUpperCase()
              return preview?.avatarUrl ? (
                <img
                  key={preview.userSso || i}
                  src={preview.avatarUrl}
                  alt={label}
                  title={label}
                  className="w-5 h-5 rounded-full border border-[var(--color-border)] object-cover flex-shrink-0 bg-[var(--color-background)]"
                />
              ) : (
                <div
                  key={preview?.userSso || i}
                  title={preview ? label : undefined}
                  className="w-5 h-5 rounded-full bg-[var(--color-background)] border border-[var(--color-border)] flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-neutral-600"
                  aria-hidden={!preview}
                >
                  {preview ? initials : null}
                </div>
              )
            })}
          </div>
          <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-[0.06em]">
            {t('teams.membersCount', { count: members })}
          </span>
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center rounded-full bg-primary/20 text-neutral-900 px-2 py-0.5 text-[10px] font-semibold">
            {t('teams.goToBoard')}
          </span>
        </div>
      </div>
    </Link>
  )
}

function ArchivedCard({ name, active }: (typeof archivedData)[0]) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 hover:border-neutral-400 transition-colors shadow-none">
      <p className="text-xs font-semibold text-neutral-900 truncate">{name}</p>
      <span className="mt-1 px-1.5 py-0.5 bg-[var(--color-charcoal)] border border-[var(--color-border)] text-neutral-700 text-[9px] font-semibold rounded w-fit uppercase">
        {active}
      </span>
      <Link to="/teams/board" className="mt-auto pt-2">
        <Button variant="secondary" size="sm" className="w-full py-1 text-xs h-7 font-semibold">
          {t('teams.goToStudy')}
        </Button>
      </Link>
    </div>
  )
}

export default function AllTeams() {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDesc, setNewTeamDesc] = useState('')
  const [newTeamAvatar, setNewTeamAvatar] = useState('')
  const [newTeamIsPrivate, setNewTeamIsPrivate] = useState(false)
  const [newTeamMaxMembers, setNewTeamMaxMembers] = useState(4)
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadTeams = () => {
    workflowApi.getMyTeams()
      .then((res) => {
        if (res.success && res.data) {
          const mapped = res.data.map((team: any) => ({
            id: String(team.teamId),
            tag: team.isPrivate ? 'PRIVATE' : 'PUBLIC',
            code: team.name,
            subtitle: team.description || '',
            members: team.currentMemberCount || 1,
            avatarUrl: team.avatarUrl || undefined,
            memberPreviews: Array.isArray(team.memberPreviews) ? team.memberPreviews : [],
          }))
          const isMock = import.meta.env.VITE_USE_MOCK === 'true'
          if (mapped.length > 0) {
            setTeams(mapped)
          } else {
            setTeams(isMock ? myTeamsData : [])
          }
        } else {
          const isMock = import.meta.env.VITE_USE_MOCK === 'true'
          setTeams(isMock ? myTeamsData : [])
        }
      })
      .catch(() => {
        const isMock = import.meta.env.VITE_USE_MOCK === 'true'
        setTeams(isMock ? myTeamsData : [])
      })
  }

  useEffect(() => {
    loadTeams()
  }, [])

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      setError(t('teams.nameRequired'))
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await workflowApi.createTeam(
        newTeamName.trim(),
        newTeamDesc.trim(),
        newTeamAvatar.trim() || undefined,
        newTeamIsPrivate,
        newTeamMaxMembers
      )
      if (res.success) {
        setCreateOpen(false)
        setNewTeamName('')
        setNewTeamDesc('')
        setNewTeamAvatar('')
        setNewTeamIsPrivate(false)
        setNewTeamMaxMembers(4)
        loadTeams()
      } else {
        setError(res.message || t('teams.createFailed'))
      }
    } catch (err: any) {
      setError(err.message || t('teams.errorOccurred'))
    } finally {
      setLoading(false)
    }
  }

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      setError(t('teams.inviteCodeRequired'))
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await workflowApi.joinTeam(inviteCode.trim())
      if (res.success) {
        setJoinOpen(false)
        setInviteCode('')
        loadTeams()
      } else {
        setError(res.message || t('teams.joinFailed'))
      }
    } catch (err: any) {
      setError(err.message || t('teams.errorOccurred'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-3 p-3 md:p-4">
       <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
       <div className="flex items-center gap-2 min-w-0">
          <span className="text-neutral-600 shrink-0" aria-hidden>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <div>
            <h1 className="text-base md:text-lg font-bold text-neutral-900 truncate tracking-tight">{t('teams.myTeamsTitle')}</h1>
            <p className="text-xs text-neutral-500 truncate hidden sm:block">{t('teams.myTeamsSubtitle')}</p>
          </div>
        </div>
       </div>

      {/* Main: content panel + sidebar — responsive: stack on small, row on lg+ */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-3 overflow-hidden">
        <main className="flex-1 min-w-0 flex flex-col p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-none overflow-auto">
          <section className="mb-4">
            <h2 className="inline-block px-3 py-1.5 rounded-xl bg-[var(--color-charcoal)] border border-[var(--color-border)] text-neutral-800 text-xs font-bold uppercase tracking-wide mb-2">
              {t('teams.myTeamsSection')}
            </h2>
            <div className="relative flex items-center gap-2">
              <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto scroll-smooth py-1 min-h-[180px] [scrollbar-width:thin]"
              >
                {teams.length === 0 ? (
                  <div className="flex items-center justify-center min-h-[180px] text-neutral-500">
                    <p className="text-sm">{t('teams.empty')}</p>
                  </div>
                ) : (
                  teams.map((team) => (
                    <MyTeamCard key={team.id} {...team} />
                  ))
                )}
              </div>
            </div>
          </section>
          {import.meta.env.VITE_USE_MOCK === 'true' && (
          <section>
            <h2 className="inline-block px-3 py-1.5 rounded-xl bg-[var(--color-charcoal)] border border-[var(--color-border)] text-neutral-800 text-xs font-bold uppercase tracking-wide mb-2">
              {t('teams.archivedSection')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
              {archivedData.map((team) => (
                <div key={team.id} className="min-w-0">
                  <ArchivedCard {...team} />
                </div>
              ))}
            </div>
          </section>
          )}
        </main>

        {/* Right sidebar — full width when stacked, fixed width on lg+ */}
        <aside className="w-full lg:w-80 lg:shrink-0 flex flex-col overflow-hidden bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-none">
          <div className="flex items-center justify-between gap-2 pb-2 pt-4 px-4 border-b border-[var(--color-border)]">
            <h2 className="text-sm font-semibold text-neutral-900">{t('teams.quickActions')}</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0 flex flex-col gap-2 sm:gap-3">
            <button
              onClick={() => { setError(''); setCreateOpen(true); }}
              className="flex flex-row items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-charcoal)] hover:border-primary/40 hover:bg-[var(--color-cream-200)] transition-colors text-neutral-900 py-2.5 px-3 sm:py-3 shadow-none"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-neutral-900 text-lg font-bold leading-tight shrink-0">+</span>
              <span className="text-sm font-semibold">{t('teams.createNewTeam')}</span>
            </button>
            <button
              onClick={() => { setError(''); setJoinOpen(true); }}
              className="flex flex-row items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-charcoal)] hover:border-primary/40 hover:bg-[var(--color-cream-200)] transition-colors text-neutral-900 py-2.5 px-3 sm:py-3 shadow-none"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-neutral-900 text-lg font-bold leading-tight shrink-0">→</span>
              <span className="text-sm font-semibold">{t('teams.joinByCode')}</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Create Team Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} size="max-w-md" title={t('teams.createModalTitle')}>
        <Card className="p-5 w-full">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">{t('teams.createModalTitle')}</h3>
          {error && <div className="p-3 mb-3 bg-red-50 text-red-600 text-xs rounded border border-red-200">{error}</div>}
          <div className="flex flex-col gap-4 mb-4">
            <Input
              label={t('teams.teamName')}
              placeholder={t('teams.teamNamePlaceholder')}
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              required
            />
            <Input
              label={t('teams.description')}
              placeholder={t('teams.descriptionPlaceholder')}
              value={newTeamDesc}
              onChange={(e) => setNewTeamDesc(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700">{t('teams.teamAvatar')}</label>
              <div className="flex items-center gap-3">
                {newTeamAvatar ? (
                  <img src={newTeamAvatar} alt={t('teams.teamPreviewAlt')} className="w-12 h-12 rounded-xl object-cover border border-[var(--color-border)]" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-charcoal)] border border-[var(--color-border)] flex items-center justify-center text-neutral-400 font-bold text-xs uppercase">
                    {t('teams.noAvatar')}
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    id="team-avatar-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          setError(t('teams.imageTooLarge'))
                          return
                        }
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          setNewTeamAvatar(event.target?.result as string)
                          setError('')
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  <label
                    htmlFor="team-avatar-upload"
                    className="inline-flex items-center justify-center px-3 py-1.5 border border-[var(--color-border)] rounded-md text-xs font-semibold text-neutral-800 bg-[var(--color-charcoal)] hover:bg-[var(--color-border)] cursor-pointer transition-colors"
                  >
                    {t('teams.uploadImage')}
                  </label>
                  {newTeamAvatar && (
                    <button
                      type="button"
                      onClick={() => setNewTeamAvatar('')}
                      className="ml-2 text-xs text-red-600 hover:text-red-700 font-semibold"
                    >
                      {t('teams.clear')}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700">{t('teams.maxMembers')}</label>
              <select
                value={newTeamMaxMembers}
                onChange={(e) => setNewTeamMaxMembers(parseInt(e.target.value))}
                className="w-full px-3 py-1.5 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-md text-sm focus:outline-none"
              >
                <option value={4}>{t('teams.slots', { count: 4 })}</option>
                <option value={5}>{t('teams.slots', { count: 5 })}</option>
                <option value={6}>{t('teams.slots', { count: 6 })}</option>
              </select>
            </div>
            <div className="flex items-center gap-2 py-1">
              <Checkbox
                label={t('teams.privateTeam')}
                checked={newTeamIsPrivate}
                onChange={(e) => setNewTeamIsPrivate(e.target.checked)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" className="flex-1" onClick={handleCreateTeam} disabled={loading}>
              {loading ? t('teams.creating') : t('teams.create')}
            </Button>
          </div>
        </Card>
      </Modal>

      {/* Join Team Modal */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} size="max-w-md" title={t('teams.joinModalTitle')}>
        <Card className="p-5 w-full">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">{t('teams.joinModalTitle')}</h3>
          {error && <div className="p-3 mb-3 bg-red-50 text-red-600 text-xs rounded border border-red-200">{error}</div>}
          <div className="flex flex-col gap-4 mb-4">
            <Input
              label={t('teams.inviteCode')}
              placeholder={t('teams.inviteCodePlaceholder')}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setJoinOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" className="flex-1" onClick={handleJoinTeam} disabled={loading}>
              {loading ? t('teams.joining') : t('teams.join')}
            </Button>
          </div>
        </Card>
      </Modal>
    </div>
  )
}
