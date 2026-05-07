import { Link } from 'react-router-dom'
import { Button, Card } from '../../../components/common'

export default function FocusRoomDialog() {
  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="text-center">
        <h2 className="text-xl font-bold mb-4">Start focus session?</h2>
        <p className="text-neutral-600 mb-6">Set a duration and we&apos;ll track your streak.</p>
        <div className="flex gap-4 justify-center">
          <Link to="/focus-room"><Button variant="primary">Start</Button></Link>
          <Link to="/dashboard"><Button variant="secondary">Cancel</Button></Link>
        </div>
      </Card>
    </div>
  )
}
