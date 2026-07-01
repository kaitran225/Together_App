import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Input, RadioGroup, Textarea, Select } from '../../../components/common'
import { topicOptions, durationOptions } from '../../../mocks'
import { workflowApi } from '../../../api/client'

export default function CreateNewRoomStudy() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('math')
  const [duration, setDuration] = useState('none')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [maxMembers, setMaxMembers] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Room name is required.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await workflowApi.createRoom(
        title.trim(),
        description.trim(),
        maxMembers,
        isPublic
      )
      if (res.success) {
        navigate('/study-rooms')
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
              label="Room Name"
              placeholder="e.g. Advanced Calculus Group Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Topic Selection"
                options={topicOptions}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <Select
                label="Duration (Optional)"
                options={durationOptions}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <Textarea
              label="Main Study Goals"
              placeholder="What are we focusing on today? (e.g., Reviewing Chapter 4 exercises, Mock Exam practice)"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            <Input
              label="Max members"
              type="number"
              placeholder="10"
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              min={2}
              max={100}
            />
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
