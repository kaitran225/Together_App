import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Button, Card, ChatInputBar, Modal } from '../../../components/common'
import { workflowApi } from '../../../api/client'
import { useAuth } from '../../../contexts/AuthContext'
import { StompClient } from '../../../api/websocket'

export default function MainMeetingBoard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const meetingIdStr = searchParams.get('meetingId')
  const meetingId = meetingIdStr ? parseInt(meetingIdStr) : null

  const { user, refreshProfile } = useAuth()
  
  const [meetingInfo, setMeetingInfo] = useState({ title: '', description: '' })
  const [summary, setSummary] = useState<any>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0)

  // WebRTC & Chat States
  const [messages, setMessages] = useState<any[]>([])
  
  // Use display name if available, otherwise SSO
  const getDisplayName = (u: any) => {
    if (!u) return 'Unknown'
    return u.fullName || u.username || u.userSso || 'You'
  }
  
  const [participants, setParticipants] = useState<any[]>(() => {
    return user ? [{ name: getDisplayName(user), sso: user.userSso, isYou: true }] : []
  })
  const [stompClient, setStompClient] = useState<StompClient | null>(null)
  const [chatInput, setChatInput] = useState('')
  
  const [videoOn, setVideoOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const pcsRef = useRef<{ [userSso: string]: RTCPeerConnection }>({})
  const [remoteStreams, setRemoteStreams] = useState<{ [userSso: string]: MediaStream }>({})

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

  // Start Timer
  useEffect(() => {
    const timer = setInterval(() => setSecondsElapsed(prev => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [])

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

  // Get User Media and Setup Recording
  useEffect(() => {
    if (videoOn || micOn) {
      navigator.mediaDevices.getUserMedia({
        video: videoOn ? { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 30 } } : false,
        audio: micOn
      })
        .then((stream) => {
          setLocalStream(stream)
          
          // Start Recording
          if (stream && !mediaRecorderRef.current) {
            recordedChunksRef.current = []
            try {
              const options = { mimeType: 'video/webm;codecs=vp9,opus' }
              const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined)
              
              recorder.ondataavailable = (e) => {
                if (e.data.size > 0) recordedChunksRef.current.push(e.data)
              }
              
              recorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
                const url = URL.createObjectURL(blob)
                setRecordingBlobUrl(url)
              }
              
              recorder.start(1000) // Collect chunks every second
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
    } else {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
        setLocalStream(null)
      }
    }
    
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [videoOn, micOn])

  // WebRTC Setup
  const createPeerConnection = (targetSso: string, targetName: string) => {
    if (pcsRef.current[targetSso]) return pcsRef.current[targetSso]

    const storedIce = window.localStorage.getItem('webrtc-ice-servers')
    const iceServers = storedIce ? JSON.parse(storedIce) : [{ urls: 'stun:stun.l.google.com:19302' }]
    
    const pc = new RTCPeerConnection({ iceServers })
    pcsRef.current[targetSso] = pc

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!))
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && stompClientRef.current && meetingId) {
        stompClientRef.current.send('/app/room.signal', {
          roomId: String(meetingId),
          fromUser: user?.userSso,
          toUser: "",
          type: 'candidate',
          payload: { type: 'candidate', toUser: targetSso, data: event.candidate },
          sentAt: new Date().toISOString()
        })
      }
    }

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        stompClientRef.current?.send('/app/room.signal', {
          roomId: String(meetingId),
          fromUser: user?.userSso,
          toUser: "",
          type: 'offer',
          payload: { type: 'offer', toUser: targetSso, targetName: getDisplayName(user), data: pc.localDescription },
          sentAt: new Date().toISOString()
        })
      } catch (err) {
        console.error('Failed to renegotiate', err)
      }
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0]
      if (stream) {
        setRemoteStreams((prev) => ({ ...prev, [targetSso]: stream }))
        setParticipants(prev => {
          if (!prev.find(p => p.sso === targetSso)) {
            return [...prev, { name: targetName, sso: targetSso, isYou: false }]
          }
          return prev
        })
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
    // DO NOT remove from participants UI when connection drops. 
    // They might still be in the websocket room.
    // setParticipants(prev => prev.filter(p => p.sso !== targetSso || p.isYou))
  }

  const initiateCall = async (targetSso: string, targetName: string) => {
    try {
      const pc = createPeerConnection(targetSso, targetName)
      // The offer will be created automatically by onnegotiationneeded 
      // if tracks are added, but we explicitly create one if none is needed yet.
      // Wait, onnegotiationneeded might fire anyway. Let's just create it to be sure.
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      stompClientRef.current?.send('/app/room.signal', {
        roomId: String(meetingId),
        fromUser: user?.userSso,
        toUser: "",
        type: 'offer',
        payload: { type: 'offer', toUser: targetSso, targetName: getDisplayName(user), data: offer },
        sentAt: new Date().toISOString()
      })
    } catch (err) {
      console.error('Failed to initiate call to', targetSso, err)
    }
  }

  const handleOffer = async (senderSso: string, senderName: string, offer: RTCSessionDescriptionInit) => {
    try {
      const pc = createPeerConnection(senderSso, senderName)
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      stompClientRef.current?.send('/app/room.signal', {
        roomId: String(meetingId),
        fromUser: user?.userSso,
        toUser: "",
        type: 'answer',
        payload: { type: 'answer', toUser: senderSso, data: answer },
        sentAt: new Date().toISOString()
      })
    } catch (err) {
      console.error('Error handling offer', err)
    }
  }

  // WebSocket Connection & Fetch Details
  useEffect(() => {
    if (!meetingId || !user) return

    workflowApi.joinMeeting(meetingId).then((res) => {
      if (res.success && res.data) {
        setMeetingInfo({
          title: res.data.title || `Meeting #${meetingId}`,
          description: res.data.description || 'No description provided.'
        })
      }
    }).catch(console.error)

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:8881' : window.location.host
    const wsUrl = `${wsProtocol}//${wsHost}/ws`
    const client = new StompClient(wsUrl)
    setStompClient(client)
    stompClientRef.current = client

    client.connect().then(() => {
      client.send('/app/room.signal', {
        roomId: String(meetingId),
        fromUser: user.userSso,
        toUser: "",
        type: 'join',
        payload: { type: 'join', fromUser: user.userSso, senderName: getDisplayName(user) },
        sentAt: new Date().toISOString()
      })

      client.subscribe(`/topic/rooms/${meetingId}/chat`, (msg) => {
        setMessages((prev) => [
          ...prev,
          {
            user: msg.senderName || msg.senderSso || 'Participant',
            text: msg.message,
            time: msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('vi-VN'),
            own: msg.senderSso === user?.userSso,
            ai: false
          }
        ])
      })

      client.subscribe(`/topic/rooms/${meetingId}/signals`, (event) => {
        const sender = event.actor
        if (sender === user?.userSso) return
        const payload = event.payload
        if (!payload) return

        if (payload.type === 'join') {
          const sName = payload.senderName || sender
          setParticipants(prev => {
            if (!prev.find(p => p.sso === sender)) {
              return [...prev, { name: sName, sso: sender, isYou: false }]
            }
            return prev
          })
          if (user.userSso && user.userSso > sender) {
            initiateCall(sender, sName)
          } else if (user.userSso) {
            client.send('/app/room.signal', {
              roomId: String(meetingId),
              fromUser: user.userSso,
              toUser: sender,
              type: 'hello',
              payload: { type: 'hello', toUser: sender, fromUser: user.userSso, senderName: getDisplayName(user) },
              sentAt: new Date().toISOString()
            })
          }
        } else if (payload.type === 'hello' && payload.toUser === user?.userSso) {
          const sName = payload.senderName || payload.fromUser || sender
          setParticipants(prev => {
            if (!prev.find(p => p.sso === sender)) {
              return [...prev, { name: sName, sso: sender, isYou: false }]
            }
            return prev
          })
          if (user.userSso && user.userSso > sender) {
            initiateCall(sender, sName)
          }
        } else if (payload.toUser === user?.userSso) {
          const { type, data, targetName } = payload
          const sName = targetName || sender
          if (type === 'offer') handleOffer(sender, sName, data)
          else if (type === 'answer') pcsRef.current[sender]?.setRemoteDescription(new RTCSessionDescription(data))
          else if (type === 'candidate') pcsRef.current[sender]?.addIceCandidate(new RTCIceCandidate(data))
        }
      })
    })

    return () => {
      client.disconnect()
      Object.keys(pcsRef.current).forEach(closePeerConnection)
    }
  }, [meetingId, user?.userSso])

  useEffect(() => {
    if (!localStream) return
    Object.values(pcsRef.current).forEach(pc => {
      const senders = pc.getSenders()
      senders.forEach(sender => { try { pc.removeTrack(sender) } catch (e) {} })
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream))
    })
  }, [localStream])

  // End Meeting & Auto Analysis
  const triggerAutoAnalysis = async () => {
    if (!meetingId) return
    setIsTranscribing(true)
    setUploadError('')
    
    try {
      // 1. Stop recorder and get final blob
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      
      // Wait briefly for recorder to process the final chunks
      await new Promise(resolve => setTimeout(resolve, 500))
      
      let fileToUpload: File
      if (recordedChunksRef.current.length > 0) {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        fileToUpload = new File([blob], `meeting_${meetingId}_auto_record.webm`, { type: 'audio/webm' })
      } else {
        // Fallback dummy file if no recording permission was granted
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
            setUploadError('AI processing is taking too long. Please check back later.')
            clearInterval(interval)
          }
        }, 3000)
      } else {
        setUploadError(res.message || 'Lỗi khi gửi dữ liệu lên AI.')
        setIsTranscribing(false)
      }
    } catch (err) {
      setUploadError('Lỗi kết nối khi gửi tệp âm thanh.')
      setIsTranscribing(false)
    }
  }

  const handleEndCallClick = async () => {
    if (meetingId) {
      try {
        await workflowApi.endMeeting(meetingId)
        // Refresh the profile to get updated EXP
        if (refreshProfile) {
          refreshProfile()
        }
      } catch (e) { console.error(e) }
    }
    
    // Stop AV tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }
    
    // Calculate mock EXP
    const exp = Math.floor(secondsElapsed / 60) * 10 + 50
    setExpEarned(exp)

    setShowEndModal(true)
    triggerAutoAnalysis()
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
    <div className="flex h-full min-h-0 flex-col gap-0 p-3 bg-neutral-200 relative">
      <div className="flex flex-col gap-1 pb-3 px-4 bg-white rounded-t-xl mt-0 pt-4 border-b-2 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-extrabold text-neutral-900 tracking-tight">
              {meetingInfo.title || (meetingId ? `Meeting #${meetingId}` : 'Loading...')}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1 max-w-2xl">{meetingInfo.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="streak" className="rounded-md normal-case bg-red-100 text-red-600 border border-red-300">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse mr-1.5 inline-block"></span>
              Recording Live - {formatTime(secondsElapsed)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 gap-3 mt-3">
        {/* Left Area: Video Grid */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 grid min-h-0 grid-cols-2 lg:grid-cols-3 gap-3 overflow-auto border-2 border-neutral-300 rounded-xl bg-white p-4 shadow-md content-start">
            {participants.map((p, i) => (
              <Card key={i} variant="interactive" className="flex flex-col rounded-xl border-2 border-neutral-300 bg-neutral-900 overflow-hidden p-0 relative aspect-video shadow-md">
                {p.isYou && videoOn && localStream ? (
                  <video
                    ref={(el) => { if (el && el.srcObject !== localStream) el.srcObject = localStream }}
                    autoPlay playsInline muted className="w-full h-full object-cover"
                  />
                ) : !p.isYou && remoteStreams[p.sso] ? (
                  <video
                    ref={(el) => { if (el && el.srcObject !== remoteStreams[p.sso]) el.srcObject = remoteStreams[p.sso] }}
                    autoPlay playsInline className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center p-4 text-center h-full">
                     <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center text-xl text-white font-bold mb-2 shadow-inner">
                       {p.name.charAt(0).toUpperCase()}
                     </div>
                     <span className="text-[10px] font-bold text-neutral-400 uppercase">Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm">
                  {p.name} {p.isYou ? '(YOU)' : ''}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Sidebar: Chat & Notes */}
        {activeTab && (
          <aside className="w-[340px] shrink-0 flex flex-col gap-3 min-h-0 transition-all">
            <div className="flex-1 flex flex-col bg-white rounded-xl border-2 border-neutral-300 overflow-hidden shadow-md min-h-0">
               <div className="p-3 border-b-2 border-neutral-200 bg-neutral-50 flex justify-between items-center flex-shrink-0">
                 <h3 className="text-xs font-bold uppercase text-neutral-800">
                   {activeTab === 'chat' ? 'Live Chat' : 'Quick Note'}
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
                           senderSso: user?.userSso || 'Participant',
                           senderName: getDisplayName(user),
                           message: chatInput.trim(),
                           sentAt: new Date().toISOString()
                         })
                         setChatInput('')
                       }}
                       onFileChange={() => {}}
                       placeholder="Type message..." 
                     />
                   </div>
                 </>
               ) : (
                 <>
                   <div className="flex-1 overflow-y-auto p-3 bg-white flex flex-col">
                     <textarea 
                       className="flex-1 w-full p-2 text-sm border-2 border-neutral-200 rounded-lg resize-none focus:outline-none focus:border-neutral-400"
                       placeholder="Jot down important notes here..."
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
                       Save Note
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
            {micOn ? 'Microphone: ON' : 'Microphone: OFF'}
          </Button>
          <Button 
            variant="secondary" 
            size="md" 
            className={`font-bold transition-colors ${videoOn ? 'hover:bg-neutral-100' : '!bg-red-50 !text-red-700 !border-red-300 hover:!bg-red-100'}`} 
            onClick={() => setVideoOn(!videoOn)}
          >
            {videoOn ? 'Camera: ON' : 'Camera: OFF'}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            size="md" 
            className={`font-bold transition-colors ${activeTab === 'chat' ? '!bg-neutral-900 !text-white hover:!bg-neutral-800' : ''}`} 
            onClick={() => setActiveTab(activeTab === 'chat' ? null : 'chat')}
          >
            💬 Chat
          </Button>
          <Button 
            variant="secondary" 
            size="md" 
            className={`font-bold transition-colors ${activeTab === 'note' ? '!bg-neutral-900 !text-white hover:!bg-neutral-800' : ''}`} 
            onClick={() => setActiveTab(activeTab === 'note' ? null : 'note')}
          >
            📝 Quick Note
          </Button>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button variant="primary" size="md" className="!bg-error hover:!bg-red-700 text-white !border-error uppercase font-bold tracking-wide shadow-sm px-8" onClick={handleEndCallClick}>
            End Meeting
          </Button>
        </div>
      </div>

      {/* End Meeting Modal */}
      <Modal 
        open={showEndModal} 
        onClose={() => {}} // Disabled outside click
        size="max-w-4xl"
        title="Meeting Finished"
      >
        <div className="flex flex-col md:flex-row gap-6 p-4">
          
          {/* Left Column: Stats & Actions */}
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <Card className="bg-neutral-50 p-5 text-center border border-neutral-200 shadow-inner">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Total Duration</h3>
              <p className="text-3xl font-extrabold text-neutral-900">{formatTime(secondsElapsed)}</p>
            </Card>

            <Card className="bg-emerald-50 p-5 text-center border border-emerald-200">
              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Exp Earned</h3>
              <p className="text-3xl font-extrabold text-emerald-700">+{expEarned}</p>
            </Card>

            <div className="mt-2 space-y-3">
              {recordingBlobUrl ? (
                <a href={recordingBlobUrl} download={`meeting_${meetingId}_record.webm`} className="block w-full">
                  <Button variant="secondary" className="w-full justify-center !bg-blue-50 !text-blue-700 !border-blue-200 hover:!bg-blue-100">
                    ⬇️ Download Recording
                  </Button>
                </a>
              ) : (
                 <Button variant="secondary" className="w-full justify-center" disabled>
                   Generating Record...
                 </Button>
              )}

              <Button variant="secondary" className="w-full justify-center !bg-purple-50 !text-purple-700 !border-purple-200 hover:!bg-purple-100">
                📝 Generate Quick Quiz
              </Button>
            </div>
            
            <div className="mt-auto pt-6 border-t border-neutral-200">
              <Button variant="primary" className="w-full justify-center" onClick={() => navigate('/meetings')}>
                Return to Meetings
              </Button>
            </div>
          </div>

          {/* Right Column: AI Analysis */}
          <div className="w-full md:w-2/3 flex flex-col gap-4 bg-white border border-neutral-200 rounded-xl p-5 shadow-sm min-h-[400px]">
             <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
               <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                 ✨ AI Post-Meeting Analysis
               </h2>
               {isTranscribing && (
                 <Badge variant="milestone" className="animate-pulse">Processing Audio...</Badge>
               )}
             </div>

             <div className="flex-1 overflow-y-auto pr-2">
               {uploadError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{uploadError}</p>}
               
               {!summary && isTranscribing && (
                 <div className="flex flex-col items-center justify-center h-full text-neutral-500 py-10">
                    <div className="w-12 h-12 border-4 border-neutral-200 border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-medium">Analyzing conversation and generating insights...</p>
                 </div>
               )}

               {summary && (
                 <div className="space-y-6 animate-fade-in pb-4">
                    <section>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2">Executive Summary</h3>
                      <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <p className="text-sm leading-relaxed text-neutral-800">{summary.content}</p>
                      </div>
                    </section>
                    
                    {keyPoints.length > 0 && (
                      <section>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2">Key Points</h3>
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
                        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">Suggested Action Items</h3>
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
        </div>
      </Modal>
    </div>
  )
}
