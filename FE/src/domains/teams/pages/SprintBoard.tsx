import { Card } from '../../../components/common'

export default function SprintBoard() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Sprint board</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['To Do', 'In Progress', 'Done'].map((col) => (
          <Card key={col} heading={col}>
            <p className="text-sm text-neutral-500">Drag tasks here.</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
