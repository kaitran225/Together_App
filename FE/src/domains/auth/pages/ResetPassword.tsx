import { useNavigate, Link } from 'react-router-dom'
import { Badge, Button, Card, Input } from '../../../components/common'

export default function ResetPassword() {
  const navigate = useNavigate()

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/welcome')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full">
      <Card className="w-full max-w-[420px] p-7 md:p-8 border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-6">
        <div className="text-center space-y-2">
          <Badge variant="primary" className="normal-case tracking-normal">Secure your account</Badge>
          <h2 className="text-neutral-900 text-3xl font-bold tracking-tight">Reset password</h2>
        </div>
        <form onSubmit={handleConfirm} className="flex flex-col gap-4">
          <Input label="PASSWORD" placeholder="********" type="password" />
          <Input label="CONFIRM PASSWORD" placeholder="********" type="password" />
          <Button type="submit" variant="primary" size="lg" className="w-full min-h-[48px] rounded-xl border-0 font-semibold uppercase tracking-wide">
            Confirm
          </Button>
        </form>
        <hr className="border-[var(--color-border)]" />
        <p className="text-center text-sm text-neutral-500">
          <Link to="/welcome" className="font-semibold text-accent hover:opacity-90">Back to log in</Link>
        </p>
      </Card>
    </div>
  )
}
