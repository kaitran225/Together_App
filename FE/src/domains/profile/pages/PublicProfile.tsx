import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authApi, workflowApi } from '../../../api/client'
import { Card, Modal } from '../../../components/common'
import type { UserDto } from '../../../types/dto'

export default function PublicProfile() {
  const { sso } = useParams<{ sso: string }>()
  const [profile, setProfile] = useState<UserDto | null>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [selectedAchievement, setSelectedAchievement] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sso) return
    setLoading(true)
    Promise.all([
      authApi.getPublicProfile(sso),
      workflowApi.getPublicAchievements(sso)
    ])
      .then(([profileRes, achievementsRes]) => {
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data)
        } else {
          setError('User not found.')
        }
        if (achievementsRes.success && achievementsRes.data) {
          setAchievements(achievementsRes.data)
        }
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load profile.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [sso])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center gap-4">
        <svg className="w-16 h-16 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-bold text-neutral-900">Profile Not Found</h2>
        <p className="text-sm text-neutral-500">The user you are looking for does not exist or has set their profile to private.</p>
        <Link to="/dashboard" className="mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors">Return to Dashboard</Link>
      </div>
    )
  }

  const userLevel = profile.level || 1
  const displayName = profile.fullName || profile.email?.split('@')[0] || 'Guest'

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 h-full">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Column - Profile Header & Info */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          <Card className="p-6 flex flex-col items-center text-center shadow-none border-2 border-neutral-200">
            <div className="w-24 h-24 rounded-full bg-neutral-200 border-4 border-white shadow-sm flex items-center justify-center overflow-hidden mb-4">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-neutral-400">{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 uppercase tracking-tight">{displayName}</h1>
            <p className="text-sm text-neutral-600 mb-2">{profile.planType ?? 'FREE'} · Level {userLevel}</p>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase mt-2">
              {profile.status === 'ACTIVE' ? 'Active' : 'Offline'}
            </span>
          </Card>

          <Card className="p-6 border-2 border-neutral-200 shadow-none" heading="Statistics">
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between items-center"><span className="text-neutral-600 font-medium">Total study time</span><strong className="text-neutral-900 text-base">{Math.round((profile.exp || 0) / 60)}h</strong></li>
              <li className="flex justify-between items-center"><span className="text-neutral-600 font-medium">Streak</span><strong className="text-neutral-900 text-base">{profile.streak ?? 0} days</strong></li>
              <li className="flex justify-between items-center"><span className="text-neutral-600 font-medium">Max Streak</span><strong className="text-neutral-900 text-base">{profile.longestStreak ?? 0} days</strong></li>
              <li className="flex justify-between items-center"><span className="text-neutral-600 font-medium">Total EXP</span><strong className="text-neutral-900 text-base text-primary">{profile.exp ?? 0}</strong></li>
            </ul>
          </Card>
        </div>

        {/* Right Column - Skills & Goals */}
        <div className="w-full md:w-2/3 flex flex-col gap-6 min-w-0">
          <Card className="p-6 border-2 border-neutral-200 shadow-none flex-1">
            <h2 className="text-lg font-extrabold text-neutral-900 uppercase tracking-tight mb-4 border-b border-neutral-100 pb-2">Skills</h2>
            <div className="flex flex-wrap gap-2 mb-8">
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map((s, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg shadow-sm">
                    {s}
                  </span>
                ))
              ) : (
                <p className="text-sm text-neutral-500 italic">This user hasn't added any skills yet.</p>
              )}
            </div>

            <h2 className="text-lg font-extrabold text-neutral-900 uppercase tracking-tight mb-4 border-b border-neutral-100 pb-2">Achievements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {achievements && achievements.length > 0 ? (
                achievements.map((ach) => {
                  const unlocked = ach.isUnlocked
                  return (
                    <div
                      key={ach.achievementId}
                      onClick={() => setSelectedAchievement(ach)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                        unlocked
                          ? 'bg-amber-50/40 border-amber-200 shadow-sm hover:border-amber-300'
                          : 'bg-neutral-50/50 border-neutral-200/60 opacity-60 hover:opacity-85'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-white p-1 border ${
                          unlocked ? 'border-amber-200' : 'border-neutral-200'
                        }`}
                      >
                        <img
                          src={ach.iconUrl || 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png'}
                          alt={ach.displayName}
                          className={`w-full h-full object-contain ${unlocked ? '' : 'grayscale'}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-sm font-bold text-neutral-800 truncate">{ach.displayName}</p>
                          {unlocked ? (
                            <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md shrink-0">
                              Unlocked
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold uppercase bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded-md shrink-0">
                              Locked
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">{ach.description}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-neutral-500 italic col-span-2">No achievements found.</p>
              )}
            </div>

            <h2 className="text-lg font-extrabold text-neutral-900 uppercase tracking-tight mb-4 border-b border-neutral-100 pb-2">Learning Goals</h2>
            <ul className="space-y-3">
              {profile.learningGoals && profile.learningGoals.length > 0 ? (
                profile.learningGoals.map((g, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <span className="text-primary mt-0.5">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                    <span className="text-sm text-neutral-700 font-medium leading-relaxed">{g}</span>
                  </li>
                ))
              ) : (
                <p className="text-sm text-neutral-500 italic">No specific learning goals defined.</p>
              )}
            </ul>
          </Card>
        </div>

      </div>
      {selectedAchievement && (
        <Modal
          open={!!selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
          title="Chi Tiết Thành Tựu"
          size="max-w-md"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center p-2 border-2 ${
                selectedAchievement.isUnlocked
                  ? 'bg-amber-50 border-amber-300 shadow-md'
                  : 'bg-neutral-50 border-dashed border-neutral-350 opacity-60'
              }`}
            >
              <img
                src={selectedAchievement.iconUrl || 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png'}
                alt={selectedAchievement.displayName}
                className={`w-full h-full object-contain ${
                  selectedAchievement.isUnlocked ? '' : 'grayscale'
                }`}
              />
            </div>
            
            <div>
              <h3 className="text-xl font-extrabold text-neutral-800">{selectedAchievement.displayName}</h3>
              <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider mt-1">
                Yêu cầu: {selectedAchievement.requirementType}
              </p>
            </div>

            <p className="text-sm text-neutral-600 px-2 leading-relaxed">
              {selectedAchievement.description}
            </p>

            <div className="w-full bg-neutral-50 rounded-xl p-3 border border-neutral-100 mt-2 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-semibold">Mục tiêu</span>
                <span className="text-neutral-800 font-bold">
                  {selectedAchievement.requirementValue} {selectedAchievement.requirementType === 'STREAK' ? 'Ngày liên tiếp' : selectedAchievement.requirementType === 'LEVEL' ? 'Cấp độ' : 'EXP'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-neutral-100 pt-2">
                <span className="text-neutral-500 font-semibold">Phần thưởng</span>
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  +{selectedAchievement.expReward} EXP · +{selectedAchievement.coinReward} xu
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-neutral-100 pt-2">
                <span className="text-neutral-500 font-semibold">Trạng thái</span>
                {selectedAchievement.isUnlocked ? (
                  <span className="text-green-600 font-bold uppercase tracking-wider text-[10px]">
                    Đã mở khóa
                  </span>
                ) : (
                  <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    Chưa đạt được
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedAchievement(null)}
              className="mt-4 w-full py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary-dark transition-all active:scale-[0.98]"
            >
              Đóng
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
