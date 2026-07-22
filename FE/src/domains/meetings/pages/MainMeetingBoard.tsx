import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Button, Card, ChatInputBar, Modal } from '../../../components/common'
import { workflowApi } from '../../../api/client'
import { useAuth } from '../../../contexts/AuthContext'
import { useTranslation } from '../../../contexts/LanguageContext'
import { StompClient } from '../../../api/websocket'

type Participant = {
  name: string
  sso: string
  isYou: boolean
}

type TFunc = (key: string, params?: Record<string, string | number>) => string

function getDisplayName(
  u: { fullName?: string | null; username?: string | null; userSso?: string | null } | null | undefined,
  t: TFunc
) {
  if (!u) return t('meetings.unknownUser')
  return u.fullName || u.username || u.userSso || t('meetings.youFallback')
}

/** Google Meet–style grid: fill available space by participant count */
function getGridLayout(count: number): { gridClass: string; tileClass: string } {
  if (count <= 1) {
    return { gridClass: 'grid-cols-1 max-w-4xl', tileClass: 'aspect-video max-h-[70vh]' }
  }
  if (count === 2) {
    return { gridClass: 'grid-cols-1 sm:grid-cols-2 max-w-5xl', tileClass: 'aspect-video' }
  }
  if (count === 3) {
    return { gridClass: 'grid-cols-2 max-w-5xl auto-rows-fr', tileClass: 'aspect-video' }
  }
  if (count === 4) {
    return { gridClass: 'grid-cols-2 max-w-5xl', tileClass: 'aspect-video' }
  }
  if (count <= 6) {
    return { gridClass: 'grid-cols-2 lg:grid-cols-3 max-w-6xl', tileClass: 'aspect-video' }
  }
  return { gridClass: 'grid-cols-3 max-w-6xl', tileClass: 'aspect-video' }
}

function hasLiveVideo(stream?: MediaStream | null): boolean {
  if (!stream) return false
  return stream.getVideoTracks().some((t) => t.readyState === 'live' && t.enabled && !t.muted)
}

export default function MainMeetingBoard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const meetingIdStr = searchParams.get('meetingId')
  const meetingId = meetingIdStr ? parseInt(meetingIdStr) : null

  const { user, refreshProfile } = useAuth()
  const { t } = useTranslation()
  
  const [meetingInfo, setMeetingInfo] = useState({ title: '', description: '' })
  const [summary, setSummary] = useState<any>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [isEnded, setIsEnded] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const isEndedRef = useRef(false)
  const secondsElapsedRef = useRef(0)
  const finalizeLocalSessionRef = useRef<(runAi: boolean) => void>(() => {})

  // WebRTC & Chat States
  const [messages, setMessages] = useState<any[]>([])
  
  const [participants, setParticipants] = useState<Participant[]>(() => {
    return user ? [{ name: getDisplayName(user, t), sso: user.userSso || '', isYou: true }] : []
  })
  const [stompClient, setStompClient] = useState<StompClient | null>(null)
  const [chatInput, setChatInput] = useState('')
  
  const [videoOn, setVideoOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const pcsRef = useRef<{ [userSso: string]: RTCPeerConnection }>({})
  const [remoteStreams, setRemoteStreams] = useState<{ [userSso: string]: MediaStream }>({})
  const [remoteVideoOn, setRemoteVideoOn] = useState<{ [userSso: string]: boolean }>({})

  // Recording State
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const [recordingBlobUrl, setRecordingBlobUrl] = useState<string | null>(null)

  // End Meeting Modal State
  const [showEndModal, setShowEndModal] = useState(false)
  const [expEarned, setExpEarned] = useState(0)

  // Sidebar state
  type ActiveTab = 'chat' | 'note' | null
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat')
  const [noteInput, setNoteInput] = useState('')

  // Refs to avoid stale closures
  const stompClientRef = useRef<StompClient | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const userRef = useRef(user)
  const meetingIdRef = useRef(meetingId)

  useEffect(() => {
    localStreamRef.current = localStream
  }, [localStream])

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    meetingIdRef.current = meetingId
  }, [meetingId])

  useEffect(() => {
    if (!user?.userSso) return
    setParticipants((prev) => {
      const self = { name: getDisplayName(user, t), sso: user.userSso!, isYou: true }
      if (!prev.some((p) => p.isYou)) return [self, ...prev.filter((p) => p.sso !== user.userSso)]
      return prev.map((p) => (p.isYou ? self : p))
    })
  }, [user])

  useEffect(() => {
    isEndedRef.current = isEnded
  }, [isEnded])

  useEffect(() => {
    secondsElapsedRef.current = secondsElapsed
  }, [secondsElapsed])

  // Start Timer — stops when meeting ends
  useEffect(() => {
    if (isEnded) return
    const timer = setInterval(() => setSecondsElapsed((prev) => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [isEnded])

  const canUseAiAnalysis = () => {
    const plan = String(user?.planType || 'FREE').toUpperCase()
    return plan === 'TEAM' || plan === 'TEAMS' || plan === 'COMBO'
  }

  const triggerAutoAnalysis = async () => {
    if (!meetingId) return
    setIsTranscribing(true)
    setUploadError('')

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }

      await new Promise((resolve) => setTimeout(resolve, 500))

      let fileToUpload: File
      if (recordedChunksRef.current.length > 0) {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        fileToUpload = new File([blob], `meeting_${meetingId}_auto_record.webm`, { type: 'audio/webm' })
      } else {
        const dummyBlob = new Blob(['dummy audio content'], { type: 'audio/mp3' })
        fileToUpload = new File([dummyBlob], 'dummy.mp3', { type: 'audio/mp3' })
      }

      const res = await workflowApi.transcribeMeeting(meetingId, fileToUpload)
      if (res.success) {
        let attempts = 0
        const interval = setInterval(async () => {
          attempts++
          const summaryRes = await workflowApi.getMeetingSummary(meetingId)
          if (summaryRes.success && summaryRes.data) {
            setSummary(summaryRes.data)
            setIsTranscribing(false)
            clearInterval(interval)
          } else if (attempts > 15) {
            setIsTranscribing(false)
            setUploadError(t('meetings.aiTimeout'))
            clearInterval(interval)
          }
        }, 3000)
      } else {
        setUploadError(res.message || t('meetings.aiUploadError'))
        setIsTranscribing(false)
      }
    } catch (err) {
      setUploadError(t('meetings.aiConnectionError'))
      setIsTranscribing(false)
    }
  }

  const finalizeLocalSession = (runAi: boolean) => {
    if (isEndedRef.current) return
    isEndedRef.current = true
    setIsEnded(true)
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    Object.keys(pcsRef.current).forEach(closePeerConnection)
    const exp = Math.floor(secondsElapsedRef.current / 60) * 10 + 50
    setExpEarned(exp)
    setShowEndModal(true)
    if (runAi && canUseAiAnalysis()) {
      void triggerAutoAnalysis()
    } else {
      setIsTranscribing(false)
    }
    if (refreshProfile) refreshProfile()
  }
  finalizeLocalSessionRef.current = finalizeLocalSession

  // closePeerConnection is defined below; re-bind after WebRTC helpers for safety
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    if (hrs > 0) return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Load existing summary
  const loadSummaryData = async () => {
    if (!meetingId) return
    try {
      const summaryRes = await workflowApi.getMeetingSummary(meetingId)
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data)
      }
    } catch (err) {
      console.log('No existing summary found or error.')
    }
  }

  useEffect(() => {
    loadSummaryData()
  }, [meetingId])

  // Get User Media once; toggle tracks via enabled (avoids renegotiation / silent mic bugs)
  useEffect(() => {
    let cancelled = false
    let acquired: MediaStream | null = null

    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 30 } },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        acquired = stream
        stream.getAudioTracks().forEach((t) => {
          t.enabled = micOn
        })
        stream.getVideoTracks().forEach((t) => {
          t.enabled = videoOn
        })
        setLocalStream(stream)

        if (!mediaRecorderRef.current) {
          recordedChunksRef.current = []
          try {
            const mimeCandidates = [
              'audio/webm;codecs=opus',
              'audio/webm',
              'video/webm;codecs=vp9,opus',
              'video/webm'
            ]
            const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m))
            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) recordedChunksRef.current.push(e.data)
            }
            recorder.onstop = () => {
              const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'audio/webm' })
              setRecordingBlobUrl(URL.createObjectURL(blob))
            }
            recorder.start(1000)
            mediaRecorderRef.current = recorder
          } catch (err) {
            console.warn('MediaRecorder not supported or failed to start', err)
          }
        }
      })
      .catch((err) => {
        console.warn('Camera/Mic access denied or unavailable:', err)
        setLocalStream(null)
      })

    return () => {
      cancelled = true
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop()
        } catch {
          // ignore
        }
      }
      mediaRecorderRef.current = null
      acquired?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- acquire once on mount
  }, [])

  // Mic / camera toggles — enable tracks without remounting getUserMedia
  useEffect(() => {
    if (!localStream) return
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = micOn
    })
  }, [micOn, localStream])

  useEffect(() => {
    if (!localStream) return
    localStream.getVideoTracks().forEach((t) => {
      t.enabled = videoOn
    })
  }, [videoOn, localStream])

  const upsertParticipant = (sso: string, name: string) => {
    setParticipants((prev) => {
      if (prev.some((p) => p.sso === sso)) {
        return prev.map((p) => (p.sso === sso ? { ...p, name: name || p.name } : p))
      }
      return [...prev, { name: name || sso, sso, isYou: false }]
    })
  }

  const sendSignal = (type: string, payload: Record<string, unknown>) => {
    const mid = meetingIdRef.current
    const me = userRef.current
    if (!mid || !me?.userSso || !stompClientRef.current) return
    stompClientRef.current.send('/app/room.signal', {
      roomId: String(mid),
      fromUser: me.userSso,
      // Always broadcast on room topic; FE filters by payload.toUser.
      // (Outer toUser routes to a private queue the FE does not subscribe to.)
      toUser: '',
      type,
      payload,
      sentAt: new Date().toISOString()
    })
  }

  const createPeerConnection = (targetSso: string) => {
    if (pcsRef.current[targetSso]) return pcsRef.current[targetSso]

    const storedIce = window.localStorage.getItem('webrtc-ice-servers')
    const iceServers = storedIce ? JSON.parse(storedIce) : [{ urls: 'stun:stun.l.google.com:19302' }]

    const pc = new RTCPeerConnection({ iceServers })
    pcsRef.current[targetSso] = pc

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('candidate', { type: 'candidate', toUser: targetSso, data: event.candidate })
      }
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0]
      if (!stream) return
      setRemoteStreams((prev) => ({ ...prev, [targetSso]: stream }))
      if (event.track.kind === 'video') {
        const enabled = event.track.enabled && event.track.readyState === 'live' && !event.track.muted
        setRemoteVideoOn((prev) => ({ ...prev, [targetSso]: enabled }))
        event.track.onmute = () => setRemoteVideoOn((prev) => ({ ...prev, [targetSso]: false }))
        event.track.onunmute = () => setRemoteVideoOn((prev) => ({ ...prev, [targetSso]: true }))
        event.track.onended = () => setRemoteVideoOn((prev) => ({ ...prev, [targetSso]: false }))
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        closePeerConnection(targetSso)
      }
    }

    return pc
  }

  const closePeerConnection = (targetSso: string) => {
    const pc = pcsRef.current[targetSso]
    if (pc) {
      pc.close()
      delete pcsRef.current[targetSso]
    }
    setRemoteStreams((prev) => {
      if (!prev[targetSso]) return prev
      const next = { ...prev }
      delete next[targetSso]
      return next
    })
    setRemoteVideoOn((prev) => {
      if (prev[targetSso] === undefined) return prev
      const next = { ...prev }
      delete next[targetSso]
      return next
    })
  }

  const initiateCall = async (targetSso: string) => {
    try {
      const pc = createPeerConnection(targetSso)
      if (pc.signalingState !== 'stable') return
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      sendSignal('offer', {
        type: 'offer',
        toUser: targetSso,
        targetName: getDisplayName(userRef.current, t),
        data: offer
      })
    } catch (err) {
      console.error('Failed to initiate call to', targetSso, err)
    }
  }

  const handleOffer = async (senderSso: string, offer: RTCSessionDescriptionInit) => {
    try {
      const pc = createPeerConnection(senderSso)
      const me = userRef.current?.userSso
      // Non-initiator is polite and yields on glare; initiator ignores colliding offers
      if (pc.signalingState !== 'stable') {
        if (me && me < senderSso) return
        try {
          await pc.setLocalDescription({ type: 'rollback' } as RTCSessionDescriptionInit)
        } catch {
          // rollback unsupported — fall through and try accepting remote offer
        }
      }
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      sendSignal('answer', { type: 'answer', toUser: senderSso, data: answer })
    } catch (err) {
      console.error('Error handling offer from', senderSso, err)
    }
  }

  const handleAnswer = async (senderSso: string, answer: RTCSessionDescriptionInit) => {
    try {
      const pc = pcsRef.current[senderSso]
      if (!pc) return
      if (pc.signalingState !== 'have-local-offer') return
      await pc.setRemoteDescription(new RTCSessionDescription(answer))
    } catch (err) {
      console.error('Error handling answer from', senderSso, err)
    }
  }

  const handleCandidate = async (senderSso: string, candidate: RTCIceCandidateInit) => {
    try {
      const pc = pcsRef.current[senderSso]
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      console.error('Error handling candidate from', senderSso, err)
    }
  }

  const broadcastCameraState = (enabled: boolean) => {
    sendSignal('camera', { type: 'camera', data: { videoOn: enabled } })
  }

  // WebSocket Connection & Fetch Details
  useEffect(() => {
    if (!meetingId || !user?.userSso) return

    workflowApi.joinMeeting(meetingId).then((res) => {
      if (res.success && res.data) {
        setMeetingInfo({
          title: res.data.title || t('meetings.meetingNumber', { id: meetingId }),
          description: res.data.description || t('meetings.noDescription')
        })
        const role = String(res.data.currentUserRole || '').toUpperCase()
        setIsOwner(role === 'OWNER')
      }
    }).catch(console.error)

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:8881' : window.location.host
    const wsUrl = `${wsProtocol}//${wsHost}/ws`
    const client = new StompClient(wsUrl)
    setStompClient(client)
    stompClientRef.current = client

    client.connect().then(() => {
      // Subscribe BEFORE announcing join so we don't miss offers from existing peers
      client.subscribe(`/topic/rooms/${meetingId}/chat`, (msg) => {
        setMessages((prev) => [
          ...prev,
          {
            user: msg.senderName || msg.senderSso || t('meetings.participant'),
            text: msg.message,
            time: msg.sentAt
              ? new Date(msg.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString('vi-VN'),
            own: msg.senderSso === userRef.current?.userSso,
            ai: false
          }
        ])
      })

      client.subscribe(`/topic/rooms/${meetingId}/signals`, (event) => {
        const sender = event.actor
        const me = userRef.current?.userSso
        if (!me || sender === me) return
        const payload = event.payload
        if (!payload) return

        if (payload.type === 'camera') {
          const enabled = Boolean(payload.data?.videoOn)
          setRemoteVideoOn((prev) => ({ ...prev, [sender]: enabled }))
          return
        }

        if (payload.type === 'leave') {
          setParticipants((prev) => prev.filter((p) => p.sso !== sender))
          closePeerConnection(sender)
          return
        }

        if (payload.type === 'meeting-end') {
          finalizeLocalSessionRef.current(false)
          return
        }

        if (payload.type === 'join') {
          const sName = payload.senderName || sender
          upsertParticipant(sender, sName)
          // Reply with presence so the late joiner discovers us (topic broadcast)
          sendSignal('hello', {
            type: 'hello',
            toUser: sender,
            fromUser: me,
            senderName: getDisplayName(userRef.current, t)
          })
          // Lexicographically smaller SSO initiates to avoid glare
          if (me < sender) {
            void initiateCall(sender)
          }
          return
        }

        if (payload.type === 'hello' && payload.toUser === me) {
          const sName = payload.senderName || payload.fromUser || sender
          upsertParticipant(sender, sName)
          if (me < sender) {
            void initiateCall(sender)
          }
          return
        }

        if (payload.toUser !== me) return

        if (payload.type === 'offer') {
          upsertParticipant(sender, payload.targetName || sender)
          void handleOffer(sender, payload.data)
        } else if (payload.type === 'answer') {
          void handleAnswer(sender, payload.data)
        } else if (payload.type === 'candidate') {
          void handleCandidate(sender, payload.data)
        }
      })

      // Brief delay so SUBSCRIBE frames are registered before peers reply with offers
      setTimeout(() => {
        sendSignal('join', {
          type: 'join',
          fromUser: user.userSso,
          senderName: getDisplayName(user, t)
        })
        broadcastCameraState(videoOn)
      }, 150)
    }).catch((err) => console.error('WebSocket connection error:', err))

    return () => {
      try {
        sendSignal('leave', { type: 'leave', fromUser: user.userSso })
      } catch {
        // ignore
      }
      client.disconnect()
      Object.keys(pcsRef.current).forEach(closePeerConnection)
    }
  }, [meetingId, user?.userSso])

  // Keep peer tracks in sync + renegotiate when stream / participant list changes
  useEffect(() => {
    if (!stompClient || !user?.userSso) return

    participants.forEach((p) => {
      if (p.isYou || p.sso === user.userSso) return

      const existed = !!pcsRef.current[p.sso]
      const pc = createPeerConnection(p.sso)

      if (existed && localStream) {
        const senders = pc.getSenders()
        senders.forEach((sender) => {
          try {
            pc.removeTrack(sender)
          } catch {
            // ignore
          }
        })
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream))
      }

      const isInitiator = user.userSso! < p.sso
      if (existed || isInitiator) {
        void initiateCall(p.sso)
      }
    })
  }, [participants, stompClient, user?.userSso, localStream])

  useEffect(() => {
    if (!stompClient) return
    broadcastCameraState(videoOn)
  }, [videoOn, stompClient])

  // Keep finalize callback pointing at latest helpers (closePeerConnection, etc.)
  finalizeLocalSessionRef.current = finalizeLocalSession

  const handleLeaveMeeting = () => {
    if (isEndedRef.current) return
    sendSignal('leave', { type: 'leave', fromUser: user?.userSso })
    try {
      stompClientRef.current?.disconnect()
    } catch {
      // ignore
    }
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    Object.keys(pcsRef.current).forEach(closePeerConnection)
    isEndedRef.current = true
    setIsEnded(true)
    navigate('/meetings')
  }

  const handleEndCallClick = async () => {
    if (!isOwner) {
      handleLeaveMeeting()
      return
    }
    sendSignal('meeting-end', { type: 'meeting-end' })
    if (meetingId) {
      try {
        await workflowApi.endMeeting(meetingId)
      } catch (e) {
        console.error(e)
      }
    }
    finalizeLocalSession(true)
  }

  const parseJsonList = (str: any): string[] => {
    if (!str) return []
    if (Array.isArray(str)) return str
    try { return JSON.parse(str) } catch { return [str] }
  }

  const parseJsonTasks = (str: any): any[] => {
    if (!str) return []
    if (Array.isArray(str)) return str
    try { return JSON.parse(str) } catch { return [] }
  }

  const keyPoints = summary ? parseJsonList(summary.keyPoints) : []
  const actionItems = summary ? parseJsonTasks(summary.actionItems) : []

  return (
    <div className="flex h-full min-h-0 flex-col gap-0 p-3 bg-[var(--color-background)] relative">
      <div className="flex flex-col gap-1 pb-3 px-4 bg-[var(--color-surface)] rounded-t-xl mt-0 pt-4 border-b-2 border-[var(--color-border)] shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-extrabold text-neutral-900 tracking-tight">
              {meetingInfo.title || (meetingId ? t('meetings.meetingNumber', { id: meetingId }) : t('common.loading'))}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1 max-w-2xl">{meetingInfo.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="streak" className="rounded-md normal-case bg-red-100 text-red-600 border border-red-300">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse mr-1.5 inline-block"></span>
              {t('meetings.recordingLive')} - {formatTime(secondsElapsed)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0 gap-3 mt-3 relative">
        {/* Left Area: Video Grid (Meet-style scaling) */}
        <div className="flex-1 flex flex-col min-h-[40vh] md:min-h-0">
          <div className="flex-1 min-h-0 overflow-auto border-2 border-neutral-300 rounded-xl bg-white p-4 shadow-md flex items-center justify-center">
            {/* Hidden audio elements so remote mic is heard even when camera is off */}
            {Object.entries(remoteStreams).map(([sso, stream]) => (
              <audio
                key={`audio-${sso}`}
                autoPlay
                playsInline
                ref={(el) => {
                  if (!el) return
                  if (el.srcObject !== stream) {
                    el.srcObject = stream
                    el.play().catch(() => {})
                  }
                }}
                className="hidden"
              />
            ))}
            {(() => {
              const visible = participants.slice(0, 9)
              const { gridClass, tileClass } = getGridLayout(visible.length)
              return (
                <div className={`grid gap-3 w-full ${gridClass}`}>
                  {visible.map((p, i) => {
                    const showLocalVideo = p.isYou && videoOn && hasLiveVideo(localStream)
                    const showRemoteVideo = !p.isYou
                      && remoteVideoOn[p.sso] !== false
                      && hasLiveVideo(remoteStreams[p.sso])
                    const label = `${p.name}${p.isYou ? ` (${t('common.you')})` : ''}`
                    const initial = (p.name || 'U').charAt(0).toUpperCase()

                    return (
                      <div
                        key={p.sso || i}
                        className={`${tileClass} rounded-xl border-2 overflow-hidden relative bg-neutral-900 shadow-md ${
                          p.isYou ? 'border-primary' : 'border-neutral-300'
                        } ${visible.length === 3 && i === 2 ? 'col-span-2 sm:col-span-1 sm:col-start-1 sm:col-end-3 justify-self-center w-full max-w-[50%]' : ''}`}
                      >
                        {showLocalVideo ? (
                          <video
                            ref={(el) => {
                              if (el && el.srcObject !== localStream) el.srcObject = localStream
                            }}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                        ) : showRemoteVideo ? (
                          <video
                            ref={(el) => {
                              if (!el) return
                              if (el.srcObject !== remoteStreams[p.sso]) {
                                el.srcObject = remoteStreams[p.sso]
                                el.play().catch(() => {})
                              }
                            }}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 text-xl font-bold text-white shadow-inner">
                              {initial}
                            </div>
                            <span className="text-[10px] font-bold uppercase text-neutral-400">{t('meetings.cameraOffLabel')}</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                          {label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Right Sidebar: Chat & Notes — full-width sheet on mobile */}
        {activeTab && (
          <aside className="fixed inset-x-2 bottom-2 top-28 z-40 flex flex-col gap-3 min-h-0 md:static md:inset-auto md:z-auto md:w-[340px] md:shrink-0 transition-all">
            <button
              type="button"
              className="md:hidden absolute inset-0 -z-10 bg-black/40 rounded-xl"
              aria-label={t('meetings.closePanel')}
              onClick={() => setActiveTab(null)}
            />
            <div className="flex-1 flex flex-col bg-white rounded-xl border-2 border-neutral-300 overflow-hidden shadow-md min-h-0">
               <div className="p-3 border-b-2 border-neutral-200 bg-neutral-50 flex justify-between items-center flex-shrink-0">
                 <h3 className="text-xs font-bold uppercase text-neutral-800">
                   {activeTab === 'chat' ? t('meetings.liveChat') : t('meetings.quickNote')}
                 </h3>
                 <button onClick={() => setActiveTab(null)} className="text-neutral-500 hover:text-neutral-800 font-bold">✖</button>
               </div>
               
               {activeTab === 'chat' ? (
                 <>
                   <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
                      {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.own ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-xl p-2.5 text-xs shadow-sm ${m.own ? 'bg-neutral-900 text-white' : 'bg-neutral-100 border border-neutral-200 text-neutral-900'}`}>
                            {!m.own && <div className="font-bold text-[9px] text-neutral-500 mb-1 tracking-wide">{m.user}</div>}
                            <span className="leading-relaxed">{m.text}</span>
                          </div>
                        </div>
                      ))}
                   </div>
                   <div className="p-3 border-t-2 border-neutral-200 bg-neutral-50 flex-shrink-0">
                     <ChatInputBar 
                       value={chatInput} 
                       onChange={(e) => setChatInput(e.target.value)}
                       onSend={() => {
                         if (!chatInput.trim() || !stompClient || !meetingId) return
                         stompClient.send('/app/room.chat', {
                           roomId: String(meetingId),
                           senderSso: user?.userSso || t('meetings.participant'),
                           senderName: getDisplayName(user, t),
                           message: chatInput.trim(),
                           sentAt: new Date().toISOString()
                         })
                         setChatInput('')
                       }}
                       onFileChange={() => {}}
                       placeholder={t('meetings.chatPlaceholder')} 
                     />
                   </div>
                 </>
               ) : (
                 <>
                   <div className="flex-1 overflow-y-auto p-3 bg-white flex flex-col">
                     <textarea 
                       className="flex-1 w-full p-2 text-sm border-2 border-neutral-200 rounded-lg resize-none focus:outline-none focus:border-neutral-400"
                       placeholder={t('meetings.notePlaceholder')}
                       value={noteInput}
                       onChange={e => setNoteInput(e.target.value)}
                     />
                   </div>
                   <div className="p-3 border-t-2 border-neutral-200 bg-neutral-50 flex-shrink-0">
                     <Button variant="primary" className="w-full justify-center text-sm font-bold" onClick={() => {
                        if (!noteInput.trim()) return
                        workflowApi.addMeetingNote(Number(meetingId), noteInput, false)
                        setNoteInput('')
                     }}>
                       {t('meetings.saveNote')}
                     </Button>
                   </div>
                 </>
               )}
            </div>
          </aside>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-2 border-neutral-300 bg-white px-5 py-4 mt-3 rounded-xl shadow-md">
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            size="md" 
            className={`font-bold transition-colors ${micOn ? 'hover:bg-neutral-100' : '!bg-red-50 !text-red-700 !border-red-300 hover:!bg-red-100'}`} 
            onClick={() => setMicOn(!micOn)}
          >
            {micOn ? t('meetings.micOn') : t('meetings.micOff')}
          </Button>
          <Button 
            variant="secondary" 
            size="md" 
            className={`font-bold transition-colors ${videoOn ? 'hover:bg-neutral-100' : '!bg-red-50 !text-red-700 !border-red-300 hover:!bg-red-100'}`} 
            onClick={() => setVideoOn(!videoOn)}
          >
            {videoOn ? t('meetings.cameraOn') : t('meetings.cameraOff')}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            size="md" 
            className={`font-bold transition-colors ${activeTab === 'chat' ? '!bg-neutral-900 !text-white hover:!bg-neutral-800' : ''}`} 
            onClick={() => setActiveTab(activeTab === 'chat' ? null : 'chat')}
          >
            {t('meetings.chat')}
          </Button>
          <Button 
            variant="secondary" 
            size="md" 
            className={`font-bold transition-colors ${activeTab === 'note' ? '!bg-neutral-900 !text-white hover:!bg-neutral-800' : ''}`} 
            onClick={() => setActiveTab(activeTab === 'note' ? null : 'note')}
          >
            {t('meetings.quickNote')}
          </Button>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isOwner ? (
            <Button variant="primary" size="md" className="!bg-error hover:!bg-red-700 text-white !border-error uppercase font-bold tracking-wide shadow-sm px-8" onClick={handleEndCallClick}>
              {t('meetings.endMeeting')}
            </Button>
          ) : (
            <Button variant="secondary" size="md" className="uppercase font-bold tracking-wide shadow-sm px-8" onClick={handleLeaveMeeting}>
              {t('meetings.leaveMeeting')}
            </Button>
          )}
        </div>
      </div>

      {/* End Meeting Modal */}
      <Modal 
        open={showEndModal} 
        onClose={() => {}} // Disabled outside click
        size={canUseAiAnalysis() ? 'max-w-4xl' : 'max-w-lg'}
        title={t('meetings.finished')}
      >
        <div className={`flex flex-col gap-6 p-4 ${canUseAiAnalysis() ? 'md:flex-row' : ''}`}>
          
          {/* Left Column: Stats & Actions */}
          <div className={`flex flex-col gap-4 ${canUseAiAnalysis() ? 'w-full md:w-1/3' : 'w-full'}`}>
            <Card className="bg-neutral-50 p-5 text-center border border-neutral-200 shadow-inner">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">{t('meetings.totalDuration')}</h3>
              <p className="text-3xl font-extrabold text-neutral-900">{formatTime(secondsElapsed)}</p>
            </Card>

            <Card className="bg-emerald-50 p-5 text-center border border-emerald-200">
              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">{t('meetings.expEarned')}</h3>
              <p className="text-3xl font-extrabold text-emerald-700">+{expEarned}</p>
            </Card>

            {canUseAiAnalysis() && (
              <div className="mt-2 space-y-3">
                {recordingBlobUrl ? (
                  <a href={recordingBlobUrl} download={`meeting_${meetingId}_record.webm`} className="block w-full">
                    <Button variant="secondary" className="w-full justify-center !bg-blue-50 !text-blue-700 !border-blue-200 hover:!bg-blue-100">
                      {t('meetings.downloadRecording')}
                    </Button>
                  </a>
                ) : (
                   <Button variant="secondary" className="w-full justify-center" disabled>
                     {t('meetings.generatingRecord')}
                   </Button>
                )}
              </div>
            )}
            
            <div className="mt-auto pt-6 border-t border-neutral-200">
              <Button variant="primary" className="w-full justify-center" onClick={() => navigate('/meetings')}>
                {t('meetings.return')}
              </Button>
            </div>
          </div>

          {/* Right Column: AI Analysis — TEAM / COMBO only */}
          {canUseAiAnalysis() ? (
          <div className="w-full md:w-2/3 flex flex-col gap-4 bg-white border border-neutral-200 rounded-xl p-5 shadow-sm min-h-[400px]">
             <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
               <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                 {t('meetings.aiAnalysis')}
               </h2>
               {isTranscribing && (
                 <Badge variant="milestone" className="animate-pulse">{t('meetings.processingAudio')}</Badge>
               )}
             </div>

             <div className="flex-1 overflow-y-auto pr-2">
               {uploadError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{uploadError}</p>}
               
               {!summary && isTranscribing && (
                 <div className="flex flex-col items-center justify-center h-full text-neutral-500 py-10">
                    <div className="w-12 h-12 border-4 border-neutral-200 border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-medium">{t('meetings.analyzing')}</p>
                 </div>
               )}

               {summary && (
                 <div className="space-y-6 animate-fade-in pb-4">
                    <section>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2">{t('meetings.executiveSummary')}</h3>
                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <p className="text-sm leading-relaxed text-neutral-800">{summary.content}</p>
                      </div>
                    </section>
                    
                    {keyPoints.length > 0 && (
                      <section>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2">{t('meetings.keyPoints')}</h3>
                        <ul className="space-y-2 text-sm text-neutral-800 bg-white border border-neutral-100 rounded-xl p-4 shadow-sm">
                          {keyPoints.map((kp, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{kp}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {actionItems.length > 0 && (
                      <section>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">{t('meetings.actionItems')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {actionItems.map((t, i) => (
                            <div key={i} className="flex flex-col text-sm border border-neutral-200 bg-white p-3 rounded-xl shadow-sm hover:border-primary/50 transition-colors cursor-default">
                              <span className="font-bold text-neutral-900 line-clamp-2">{t.title}</span>
                              {t.description && <span className="text-[11px] text-neutral-500 mt-1 line-clamp-2">{t.description}</span>}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                 </div>
               )}
             </div>
          </div>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}
