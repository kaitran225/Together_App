import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Button, Card } from '../../../components/common'
import { authApi } from '../../../api/client'

type Status = 'verifying' | 'success' | 'error'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>('verifying')
  const [message, setMessage] = useState('')
  const requested = useRef(false)

  useEffect(() => {
    if (requested.current) return
    requested.current = true

    if (!token) {
      setStatus('error')
      setMessage('Missing verification token.')
      return
    }

    authApi.verifyEmail(token)
      .then((result) => {
        if (result.success) {
          setStatus('success')
        } else {
          setStatus('error')
          setMessage(result.message ?? 'Verification failed.')
        }
      })
      .catch((err: any) => {
        setStatus('error')
        setMessage(err.message || 'An unexpected error occurred.')
      })
  }, [token])

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full">
      <Card className="w-full max-w-[420px] p-7 md:p-8 flex flex-col gap-6 bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
        <div className="space-y-2">
          <Badge variant="milestone" className="normal-case tracking-normal">Account verification</Badge>
          <h2 className="text-neutral-900 text-3xl font-bold tracking-tight">
            {status === 'verifying' && 'Verifying your email...'}
            {status === 'success' && 'Email verified!'}
            {status === 'error' && 'Verification failed'}
          </h2>
          {status === 'error' && <p className="text-sm text-error">{message}</p>}
          {status === 'success' && (
            <p className="text-neutral-600 text-sm">Your account is now active. You can log in.</p>
          )}
        </div>
        {status !== 'verifying' && (
          <Button
            variant="primary"
            size="lg"
            className="w-full min-h-[48px] rounded-xl border-0 font-semibold uppercase tracking-wide"
            onClick={() => navigate('/welcome')}
          >
            Go to log in
          </Button>
        )}
      </Card>
    </div>
  )
}
