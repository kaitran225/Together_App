import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, Input } from '../../../components/common'

export default function MeetingLobby() {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')

  const handleStartNew = () => {
    navigate('/meetings/room')
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCode.trim()) return
    navigate('/meetings/room', { state: { roomCode: roomCode.trim() } })
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-4 md:py-8 space-y-6">
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-6 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Badge variant="focus" className="mb-2 normal-case tracking-normal">Collaborative study calls</Badge>
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight uppercase tracking-[0.06em]">Meetings</h1>
            <p className="text-sm md:text-base text-neutral-500 mt-2">
              Run focused sessions with your team, share progress, and keep study momentum.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-3 text-center">
            <Card className="p-3 md:p-4">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">Active now</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-primary">12</p>
            </Card>
            <Card className="p-3 md:p-4">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">Study teams</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-success">24</p>
            </Card>
            <Card className="p-3 md:p-4">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">Daily goal</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-highlight">2h</p>
            </Card>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 md:gap-5">
        <Card className="p-5 md:p-6 space-y-6">
          <section>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-900 mb-2">Start new meeting</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-4">Host a focused room and invite your group with one click.</p>
            <Button variant="primary" className="w-full md:w-auto px-6" onClick={handleStartNew}>
              Start new meeting
            </Button>
          </section>

          <hr className="border-neutral-200 dark:border-[var(--color-charcoal)]" />

          <section>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-900 mb-2">Join with code</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-4">Enter the code shared by your host to jump in quickly.</p>
            <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder="Room code (e.g. ABC-123)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="flex-1 min-w-0"
              />
              <Button type="submit" variant="secondary" className="sm:w-auto px-5">
                Join
              </Button>
            </form>
          </section>
        </Card>

        <Card className="p-5 md:p-6">
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-900 mb-3">Session tips</h3>
          <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-500">
            <li className="flex items-start gap-2">
              <Badge variant="milestone" className="mt-0.5">1</Badge>
              Share an agenda before starting.
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="streak" className="mt-0.5">2</Badge>
              Keep meetings under 30 minutes for focus.
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="focus" className="mt-0.5">3</Badge>
              End with clear tasks and owners.
            </li>
          </ul>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-5">
            Mock flow: no real rooms or calls. You will see sample participants in the meeting board.
          </p>
        </Card>
      </div>
    </div>
  )
}
