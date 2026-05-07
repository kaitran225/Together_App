import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card } from '../../../components/common'
import { MEETING_PARTICIPANTS as PARTICIPANTS, SUMMARY_ITEMS, MEETING_TASKS as TASKS } from '../../../mocks'

export default function MainMeetingBoard() {
  const navigate = useNavigate()
  return (
    <div className="flex h-full min-h-0 flex-col gap-0">
      {/* Recording indicator */}
      <div className="flex justify-end pb-3">
        <Badge variant="streak" className="rounded-md normal-case tracking-normal">
          ● Recording Live
        </Badge>
      </div>

      {/* Main: video grid + AI sidebar */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        {/* Video grid 2x2 */}
        <div className="grid min-h-0 grid-cols-2 gap-3 sm:gap-4">
          {PARTICIPANTS.map((p) => (
            <Card
              key={p.name}
              variant="interactive"
              className="flex flex-col rounded-xl border-2 border-neutral-300 bg-neutral-100/80 overflow-hidden p-0"
            >
              <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
                <span className="mb-2 text-xs font-bold uppercase text-neutral-500">Live feed</span>
                <span className="text-sm text-neutral-600">[ Video feed: {p.name} ]</span>
              </div>
              <div className="flex items-center gap-2 border-t border-neutral-200 bg-white/80 px-3 py-2">
                <div className="h-4 w-4 shrink-0 rounded border-2 border-neutral-400 bg-white" aria-hidden />
                <span className="text-sm font-medium text-neutral-900">
                  {p.name}{p.host ? ' (Host)' : ''}
                </span>
              </div>
            </Card>
          ))}
          {/* You (Camera Off) */}
          <div className="flex flex-col rounded-xl border-2 border-dashed border-neutral-400 bg-neutral-50 overflow-hidden">
            <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border-2 border-neutral-400 bg-neutral-100">
                <div className="h-6 w-6 rounded-full border-2 border-neutral-400" aria-hidden />
              </div>
              <span className="text-sm font-medium text-neutral-600">You (Camera Off)</span>
            </div>
            <div className="flex items-center gap-2 border-t border-neutral-200 bg-white/80 px-3 py-2">
              <div className="h-4 w-4 shrink-0 rounded border-2 border-neutral-400 bg-white" aria-hidden />
              <span className="text-sm font-medium text-neutral-900">Me</span>
            </div>
          </div>
        </div>

        {/* AI Companion sidebar */}
        <aside className="flex min-h-0 flex-col rounded-xl border-2 border-neutral-300 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3">
            <div className="h-4 w-4 shrink-0 rounded border-2 border-neutral-400 bg-white" aria-hidden />
            <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-900">AI Companion</h2>
            <div className="h-6 w-6 shrink-0 rounded-full border border-neutral-300 bg-neutral-100" aria-hidden />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
            {/* Real-time summary */}
            <section>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-700">Real-time summary</h3>
                <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase">
                  Auto-updating
                </Button>
              </div>
              <p className="text-xs text-neutral-600 mb-2">[Topic]: Selection of LLM frameworks.</p>
              <ul className="space-y-1.5 text-xs text-neutral-800">
                {SUMMARY_ITEMS.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </section>

            {/* Task suggestions */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-700 mb-3">Task suggestions</h3>
              <ul className="space-y-3">
                {TASKS.map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-neutral-400 bg-white" aria-hidden />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{t.title}</p>
                      <p className="text-[10px] text-neutral-500">Assignee: {t.assignee}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Post-meeting report */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-700 mb-2">Post-meeting report</h3>
              <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-4">
                <div className="h-4 w-4 shrink-0 rounded border-2 border-neutral-400 bg-white" aria-hidden />
                <p className="text-xs text-neutral-600">
                  [Placeholder: Analytics & transcript] Available 5m post-session
                </p>
              </div>
            </section>
          </div>
        </aside>
      </div>

      {/* Bottom control bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t-2 border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2 sm:gap-4">
          {['MIC', 'CAM', 'SCR', 'HND'].map((label) => (
            <Button key={label} variant="tonal" size="sm" className="uppercase">
              {label}
            </Button>
          ))}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Button variant="primary" size="md" className="uppercase" onClick={() => navigate('/meetings')}>
            End call
          </Button>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            Earn 50 XP for completing meeting
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="uppercase">
            Chat
          </Button>
          <Button variant="secondary" size="sm" className="uppercase">
            (4)
          </Button>
        </div>
      </div>
    </div>
  )
}
