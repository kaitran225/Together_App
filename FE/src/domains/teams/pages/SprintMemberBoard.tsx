import { Card } from '../../../components/common'

export default function SprintMemberBoard() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Sprint members</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {['Alex', 'Jordan', 'Sam', 'Casey'].map((name, i) => (
          <Card key={i}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 flex items-center justify-center text-sm font-bold text-[var(--color-accent)]">
                {name[0]}
              </div>
              <div>
                <p className="font-bold">{name}</p>
                <p className="text-sm text-neutral-500">Member</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
