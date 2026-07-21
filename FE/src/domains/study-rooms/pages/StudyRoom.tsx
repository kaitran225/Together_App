import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AiBotIcon, Button, Card, ChatInputBar, IconButton, Modal } from '../../../components/common'
import { authApi, readApi, workflowApi } from '../../../api/client'
import { useAuth } from '../../../contexts/AuthContext'
import { StompClient } from '../../../api/websocket'

type Participant = {
  userSso: string
  displayName: string
  isYou: boolean
  videoOn?: boolean
}

function getDisplayName(user: { fullName?: string | null; email?: string | null; userSso?: string | null } | null | undefined, fallbackSso?: string) {
  if (!user && fallbackSso) return fallbackSso
  return user?.fullName || user?.email?.split('@')[0] || user?.userSso || fallbackSso || 'User'
}

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

export default function StudyRoom() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const roomId = searchParams.get('roomId')

  const { user, refreshProfile } = useAuth()
  const [messages, setMessages] = useState<any[]>([])
  const [participants, setParticipants] = useState<Participant[]>(() => {
    return user
      ? [{ userSso: user.userSso || '', displayName: getDisplayName(user), isYou: true, videoOn: true }]
      : []
  })
  const [stompClient, setStompClient] = useState<StompClient | null>(null)
  const [isHost, setIsHost] = useState(false)

  const [showEndModal, setShowEndModal] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [videoOn, setVideoOn] = useState(true)

  const [roomTitle, setRoomTitle] = useState('Study Room')
  const [iceServers, setIceServers] = useState<any[]>([])
  const [secondsStudied, setSecondsStudied] = useState(0)

  const [sessionId, setSessionId] = useState<number | null>(null)
  const [isEnded, setIsEnded] = useState(false)
  const [expEarned, setExpEarned] = useState(0)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const pcsRef = useRef<{ [userSso: string]: RTCPeerConnection }>({})
  const [remoteStreams, setRemoteStreams] = useState<{ [userSso: string]: MediaStream }>({})
  const [remoteVideoOn, setRemoteVideoOn] = useState<{ [userSso: string]: boolean }>({})
  const userNameCacheRef = useRef<Record<string, string>>({})

  // Kept in sync with the corresponding state so the WS signal subscription
  // (which is only ever bound once, see the [roomId, user?.userSso] effect
  // below) always reads the latest values instead of a stale mount-time closure.
  const stompClientRef = useRef<StompClient | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const iceServersRef = useRef<any[]>([])
  const videoOnRef = useRef(videoOn)
  const isEndedRef = useRef(false)

  useEffect(() => { stompClientRef.current = stompClient }, [stompClient])
  useEffect(() => { localStreamRef.current = localStream }, [localStream])
  useEffect(() => { iceServersRef.current = iceServers }, [iceServers])
  useEffect(() => { videoOnRef.current = videoOn }, [videoOn])
  useEffect(() => { isEndedRef.current = isEnded }, [isEnded])

  useEffect(() => {
    if (isEnded || showEndModal) return
    const timer = setInterval(() => {
      setSecondsStudied((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isEnded, showEndModal])

  useEffect(() => {
    if (!roomId) return

    workflowApi.startSession(Number(roomId), 'SOCIAL')
      .then((res) => {
        if (res.success && res.data) {
          setSessionId(res.data.sessionId)
        }
      })
      .catch((err) => console.error('Failed to start study session:', err))
  }, [roomId])

  useEffect(() => {
    if (videoOn) {
      navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 360 },
          frameRate: { ideal: 30 }
        },
        audio: false
      })
        .then((stream) => {
          setLocalStream(stream)
        })
        .catch((err) => {
          console.warn('Camera access denied or unavailable:', err)
          setLocalStream(null)
          setVideoOn(false)
        })
    } else {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
        setLocalStream(null)
      }
    }
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [videoOn])

  // Broadcast camera state so remotes can clear the last frozen frame
  useEffect(() => {
    if (!stompClient || !roomId || !user?.userSso) return
    stompClient.send('/app/room.signal', {
      roomId: String(roomId),
      fromUser: user.userSso,
      toUser: '',
      type: 'camera',
      payload: {
        type: 'camera',
        toUser: '',
        data: { videoOn }
      },
      sentAt: new Date().toISOString()
    })
  }, [videoOn, stompClient, roomId, user?.userSso])

  const setRemoteVideoState = (targetSso: string, enabled: boolean) => {
    setRemoteVideoOn((prev) => {
      if (prev[targetSso] === enabled) return prev
      return { ...prev, [targetSso]: enabled }
    })
  }

  const bindTrackVideoState = (targetSso: string, track: MediaStreamTrack) => {
    const sync = () => {
      setRemoteVideoState(targetSso, track.readyState === 'live' && track.enabled && !track.muted)
    }
    sync()
    track.onmute = sync
    track.onunmute = sync
    track.onended = () => setRemoteVideoState(targetSso, false)
  }

  const createPeerConnection = (targetSso: string) => {
    if (pcsRef.current[targetSso]) {
      return pcsRef.current[targetSso]
    }

    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current.length > 0 ? iceServersRef.current : [{ urls: 'stun:stun.l.google.com:19302' }]
    })
    pcsRef.current[targetSso] = pc

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && stompClientRef.current) {
        stompClientRef.current.send('/app/room.signal', {
          roomId: String(roomId),
          fromUser: user?.userSso,
          toUser: '',
          type: 'candidate',
          payload: {
            type: 'candidate',
            toUser: targetSso,
            data: event.candidate
          },
          sentAt: new Date().toISOString()
        })
      }
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0]
      if (stream) {
        setRemoteStreams((prev) => ({
          ...prev,
          [targetSso]: stream
        }))
        if (event.track.kind === 'video') {
          bindTrackVideoState(targetSso, event.track)
        }
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
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
      const next = { ...prev }
      delete next[targetSso]
      return next
    })
    setRemoteVideoOn((prev) => {
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

      stompClientRef.current?.send('/app/room.signal', {
        roomId: String(roomId),
        fromUser: user?.userSso,
        toUser: "",
        type: 'offer',
        payload: {
          type: 'offer',
          toUser: targetSso,
          data: offer
        },
        sentAt: new Date().toISOString()
      })
    } catch (err) {
      console.error('Failed to initiate call to', targetSso, err)
    }
  }

  const handleOffer = async (senderSso: string, offer: RTCSessionDescriptionInit) => {
    try {
      const pc = createPeerConnection(senderSso)
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      stompClientRef.current?.send('/app/room.signal', {
        roomId: String(roomId),
        fromUser: user?.userSso,
        toUser: "",
        type: 'answer',
        payload: {
          type: 'answer',
          toUser: senderSso,
          data: answer
        },
        sentAt: new Date().toISOString()
      })
    } catch (err) {
      console.error('Error handling offer from', senderSso, err)
    }
  }

  const handleAnswer = async (senderSso: string, answer: RTCSessionDescriptionInit) => {
    try {
      const pc = pcsRef.current[senderSso]
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
      }
    } catch (err) {
      console.error('Error handling answer from', senderSso, err)
    }
  }

  const handleCandidate = async (senderSso: string, candidate: RTCIceCandidateInit) => {
    try {
      const pc = pcsRef.current[senderSso]
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      }
    } catch (err) {
      console.error('Error handling candidate from', senderSso, err)
    }
  }

  const formatSeconds = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':')
  }

  const formatMins = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    if (hrs > 0) {
      return `${hrs}h ${mins}m`
    }
    return `${mins}m ${totalSeconds % 60}s`
  }

  useEffect(() => {
    if (!roomId) return

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:8881' : window.location.host
    const wsUrl = `${wsProtocol}//${wsHost}/ws`
    const client = new StompClient(wsUrl)
    setStompClient(client)

    client.connect()
      .then(() => {
        // Skip re-join if session already ended (avoids clearing leftAt after leave)
        if (isEndedRef.current) return

        // Ensure user is marked as active in the database on connection/reconnection
        workflowApi.joinRoom(roomId)
          .then((res) => {
            if (res.success) {
              console.log('Joined/Re-joined room in backend successfully on WS connection.')
            }
          })
          .catch((err) => console.error('Failed to join room in backend on WS connection:', err))

        client.subscribe(`/topic/rooms/${roomId}/chat`, (msg) => {
          const senderSso = msg.senderSso || 'Participant'
          const senderName = userNameCacheRef.current[senderSso]
            || (senderSso === user?.userSso ? getDisplayName(user) : senderSso)
          setMessages((prev) => [
            ...prev,
            {
              user: senderName,
              text: msg.message,
              time: msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              own: msg.senderSso === user?.userSso,
              ai: false
            }
          ])
        })

        client.subscribe(`/topic/rooms/${roomId}/signals`, (event) => {
          const sender = event.actor
          if (sender === user?.userSso) return

          const payload = event.payload
          if (!payload) return

          const { type, data } = payload

          // Camera state is broadcast to everyone (toUser may be empty)
          if (type === 'camera') {
            const enabled = Boolean(data?.videoOn)
            setRemoteVideoState(sender, enabled)
            if (!enabled) {
              setRemoteStreams((prev) => {
                if (!prev[sender]) return prev
                const next = { ...prev }
                delete next[sender]
                return next
              })
            }
            return
          }

          if (payload.toUser !== user?.userSso) return

          if (type === 'offer') {
            handleOffer(sender, data)
          } else if (type === 'answer') {
            handleAnswer(sender, data)
          } else if (type === 'candidate') {
            handleCandidate(sender, data)
          }
        })
      })
      .catch((err) => console.error('WebSocket connection error:', err))

    return () => {
      client.disconnect()
    }
  }, [roomId, user?.userSso])

  useEffect(() => {
    if (!stompClient || !user?.userSso) return

    // Clean up connections for participants who left
    const activeSsoList = participants.map((p) => p.userSso)
    Object.keys(pcsRef.current).forEach((sso) => {
      if (!activeSsoList.includes(sso)) {
        closePeerConnection(sso)
      }
    })

    // Sync tracks and initiate calls to active participants
    participants.forEach((p) => {
      if (p.isYou || p.userSso === user.userSso) return

      const pcExisted = !!pcsRef.current[p.userSso]
      const pc = createPeerConnection(p.userSso)

      // Only manually update tracks if the pc already existed (since createPeerConnection already adds them on creation)
      if (pcExisted) {
        const senders = pc.getSenders()
        senders.forEach((sender) => {
          try {
            pc.removeTrack(sender)
          } catch (e) {
            console.warn('Failed to remove track:', e)
          }
        })

        if (localStream) {
          localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream)
          })
        }
      }

      // Trigger renegotiation:
      // - If connection already existed (renegotiation on camera toggle/stream change) -> trigger for either side
      // - If it's a new connection -> only the lexicographical initiator starts the call to prevent handshake glare
      const isInitiator = user.userSso < p.userSso
      if (pcExisted || isInitiator) {
        initiateCall(p.userSso)
      }
    })
  }, [participants, stompClient, user?.userSso, localStream])

  useEffect(() => {
    if (!roomId) return
    if (isEndedRef.current) return

    workflowApi.joinRoom(roomId)
      .then((res) => {
        if (res.success) {
          console.log('Joined room in backend successfully.')
        }
      })
      .catch((err) => console.error('Failed to join room in backend:', err))

    const handleBeforeUnload = () => {
      isEndedRef.current = true
      const token = window.localStorage.getItem('access_token')
      if (token) {
        fetch(`/api/v1/workflow/rooms/${roomId}/leave`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          keepalive: true
        }).catch(console.error)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    const forceExitToStudyRooms = () => {
      if (isEndedRef.current) return
      isEndedRef.current = true
      try {
        stompClientRef.current?.disconnect()
      } catch {
        // ignore
      }
      setStompClient(null)
      Object.keys(pcsRef.current).forEach((sso) => {
        try {
          pcsRef.current[sso]?.close()
        } catch {
          // ignore
        }
        delete pcsRef.current[sso]
      })
      navigate('/study-rooms', { replace: true })
    }

    const fetchDetail = async () => {
      if (isEndedRef.current) return
      try {
        const res = await readApi.getRoomDetail(roomId)
        if (!res.success || !res.data) return

        const status = String(res.data.status || '').toUpperCase()
        if (status === 'EXPIRED') {
          forceExitToStudyRooms()
          return
        }

        setRoomTitle(res.data.title || 'Study Room')
        if (!res.data.members) return

        const activeMembers = res.data.members.filter((m: any) => m.isActive)
        const myMembership = res.data.members.find((m: any) => m.userSso === user?.userSso)
        setIsHost(Boolean(myMembership?.isActive && String(myMembership?.role).toUpperCase() === 'HOST'))

        const ssoList: string[] = activeMembers.map((m: any) => m.userSso).filter(Boolean)
        const missing = ssoList.filter((sso) => !userNameCacheRef.current[sso])

        if (missing.length > 0) {
          try {
            const lookupRes = await authApi.lookupUsers(missing)
            if (lookupRes.success && lookupRes.data) {
              lookupRes.data.forEach((u: any) => {
                userNameCacheRef.current[u.userSso] = getDisplayName(u, u.userSso)
              })
            }
          } catch (err) {
            console.warn('User lookup failed, falling back to userSso', err)
          }
          // Ensure self is cached with profile name
          if (user?.userSso) {
            userNameCacheRef.current[user.userSso] = getDisplayName(user)
          }
          // Fill gaps with sso itself
          missing.forEach((sso) => {
            if (!userNameCacheRef.current[sso]) {
              userNameCacheRef.current[sso] = sso
            }
          })
        }

        const mapped: Participant[] = activeMembers.map((m: any) => ({
          userSso: m.userSso,
          displayName: userNameCacheRef.current[m.userSso]
            || (m.userSso === user?.userSso ? getDisplayName(user) : m.userSso),
          isYou: m.userSso === user?.userSso,
          videoOn: m.userSso === user?.userSso ? videoOnRef.current : remoteVideoOn[m.userSso]
        }))

        // Do not fake-inject self when empty — that keeps a ghost tile after leave
        setParticipants(mapped)
      } catch (err) {
        console.error('Failed to fetch room detail:', err)
      }
    }

    fetchDetail()
    const interval = setInterval(fetchDetail, 5000)

    workflowApi.getWebRtcConfig(roomId)
      .then((res) => {
        if (res.success && res.data) {
          if (Array.isArray(res.data.iceServers)) {
            setIceServers(res.data.iceServers)
            window.localStorage.setItem('webrtc-ice-servers', JSON.stringify(res.data.iceServers))
          }
          if (res.data.enableVideo !== undefined) setVideoOn(res.data.enableVideo)
        }
      })
      .catch((err) => console.error('Failed to fetch WebRTC config:', err))

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Attempt to leave room when component unmounts (skip if already left via End/Leave)
      if (!isEndedRef.current) {
        workflowApi.leaveRoom(roomId).catch(console.error)
      }
    }
  }, [roomId, user?.userSso])

  const handleLeaveRoom = async () => {
    isEndedRef.current = true

    // Leave via HTTP first (reliable). Disconnect WS after so reconnect cannot re-join.
    if (roomId) {
      try {
        const leaveRes = await workflowApi.leaveRoom(roomId)
        if (!leaveRes.success) {
          console.error('Leave room failed:', leaveRes)
          isEndedRef.current = false
          return
        }
      } catch (err) {
        console.error('Error leaving room:', err)
        isEndedRef.current = false
        return
      }
    }

    try {
      stompClient?.disconnect()
    } catch (err) {
      console.warn('Error disconnecting websocket on leave:', err)
    }
    setStompClient(null)

    if (sessionId) {
      try {
        const res = await workflowApi.endSession(sessionId)
        if (res.success && res.data) {
          setExpEarned(res.data.expEarned || 0)
        }
      } catch (err) {
        console.error('Error ending study session:', err)
      }
    }
    try {
      await refreshProfile()
    } catch (err) {
      console.error(err)
    }
    setIsEnded(true)
  }

  const handleEndRoomAsHost = async () => {
    if (!isHost || !roomId) {
      await handleLeaveRoom()
      return
    }
    isEndedRef.current = true
    try {
      const closeRes = await workflowApi.closeRoom(Number(roomId))
      if (!closeRes.success) {
        console.error('Close room failed:', closeRes)
        // Fallback to personal leave if close is denied
        await handleLeaveRoom()
        return
      }
    } catch (err) {
      console.error('Error closing room:', err)
      await handleLeaveRoom()
      return
    }

    try {
      stompClient?.disconnect()
    } catch (err) {
      console.warn('Error disconnecting websocket on end:', err)
    }
    setStompClient(null)

    if (sessionId) {
      try {
        const res = await workflowApi.endSession(sessionId)
        if (res.success && res.data) {
          setExpEarned(res.data.expEarned || 0)
        }
      } catch (err) {
        console.error('Error ending study session:', err)
      }
    }
    try {
      await refreshProfile()
    } catch (err) {
      console.error(err)
    }
    setIsEnded(true)
  }

  if (isEnded) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-neutral-200 dark:bg-[var(--color-background)] p-4">
        <Card className="max-w-md w-full p-6 text-center border-2 border-neutral-300 shadow-lg bg-white rounded-2xl">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Session Completed!</h2>
          <p className="text-sm text-neutral-600 mb-6">
            Great job! You've successfully finished your study session in this room.
          </p>
          <div className="bg-emerald-50 border border-emerald-250 rounded-xl p-4 mb-6">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Experience Gained</p>
            <p className="text-3xl font-extrabold text-emerald-600">+{expEarned} EXP</p>
          </div>
          <Link to="/study-rooms">
            <Button variant="primary" className="w-full rounded-xl">Back to Rooms</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-neutral-200 dark:bg-[var(--color-background)] gap-3 p-3">
      {/* Header — solid white, stronger border and shadow for contrast */}
      <header
        className="flex-shrink-0 flex items-center justify-between gap-4 px-4 md:px-5 py-2 bg-[var(--color-surface)] border-2 border-neutral-300 dark:border-[var(--color-border)] rounded-2xl shadow-md"
        role="banner"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-neutral-600 shrink-0" aria-hidden>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.253v2.47M12 3.41v2.47M3.288 8.49h2.47M18.712 8.49h2.47M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2 2 6.477 2 12zm10 4.5v2.5m-2.5-2.5h5" />
            </svg>
          </span>
          <h1 className="text-base md:text-lg font-bold text-neutral-900 truncate tracking-tight">{roomTitle}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <span className="px-2.5 py-1 text-sm border-2 border-neutral-300 rounded-xl bg-neutral-100 font-mono tabular-nums text-neutral-900 font-semibold">
            {formatSeconds(secondsStudied)}
          </span>
          {isHost && (
            <Button
              variant="primary"
              size="sm"
              className="!bg-error !border-error hover:!opacity-90 text-white text-[11px] font-bold rounded-xl"
              onClick={() => setShowEndModal(true)}
            >
              End
            </Button>
          )}
          <span className="w-7 h-7 rounded-full bg-accent-muted text-neutral-800 dark:text-primary border-2 border-primary/30 flex items-center justify-center text-[10px] font-semibold shrink-0" aria-hidden>
            {getDisplayName(user).charAt(0).toUpperCase()}
          </span>
        </div>
      </header>

      {/* Main: video grid + chat sidebar — white panels on darker background */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 gap-3 overflow-hidden">
        {/* Video grid — white card with stronger border/shadow */}
        <main className="flex-1 min-w-0 min-h-[40vh] md:min-h-0 p-4 flex flex-col gap-3 items-center justify-center bg-[var(--color-surface)] rounded-2xl border-2 border-neutral-300 dark:border-[var(--color-border)] shadow-md overflow-auto">
          {(() => {
            const visible = participants.slice(0, 9)
            const { gridClass, tileClass } = getGridLayout(visible.length)
            return (
              <div className={`grid gap-3 w-full ${gridClass}`}>
                {visible.map((p, i) => {
                  const showLocalVideo = p.isYou && videoOn && hasLiveVideo(localStream)
                  const showRemoteVideo = !p.isYou
                    && remoteVideoOn[p.userSso] !== false
                    && hasLiveVideo(remoteStreams[p.userSso])
                  const label = `${p.displayName}${p.isYou ? ' (YOU)' : ''}`
                  const initial = (p.displayName || 'U').charAt(0).toUpperCase()

                  return (
                    <div
                      key={p.userSso || i}
                      className={`${tileClass} rounded-xl border-2 flex items-center justify-center text-xs font-semibold overflow-hidden relative ${
                        p.isYou
                          ? 'border-primary bg-neutral-900 text-white shadow'
                          : 'border-neutral-300 bg-neutral-50 text-neutral-750 shadow-sm'
                      } ${visible.length === 3 && i === 2 ? 'col-span-2 sm:col-span-1 sm:col-start-1 sm:col-end-3 justify-self-center w-full max-w-[50%]' : ''}`}
                    >
                      {showLocalVideo ? (
                        <>
                          <video
                            ref={(el) => {
                              if (el && el.srcObject !== localStream) {
                                el.srcObject = localStream
                              }
                            }}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover rounded-xl"
                          />
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm">
                            {label}
                          </div>
                        </>
                      ) : showRemoteVideo ? (
                        <>
                          <video
                            ref={(el) => {
                              if (el && el.srcObject !== remoteStreams[p.userSso]) {
                                el.srcObject = remoteStreams[p.userSso]
                              }
                            }}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover rounded-xl"
                          />
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm">
                            {p.displayName}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${p.isYou ? 'bg-neutral-700 text-white' : 'bg-neutral-300 text-neutral-800'}`}>
                            {initial}
                          </div>
                          <span className={`text-[11px] font-semibold tracking-tight ${p.isYou ? 'text-white' : 'text-neutral-800'}`}>
                            {label}
                          </span>
                          {((p.isYou && !videoOn) || (!p.isYou && remoteVideoOn[p.userSso] === false)) && (
                            <span className="text-[9px] text-red-500 font-bold bg-red-100 px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-red-200">
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                              Camera OFF
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </main>

        {/* Right: Chat — stacked under video on mobile */}
        <aside className="h-72 md:h-auto w-full md:w-80 shrink-0 flex flex-col overflow-hidden bg-[var(--color-surface)] rounded-2xl border-2 border-neutral-300 dark:border-[var(--color-border)] shadow-md">
          <div className="flex items-center justify-between gap-2 pb-1.5 mb-0 pt-4 px-4 border-b-2 border-neutral-300">
            <h2 className="text-sm font-semibold text-neutral-900">Conversation</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
            {messages.map((m, i) => (
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
              onSend={() => {
                if (!chatInput.trim() || !stompClient || !roomId) return
                stompClient.send('/app/room.chat', {
                  roomId: String(roomId),
                  senderSso: user?.userSso || 'Participant',
                  message: chatInput.trim(),
                  sentAt: new Date().toISOString()
                })
                setChatInput('')
              }}
              onFileChange={() => {}}
              placeholder="Type a message..."
            />
          </div>
        </aside>
      </div>

      {/* Footer — solid white, stronger border and shadow */}
      <footer
        className="flex-shrink-0 flex items-center justify-center gap-4 px-4 md:px-5 py-2 bg-[var(--color-surface)] border-2 border-neutral-300 dark:border-[var(--color-border)] rounded-2xl shadow-md"
      >
        <div className="flex items-center gap-2">
          <IconButton
            onClick={() => setVideoOn(!videoOn)}
            label={videoOn ? 'Turn off camera' : 'Turn on camera'}
            className={`border-2 transition-all duration-200 ${
              videoOn
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400'
                : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400'
            }`}
            icon={
              videoOn ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              )
            }
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5 rounded-xl text-[11px] font-bold py-1.5 h-8 border-2 border-neutral-900 ml-4 hover:bg-neutral-100"
          onClick={handleLeaveRoom}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          Leave
        </Button>
      </footer>

      {/* End study session modal — host only */}
      <Modal open={showEndModal && isHost} onClose={() => setShowEndModal(false)} size="max-w-md" title="End study session?">
        <Card className="p-5 max-w-md w-full border-0 shadow-none bg-transparent">
          <p className="text-sm font-medium text-neutral-600 text-center mb-6">
            Are you sure you want to end this room for everyone?
          </p>
          <div className="flex gap-3 mb-6">
            <Button variant="primary" size="md" className="flex-1 rounded-xl" onClick={() => setShowEndModal(false)}>
              Continue
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="flex-1 w-full !bg-error/10 !border-error/50 !text-error hover:!bg-error/20 rounded-xl"
              onClick={() => {
                setShowEndModal(false)
                handleEndRoomAsHost()
              }}
            >
              End session
            </Button>
          </div>
          <div className="flex justify-between gap-4 text-center border-t border-neutral-200 pt-4">
            <div>
              <p className="text-xl font-bold text-neutral-900">{formatMins(secondsStudied)}</p>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mt-1">Time studied</p>
            </div>
            <div className="w-px bg-neutral-200" />
            <div>
              <p className="text-xl font-bold text-neutral-900">{participants.length}</p>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mt-1">Members</p>
            </div>
          </div>
        </Card>
      </Modal>
    </div>
  )
}
