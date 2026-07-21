import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Badge, Button, Card, Input } from '../../../components/common'
import { authApi } from '../../../api/client'

export default function SignUp() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const result = await authApi.register(email, password, fullName)
      if (!result.success) {
        setError(result.message ?? 'Registration failed.')
        return
      }
      navigate('/welcome')
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full">
      <Card className="w-full max-w-[420px] p-7 md:p-8 flex flex-col gap-6 bg-[var(--color-surface)] border border-[var(--color-border)]">
        <div className="text-center space-y-2">
          <Badge variant="milestone" className="normal-case tracking-normal">Create your study account</Badge>
          <h2 className="text-neutral-900 text-3xl font-bold tracking-tight">Sign up</h2>
          <p className="text-neutral-600 text-sm mt-1">Join Together and build your learning streak.</p>
        </div>
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <Input label="FULL NAME" placeholder="Jane Doe" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="EMAIL" placeholder="name@university.edu" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="PASSWORD" placeholder="********" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="CONFIRM PASSWORD" placeholder="********" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" variant="primary" size="lg" disabled={submitting} className="w-full min-h-[48px] rounded-xl border-0 font-semibold uppercase tracking-wide">
            {submitting ? 'Signing up...' : 'Sign up'}
          </Button>
        </form>
        <hr className="border-[var(--color-border)]" />
        <p className="text-center text-sm text-neutral-500">
          Already have an account? <Link to="/welcome" className="font-semibold text-accent hover:opacity-90">Log in</Link>
        </p>
      </Card>
    </div>
  )
}
