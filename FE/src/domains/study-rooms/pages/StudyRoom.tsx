import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AiBotIcon, Button, Card, ChatInputBar, IconButton, Modal } from '../../../components/common'
import { STUDY_ROOM_CHAT_MESSAGES as CHAT_MESSAGES, STUDY_ROOM_PARTICIPANTS as PARTICIPANTS } from '../../../mocks'

export default function StudyRoom() {
  const [showEndModal, setShowEndModal] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [micOn, setMicOn] = useState(true)
  const [videoOn, setVideoOn] = useState(true)

  return (
    <div className="min-h-screen w-full flex flex-col bg-neutral-200 dark:bg-[var(--color-background)] gap-3 p-3">
      {/* Header — solid white, stronger border and shadow for contrast */}
      <header
        className="flex-shrink-0 flex items-center justify-between gap-4 px-4 md:px-5 py-2 bg-white border-2 border-neutral-300 rounded-2xl shadow-md"
        role="banner"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-neutral-600 shrink-0" aria-hidden>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.253v2.47M12 3.41v2.47M3.288 8.49h2.47M18.712 8.49h2.47M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2 2 6.477 2 12zm10 4.5v2.5m-2.5-2.5h5" />
            </svg>
          </span>
          <h1 className="text-base md:text-lg font-bold text-neutral-900 truncate tracking-tight">Meeting room</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <span className="px-2.5 py-1 text-sm border-2 border-neutral-300 rounded-xl bg-neutral-100 font-mono tabular-nums text-neutral-900 font-semibold">
            01:42:15
          </span>
          <Button
            variant="primary"
            size="sm"
            className="!bg-error !border-error hover:!opacity-90 text-white text-[11px] font-bold rounded-xl"
            onClick={() => setShowEndModal(true)}
          >
            End
          </Button>
          <span className="w-7 h-7 rounded-full bg-accent-muted text-neutral-800 dark:text-primary border-2 border-primary/30 flex items-center justify-center text-[10px] font-semibold shrink-0" aria-hidden>
            N
          </span>
        </div>
      </header>

      {/* Main: video grid + chat sidebar — white panels on darker background */}
      <div className="flex-1 flex min-h-0 gap-3 overflow-hidden">
        {/* Video grid — white card with stronger border/shadow */}
        <main className="flex-1 min-w-0 p-4 flex items-center justify-center bg-white rounded-2xl border-2 border-neutral-300 shadow-md overflow-auto">
          <div className="grid grid-cols-3 gap-3 w-full max-w-4xl aspect-video">
            {PARTICIPANTS.slice(0, 9).map((p, i) => (
              <div
                key={i}
                className={`aspect-video rounded-xl border-2 flex items-center justify-center text-xs font-semibold ${
                  p.isYou
                    ? 'border-primary bg-accent-muted text-neutral-900 shadow'
                    : 'border-neutral-300 bg-neutral-50 text-neutral-700 shadow-sm'
                }`}
              >
                {p.name}{p.isYou ? ' (YOU)' : ''}
              </div>
            ))}
          </div>
        </main>

        {/* Right: Chat — white card with stronger border */}
        <aside className="w-80 shrink-0 flex flex-col overflow-hidden bg-white rounded-2xl border-2 border-neutral-300 shadow-md">
          <div className="flex items-center justify-between gap-2 pb-1.5 mb-0 pt-4 px-4 border-b-2 border-neutral-300">
            <h2 className="text-sm font-semibold text-neutral-900">Conversation</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
            {CHAT_MESSAGES.map((m, i) => (
              <div key={i} className={m.ai ? 'flex justify-center' : m.own ? 'flex justify-end' : ''}>
                <div className={m.ai ? 'flex gap-2 max-w-[90%]' : 'max-w-[90%]'}>
                  {m.ai && (
                    <span className="w-6 h-6 rounded-full bg-accent-muted flex-shrink-0 flex items-center justify-center overflow-hidden" aria-hidden>
                      <AiBotIcon className="w-5 h-5" />
                    </span>
                  )}
                  <div
                    className={`rounded-lg border-2 ${
                      m.ai
                        ? 'p-2 bg-neutral-200 border-neutral-400 text-neutral-700 text-[10px]'
                        : m.own
                          ? 'p-2 bg-neutral-900 border-neutral-900 text-white'
                          : 'p-2 rounded-lg border-2 border-neutral-300 bg-neutral-100 text-neutral-900'
                    }`}
                  >
                    {!m.ai && (
                      <div className="flex justify-between items-start gap-1">
                        <span className={`text-[9px] font-semibold uppercase ${m.own ? 'text-neutral-300' : 'text-neutral-600'}`}>
                          {m.user}
                        </span>
                        {m.time && <span className="text-[9px] text-neutral-500">{m.time}</span>}
                      </div>
                    )}
                    <p className="text-xs font-medium mt-0.5">{m.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t-2 border-neutral-300">
            <ChatInputBar
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onSend={() => {}}
              onFileChange={() => {}}
              placeholder="Type a message..."
            />
          </div>
        </aside>
      </div>

      {/* Footer — solid white, stronger border and shadow */}
      <footer
        className="flex-shrink-0 flex items-center justify-center gap-4 px-4 md:px-5 py-2 bg-white border-2 border-neutral-300 rounded-2xl shadow-md"
      >
        <div className="flex items-center gap-2">
          <IconButton onClick={() => setMicOn(!micOn)} label={micOn ? 'Mute' : 'Unmute'} className={`border-2 ${micOn ? 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400' : 'bg-red-100 border-red-400 text-red-700'}`} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>} />
          <IconButton onClick={() => setVideoOn(!videoOn)} label={videoOn ? 'Turn off camera' : 'Turn on camera'} className={`border-2 ${videoOn ? 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400' : 'bg-red-100 border-red-400 text-red-700'}`} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>} />
          <IconButton label="Share screen" className="border-2 border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
          <IconButton label="Participants" className="border-2 border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
        </div>
        <Link to="/study-rooms" className="ml-4">
          <Button variant="secondary" size="sm" className="gap-1.5 rounded-xl text-[11px] font-bold py-1.5 h-8 border-2 border-neutral-900">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Leave
          </Button>
        </Link>
      </footer>

      {/* End session modal — Card component uses dashboard theme */}
      <Modal open={showEndModal} onClose={() => setShowEndModal(false)} size="max-w-md" title="End study session?">
          <Card className="p-5 max-w-md w-full">
            <p className="text-lg font-bold text-neutral-900 text-center mb-4">
              End study session?
            </p>
            <div className="flex gap-3 mb-4">
              <Button variant="primary" size="md" className="flex-1" onClick={() => setShowEndModal(false)}>
                Continue
              </Button>
              <Link to="/study-rooms" className="flex-1">
                <Button variant="secondary" size="md" className="w-full !bg-error/10 !border-error/50 !text-error hover:!bg-error/20">
                  End session
                </Button>
              </Link>
            </div>
            <div className="flex justify-between gap-4 text-center border-t border-neutral-200 pt-4">
              <div>
                <p className="text-xl font-bold text-neutral-900">1h 42m</p>
                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mt-1">Time studied</p>
              </div>
              <div className="w-px bg-neutral-200" />
              <div>
                <p className="text-xl font-bold text-neutral-900">9</p>
                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mt-1">Members</p>
              </div>
            </div>
          </Card>
      </Modal>
    </div>
  )
}
