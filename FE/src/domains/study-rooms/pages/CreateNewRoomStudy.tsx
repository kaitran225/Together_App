import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Input, RadioGroup, Textarea, Select, Switch } from '../../../components/common'
import { workflowApi } from '../../../api/client'

const durationDaysOptions = [
  { value: '1', label: '1 ngày (1 Day)' },
  { value: '3', label: '3 ngày (3 Days)' },
  { value: '7', label: '7 ngày (7 Days)' },
  { value: '14', label: '14 ngày (14 Days)' },
  { value: '30', label: '30 ngày (30 Days)' },
]

export default function CreateNewRoomStudy() {
  const navigate = useNavigate()
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
      setError('Room name is required.')
      return
    }
    if (!goalDescription.trim()) {
      setError('Study Goal is required.')
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
        setError(res.message || 'Failed to create room.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      <div className="pb-6 border-b border-neutral-200">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">Set Up Your Study Space</h1>
        <p className="text-lg text-neutral-600">Choose your settings to create a productive environment for you and your peers.</p>
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
              label="Tên phòng (Room Name)"
              placeholder="e.g. Advanced Calculus Group Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              label="Mô tả phòng học (Room Description)"
              placeholder="Short description of your room..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label="Chủ đề (Topic)"
              placeholder="e.g. Math, Science, Language,..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}            
            />
            <Textarea
              label="Mục tiêu học tập (Main Study Goals)"
              placeholder="What are we focusing on today? (e.g., Reviewing Chapter 4 exercises, Mock Exam practice)"
              rows={3}
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              required
            />
            <Select
              label="Thời gian hoạt động mục tiêu (Goal Duration)"
              options={durationDaysOptions}
              value={String(goalDurationDays)}
              onChange={(e) => setGoalDurationDays(Number(e.target.value))}
            />
          </div>
        </Card>
        <Card heading="Access & Capacity">
          <div className="flex flex-col gap-6">
            <div className="p-4 border border-neutral-200 rounded-lg flex flex-col gap-3">
              <div>
                <p className="font-bold text-sm text-neutral-900">Room Privacy</p>
                <p className="text-xs text-neutral-500">Public rooms can be searched by anyone. Private rooms require direct links.</p>
              </div>
              <RadioGroup
                name="access"
                value={isPublic ? 'public' : 'private'}
                options={[
                  { value: 'public', label: 'Public Room' },
                  { value: 'private', label: 'Private Room' },
                ]}
                onChange={(val) => setIsPublic(val === 'public')}
              />
            </div>
            <Select
              label="Số lượng thành viên tối đa (Max members)"
              value={String(maxMembers)}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              options={Array.from({ length: 20 }, (_, i) => ({
                value: String(i + 1),
                label: `${i + 1} thành viên`
              }))}
            />
            <div className="p-4 border border-neutral-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                  <span>Phòng Premium (Premium Room)</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">PRO</span>
                </p>
                <p className="text-xs text-neutral-500">High-quality workspace with premium features.</p>
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
            <Button variant="secondary">Cancel</Button>
          </Link>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Room'}
          </Button>
        </div>
      </div>
    </div>
  )
}
