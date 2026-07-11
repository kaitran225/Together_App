import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authApi } from '../../../api/client'
import { Card } from '../../../components/common'
import type { UserDto } from '../../../types/dto'

export default function PublicProfile() {
  const { sso } = useParams<{ sso: string }>()
  const [profile, setProfile] = useState<UserDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sso) return
    authApi.getPublicProfile(sso)
      .then(res => {
        if (res.success && res.data) {
          setProfile(res.data)
        } else {
          setError('User not found.')
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
    </div>
  )
}
