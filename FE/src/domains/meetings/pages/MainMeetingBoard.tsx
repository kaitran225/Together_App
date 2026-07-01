import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Button, Card } from '../../../components/common'
import { MEETING_PARTICIPANTS as PARTICIPANTS, SUMMARY_ITEMS } from '../../../mocks'
import { workflowApi } from '../../../api/client'

export default function MainMeetingBoard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const meetingIdStr = searchParams.get('meetingId')
  const meetingId = meetingIdStr ? parseInt(meetingIdStr) : null

  const [summary, setSummary] = useState<any>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load meeting details & existing summary
  const loadMeetingData = async () => {
    if (!meetingId) return
    try {
      // Mock or fetch
      const summaryRes = await workflowApi.getMeetingSummary(meetingId)
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data)
      }
    } catch (err) {
      console.error('Error fetching meeting data:', err)
    }
  }

  useEffect(() => {
    loadMeetingData()
  }, [meetingId])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !meetingId) return

    setIsTranscribing(true)
    setUploadError('')
    try {
      const res = await workflowApi.transcribeMeeting(meetingId, file)
      if (res.success) {
        // Poll for summary
        let attempts = 0
        const interval = setInterval(async () => {
          attempts++
          const summaryRes = await workflowApi.getMeetingSummary(meetingId)
          if (summaryRes.success && summaryRes.data) {
            setSummary(summaryRes.data)
            setIsTranscribing(false)
            clearInterval(interval)
          } else if (attempts > 5) {
            setIsTranscribing(false)
            clearInterval(interval)
          }
        }, 2000)
      } else {
        setUploadError(res.message || 'Lỗi khi upload tệp âm thanh.')
        setIsTranscribing(false)
      }
    } catch (err) {
      console.error(err)
      setUploadError('Lỗi kết nối khi gửi tệp âm thanh.')
      setIsTranscribing(false)
    }
  }

  // Parse JSON safe helper
  const parseJsonList = (str: any): string[] => {
    if (!str) return []
    if (Array.isArray(str)) return str
    try {
      return JSON.parse(str)
    } catch {
      return [str]
    }
  }

  const parseJsonTasks = (str: any): any[] => {
    if (!str) return []
    if (Array.isArray(str)) return str
    try {
      return JSON.parse(str)
    } catch {
      return []
    }
  }

  const handleEndCall = async () => {
    if (meetingId) {
      try {
        await workflowApi.endMeeting(meetingId)
      } catch (e) {
        console.error(e)
      }
    }
    navigate('/meetings')
  }

  const keyPoints = summary ? parseJsonList(summary.keyPoints) : []
  const actionItems = summary ? parseJsonTasks(summary.actionItems) : []
  const decisions = summary ? parseJsonList(summary.decisionsMade) : []
  const nextSteps = summary ? parseJsonList(summary.nextSteps) : []

  return (
    <div className="flex h-full min-h-0 flex-col gap-0">
      {/* Recording / Transcribing Indicator */}
      <div className="flex justify-between items-center pb-3">
        <div>
          {meetingId && (
            <span className="text-xs font-bold text-neutral-500 uppercase">
              Meeting Room ID: #{meetingId}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isTranscribing ? (
            <Badge variant="milestone" className="rounded-md normal-case tracking-normal animate-pulse">
              ⚡ AI is transcribing & summarizing...
            </Badge>
          ) : (
            <Badge variant="streak" className="rounded-md normal-case tracking-normal">
              ● Recording Live
            </Badge>
          )}
        </div>
      </div>

      {/* Main: video grid + AI sidebar */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
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
            {summary && (
              <Badge variant="milestone" className="ml-auto text-[9px] uppercase tracking-normal">
                {summary.modelUsed || 'AI Model'}
              </Badge>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
            
            {/* Upload Recording Section */}
            {meetingId && !summary && (
              <section className="bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-lg p-4 text-center">
                <h3 className="text-xs font-bold uppercase text-neutral-700 mb-2">Cuộc họp đã kết thúc?</h3>
                <p className="text-xs text-neutral-500 mb-3">Tải lên file ghi âm cuộc họp (.mp3/.wav) để AI bắt đầu dịch giọng nói sang văn bản & tóm tắt công việc.</p>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTranscribing}
                >
                  {isTranscribing ? 'Đang phân tích...' : 'Tải lên Audio'}
                </Button>
                {uploadError && <p className="text-[10px] text-red-600 mt-2">{uploadError}</p>}
              </section>
            )}

            {/* AI Summary Content */}
            {summary ? (
              <>
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-700 mb-2">Tóm tắt nội dung</h3>
                  <p className="text-xs text-neutral-800 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    {summary.content}
                  </p>
                </section>

                {keyPoints.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-700 mb-2">Ý chính thảo luận</h3>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-neutral-800">
                      {keyPoints.map((kp, i) => (
                        <li key={i}>{kp}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {decisions.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-success mb-2">Quyết định đã đưa ra</h3>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-neutral-800">
                      {decisions.map((dec, i) => (
                        <li key={i} className="text-green-800">{dec}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {nextSteps.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-700 mb-2">Các bước tiếp theo</h3>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-neutral-800">
                      {nextSteps.map((ns, i) => (
                        <li key={i}>{ns}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {actionItems.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-700 mb-3">Đề xuất công việc (Draft Tasks)</h3>
                    <ul className="space-y-3">
                      {actionItems.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                          <div className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-blue-400 bg-white flex items-center justify-center text-[9px] font-bold text-blue-500">
                            AI
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-900">{t.title}</p>
                            <p className="text-[10px] text-neutral-600 mt-0.5">{t.description}</p>
                            <Badge variant="focus" className="mt-1 text-[8px] px-1 py-0 uppercase">
                              Priority: {t.priority}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            ) : (
              <>
                {/* Fallback Static display for empty/mock page */}
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

                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-700 mb-3">Task suggestions</h3>
                  <p className="text-xs text-neutral-500">Chưa có tóm tắt cuộc họp. Kết thúc cuộc họp và upload file audio để nhận đề xuất task nháp từ AI.</p>
                </section>
              </>
            )}

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
          <Button variant="primary" size="md" className="bg-red-600 hover:bg-red-700 text-white border-none uppercase" onClick={handleEndCall}>
            Kết thúc cuộc họp
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
            ({PARTICIPANTS.length})
          </Button>
        </div>
      </div>
    </div>
  )
}
