import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button, Card, Input } from '../../../components/common'
import { useAuth } from '../../../contexts/AuthContext'

export default function Welcome() {
  const navigate = useNavigate()
  const { login, user, isAuthenticated } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const result = login({ identifier, password })
    if (!result.ok) {
      setError(result.error ?? 'Login failed.')
      return
    }
    setError('')
    const role = result.user?.role
    navigate(role === 'ADMIN' ? '/admin' : '/dashboard')
  }

  useEffect(() => {
    if (!isAuthenticated) return
    navigate(user?.role === 'ADMIN' ? '/admin' : '/dashboard')
  }, [isAuthenticated, navigate, user?.role])

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full max-w-[440px] mx-auto">
      <Card className="w-full max-w-[420px] p-7 md:p-8 flex flex-col gap-6 bg-[var(--color-surface)] border border-[var(--color-border)]">
        <div className="space-y-2">
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.12em] bg-primary/20 text-neutral-900 border border-primary/35">
            Study workspace
          </span>
          <h2 className="text-neutral-900 text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-neutral-600 text-sm">Log in to continue your study plans, tasks, and focus sessions.</p>
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Button type="button" variant="secondary" size="lg" className="w-full min-h-[48px] border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)]">
            <span className="text-[#4285F4] font-bold">G</span>
            <span>Continue with Google</span>
          </Button>
          <Button type="button" variant="secondary" size="lg" className="w-full min-h-[48px] border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)]">
            <span className="text-[#1877F2] font-bold">f</span>
            <span>Continue with Facebook</span>
          </Button>
          <div className="relative py-2">
            <hr className="border-t border-[var(--color-border)]" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-surface)] px-3 text-sm text-neutral-500">or</span>
          </div>
          <Input
            label="EMAIL OR USERNAME"
            placeholder="Enter your email or username"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="label-study">PASSWORD</span>
              <Link to="/confirm-mail" className="text-xs text-neutral-700 hover:text-neutral-900">Forgot password?</Link>
            </div>
            <Input
              placeholder="Enter password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" variant="primary" size="lg" className="w-full min-h-[48px] rounded-xl border-0 font-semibold uppercase tracking-wide">
            Log in
          </Button>
        </form>
        <p className="text-center text-sm text-neutral-500 pt-2 border-t border-[var(--color-border)]">
          Don&apos;t have an account? <Link to="/sign-up" className="font-semibold text-neutral-800 hover:text-neutral-900 underline-offset-2 hover:underline">Sign up</Link>
        </p>
      </Card>
    </div>
  )
}
