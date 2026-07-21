import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, IconButton, Input } from '../../../components/common'
import { RECOMMENDED_ROOMS } from '../../../mocks'
import { readApi, workflowApi } from '../../../api/client'

export default function RecommendRoomMatching() {
  const [goal, setGoal] = useState('')
  const [subject, setSubject] = useState('')
  const [rooms, setRooms] = useState<any[]>([])
  const [matching, setMatching] = useState(false)
  const [matchError, setMatchError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    readApi.getSuggestedRooms()
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          const topicLabels: Record<string, string> = { math: 'MATHEMATICS', science: 'SCIENCE', lang: 'LANGUAGES' }
          const mapped = res.data.map((r: any) => {
            const activeCount = r.members ? r.members.filter((m: any) => m.isActive).length : 0
            const topic = topicLabels[r.topic] || 'OTHER'
            return {
              id: String(r.roomId),
              title: r.title,
              subject: topic,
              active: activeCount
            }
          })
          setRooms(mapped)
        } else {
          const isMock = import.meta.env.VITE_USE_MOCK === 'true'
          setRooms(isMock ? RECOMMENDED_ROOMS : [])
        }
      })
      .catch(() => {
        const isMock = import.meta.env.VITE_USE_MOCK === 'true'
        setRooms(isMock ? RECOMMENDED_ROOMS : [])
      })
  }, [])

  const handleMatchRoom = async () => {
    if (!goal.trim()) {
      setMatchError('Goal is required for AI matching.')
      return
    }
    setMatchError('')
    setMatching(true)
    try {
      const res = await workflowApi.matchRoom({
        title: `Group Study: ${subject.trim() || 'General'}`,
        description: `Focused study room for ${subject.trim() || 'general learning'}.`,
        goalDescription: goal.trim(),
        goalDurationDays: 1,
        maxMembers: 10,
        isPremium: false,
        isPublic: true,
        roomType: 'SOCIAL'
      })
      if (res.success && res.data) {
        navigate(`/study-room?roomId=${res.data.roomId}`)
      } else {
        setMatchError(res.message || 'Failed to match a room.')
      }
    } catch (err: any) {
      setMatchError(err.message || 'An error occurred during matching.')
    } finally {
      setMatching(false)
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 280, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-8 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-neutral-200">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 bg-neutral-700 rounded-sm shrink-0" aria-hidden />
          <h1 className="text-xl font-bold text-neutral-900 uppercase tracking-tight">Matching room</h1>
        </div>
        <Link to="/study-rooms">
          <Button variant="secondary" size="md" className="border-2 border-neutral-200">
            Go back
          </Button>
        </Link>
      </div>

      {/* AI Matching section */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 uppercase tracking-tight mb-3">
          Find the best study room for you
        </h2>
        <p className="text-sm text-neutral-600 mb-8 max-w-xl mx-auto">
          Describe what you’re studying and Together AI will match you with study groups that fit your goals.
        </p>
        
        {matchError && (
          <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg max-w-xl mx-auto">
            {matchError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-6">
          <div className="flex flex-col gap-2 text-left">
            <label className="text-sm font-bold text-neutral-900 uppercase">Goal</label>
            <Input
              placeholder="Goal..."
              className="h-14 rounded-lg border-2 border-neutral-200 bg-neutral-50/50 text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-accent focus:border-accent"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              aria-label="Goal"
            />
          </div>
          <div className="flex flex-col gap-2 text-left">
            <label className="text-sm font-bold text-neutral-900 uppercase">Subject</label>
            <Input
              placeholder="Subject..."
              className="h-14 rounded-lg border-2 border-neutral-200 bg-neutral-50/50 text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-accent focus:border-accent"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              aria-label="Subject"
            />
          </div>
        </div>
        <Button
          variant="primary"
          size="lg"
          className="px-8"
          onClick={handleMatchRoom}
          disabled={matching}
        >
          {matching ? 'Matching...' : 'Match with AI'}
        </Button>
      </div>

      {/* Recommendations */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-1.5 rounded-lg bg-neutral-100 border-2 border-neutral-200 text-neutral-700 text-xs font-semibold">
            Sessions 4/5
          </span>
          <h3 className="text-lg font-bold text-neutral-900 uppercase tracking-tight">Recommendations for you</h3>
        </div>
        <p className="text-xs font-semibold text-neutral-600 uppercase">• Live</p>
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scroll-smooth scrollbar-thin"
            style={{ scrollbarWidth: 'thin' }}
          >
            {rooms.map((room) => (
              <div
                key={room.id}
                className="shrink-0 w-64 rounded-lg border-2 border-neutral-200 bg-white p-4 flex flex-col gap-3 shadow-sm"
              >
                <h4 className="font-bold text-neutral-900 text-base leading-tight">{room.title}</h4>
                <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">{room.subject}</p>
                <div className="flex items-center justify-between gap-2 mt-auto pt-2">
                  <span className="px-2.5 py-1 rounded-lg bg-success text-white text-xs font-bold">
                    {room.active} Active
                  </span>
                  <Link to={`/study-room?roomId=${room.id}`}>
                    <Button variant="secondary" size="sm" className="border-2 border-neutral-200 text-xs">
                      Join
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <IconButton
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 border-2 border-neutral-200 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 shadow-sm -translate-x-2 z-10"
            label="Scroll right"
            icon={(
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          />
        </div>
      </div>
    </div>
  )
}
