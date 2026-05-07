import { useNavigate, Link } from 'react-router-dom'
import { Badge, Button, Card, Input } from '../../../components/common'

export default function SignUp() {
  const navigate = useNavigate()

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/personalize')
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
          <Input label="EMAIL" placeholder="name@university.edu" type="email" />
          <Input label="PASSWORD" placeholder="********" type="password" />
          <Input label="CONFIRM PASSWORD" placeholder="********" type="password" />
          <Button type="submit" variant="primary" size="lg" className="w-full min-h-[48px] rounded-xl border-0 font-semibold uppercase tracking-wide">
            Sign up
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
