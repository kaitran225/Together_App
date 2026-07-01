import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, Input } from '../../../components/common'
import { workflowApi } from '../../../api/client'

export default function MeetingLobby() {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [meetingTitle, setMeetingTitle] = useState('')
  const [agenda, setAgenda] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    workflowApi.getMyTeams()
      .then((res) => {
        if (res.success && res.data) {
          setTeams(res.data)
          if (res.data.length > 0) {
            setSelectedTeamId(res.data[0].teamId.toString())
          }
        }
      })
      .catch((err) => console.error('Error fetching teams:', err))
  }, [])

  useEffect(() => {
    if (!selectedTeamId) return
    workflowApi.getProjects(selectedTeamId)
      .then((res) => {
        if (res.success && res.data) {
          setProjects(res.data)
          if (res.data.length > 0) {
            setSelectedProjectId(res.data[0].projectId.toString())
          } else {
            setSelectedProjectId('')
          }
        }
      })
      .catch((err) => console.error('Error fetching projects:', err))
  }, [selectedTeamId])

  const handleStartNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeamId) {
      setError('Vui lòng chọn một nhóm để bắt đầu cuộc họp.')
      return
    }
    if (!meetingTitle.trim()) {
      setError('Vui lòng nhập tiêu đề cuộc họp.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const projId = selectedProjectId ? parseInt(selectedProjectId) : undefined
      const res = await workflowApi.createMeeting(
        parseInt(selectedTeamId),
        meetingTitle.trim(),
        projId,
        agenda.trim() || undefined
      )
      if (res.success && res.data) {
        // Tham gia cuộc họp vừa tạo
        await workflowApi.joinMeeting(res.data.meetingId)
        navigate(`/meetings/room?meetingId=${res.data.meetingId}`)
      } else {
        setError(res.message || 'Không thể tạo cuộc họp.')
      }
    } catch (err: any) {
      console.error(err)
      setError('Lỗi kết nối máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCode.trim()) return
    const id = parseInt(roomCode.trim())
    if (isNaN(id)) {
      setError('Mã cuộc họp phải là số ID.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await workflowApi.joinMeeting(id)
      if (res.success) {
        navigate(`/meetings/room?meetingId=${id}`)
      } else {
        setError(res.message || 'Mã cuộc họp không hợp lệ hoặc không tồn tại.')
      }
    } catch (err: any) {
      console.error(err)
      setError('Lỗi kết nối máy chủ khi tham gia cuộc họp.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-4 md:py-8 space-y-6">
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-6 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Badge variant="focus" className="mb-2 normal-case tracking-normal">Collaborative study calls</Badge>
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight uppercase tracking-[0.06em]">Meetings</h1>
            <p className="text-sm md:text-base text-neutral-500 mt-2">
              Chạy các buổi họp hiệu quả cùng nhóm, chia sẻ tiến độ và tóm tắt cuộc họp bằng AI.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-3 text-center">
            <Card className="p-3 md:p-4">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">Active now</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-primary">12</p>
            </Card>
            <Card className="p-3 md:p-4">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">Study teams</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-success">{teams.length || 24}</p>
            </Card>
            <Card className="p-3 md:p-4">
              <p className="text-[10px] uppercase tracking-wide text-neutral-500">Daily goal</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-highlight">2h</p>
            </Card>
          </div>
        </div>
      </section>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 md:gap-5">
        <Card className="p-5 md:p-6 space-y-6">
          <section>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-900 mb-2">Tạo cuộc họp mới</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-4">Khởi tạo một phòng họp cho nhóm của bạn và kết nối tức thì.</p>
            
            <form onSubmit={handleStartNew} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5">Chọn nhóm học tập</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border-2 border-neutral-200 text-sm focus:border-neutral-900 bg-white"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn nhóm --</option>
                    {teams.map((t) => (
                      <option key={t.teamId} value={t.teamId}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5">Chọn dự án (Tùy chọn)</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border-2 border-neutral-200 text-sm focus:border-neutral-900 bg-white"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    <option value="">-- Không liên kết dự án --</option>
                    {projects.map((p) => (
                      <option key={p.projectId} value={p.projectId}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5">Tiêu đề cuộc họp</label>
                <Input
                  type="text"
                  placeholder="Ví dụ: Họp Sprint 1 - Thảo luận công nghệ"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5">Chương trình họp / Agenda</label>
                <Input
                  type="text"
                  placeholder="Ví dụ: 1. Xem lại tiến trình; 2. Phân chia task; 3. Chốt deadline"
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                />
              </div>

              <Button type="submit" variant="primary" className="w-full md:w-auto px-6" disabled={loading}>
                {loading ? 'Đang tạo...' : 'Bắt đầu cuộc họp'}
              </Button>
            </form>
          </section>

          <hr className="border-neutral-200 dark:border-[var(--color-charcoal)]" />

          <section>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-900 mb-2">Tham gia bằng mã ID cuộc họp</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-500 mb-4">Nhập mã ID được chia sẻ bởi người tổ chức để tham gia nhanh.</p>
            <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder="Nhập ID cuộc họp (ví dụ: 1)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="flex-1 min-w-0"
              />
              <Button type="submit" variant="secondary" className="sm:w-auto px-5" disabled={loading}>
                Tham gia
              </Button>
            </form>
          </section>
        </Card>

        <Card className="p-5 md:p-6">
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-900 mb-3">Mẹo nhỏ khi họp</h3>
          <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-500">
            <li className="flex items-start gap-2">
              <Badge variant="milestone" className="mt-0.5">1</Badge>
              Chia sẻ Agenda rõ ràng trước buổi họp để đạt hiệu quả cao.
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="streak" className="mt-0.5">2</Badge>
              Giữ buổi họp ngắn gọn (dưới 30 phút) giúp tăng sự tập trung.
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="focus" className="mt-0.5">3</Badge>
              Sau khi kết thúc họp, sử dụng chức năng AI Transcription để lấy biên bản tóm tắt tự động.
            </li>
          </ul>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-5">
            Together AI sẽ tự động phân tích và đề xuất các Task nháp trực tiếp vào bảng Kanban của dự án liên kết.
          </p>
        </Card>
      </div>
    </div>
  )
}
