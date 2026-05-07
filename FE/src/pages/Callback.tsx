import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setStoredToken } from '../api/client'

export default function Callback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('No authorization code')
      return
    }
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${window.location.origin}/callback`,
      client_id: 'exe101-web',
      client_secret: 'secret',
    })
    fetch('http://localhost:8081/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.access_token) {
          setStoredToken(data.access_token)
          navigate('/dashboard', { replace: true })
        } else {
          setError(data.error_description || 'Token exchange failed')
        }
      })
      .catch(() => setError('Request failed'))
  }, [searchParams, navigate])

  if (error) return <p className="text-error">{error}</p>
  return <p>Completing login…</p>
}
