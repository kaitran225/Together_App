import { Card } from '../../../components/common'

export default function ScrumBoard() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <span className="px-3 py-1 bg-neutral-900 text-white text-sm rounded">Board</span>
        <span className="px-3 py-1 text-sm">Timeline</span>
        <span className="px-3 py-1 text-sm">Files</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['To-Do (3)', 'In Progress (2)', 'Done (1)'].map((col) => (
          <Card key={col} heading={col}>
            <div className="space-y-2">
              <div className="p-3 border border-white/10 rounded text-sm">Task card example</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
