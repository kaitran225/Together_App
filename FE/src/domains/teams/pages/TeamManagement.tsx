import { Button, Card } from '../../../components/common'

export default function TeamManagement() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Team management</h1>
      <Card heading="Members">
        <ul className="space-y-3">
          {['Alex (Owner)', 'Jordan', 'Sam', 'Casey'].map((m, i) => (
            <li key={i} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
              <span>{m}</span>
              <Button variant="ghost" size="sm">Edit</Button>
            </li>
          ))}
        </ul>
        <Button variant="secondary" size="sm" className="mt-4">Invite member</Button>
      </Card>
    </div>
  )
}
