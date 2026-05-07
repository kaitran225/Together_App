import { Link } from 'react-router-dom'
import { Card } from '../../../components/common'

export default function StudyRoomDashboard() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Study room dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card heading="Active rooms">
          <p className="text-neutral-600">No active rooms. <Link to="/study-rooms/create-new" className="underline font-medium">Create one</Link>.</p>
        </Card>
        <Card heading="Recent activity">
          <p className="text-neutral-600 text-sm">Your recent study sessions will appear here.</p>
        </Card>
      </div>
    </div>
  )
}
