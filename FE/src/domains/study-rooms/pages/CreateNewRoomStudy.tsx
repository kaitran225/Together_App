import { Link } from 'react-router-dom'
import { Button, Card, Input, RadioGroup, Textarea, Select } from '../../../components/common'
import { topicOptions, durationOptions } from '../../../mocks'

export default function CreateNewRoomStudy() {
  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      <div className="pb-6 border-b border-neutral-200">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">Set Up Your Study Space</h1>
        <p className="text-lg text-neutral-600">Choose your settings to create a productive environment for you and your peers.</p>
      </div>
      <div className="flex flex-col gap-8">
        <Card>
          <div className="flex flex-col gap-6">
            <Input label="Room Name" placeholder="e.g. Advanced Calculus Group Session" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select label="Topic Selection" options={topicOptions} />
              <Select label="Duration (Optional)" options={durationOptions} />
            </div>
            <Textarea label="Main Study Goals" placeholder="What are we focusing on today? (e.g., Reviewing Chapter 4 exercises, Mock Exam practice)" rows={4} />
          </div>
        </Card>
        <Card heading="Access & Capacity">
          <div className="flex flex-col gap-4">
            <div className="p-4 border border-neutral-200 rounded flex justify-between items-center">
              <div>
                <p className="font-bold">Public Room</p>
                <p className="text-sm text-neutral-500">Anyone can join this room via the browser.</p>
              </div>
              <RadioGroup
                name="access"
                value="public"
                options={[{ value: 'public', label: '' }]}
                onChange={() => {}}
                className="items-end"
              />
            </div>
            <Input label="Max members (optional)" type="number" placeholder="10" />
          </div>
        </Card>
        <div className="flex gap-4">
          <Link to="/study-rooms"><Button variant="secondary">Cancel</Button></Link>
          <Button variant="primary">Create Room</Button>
        </div>
      </div>
    </div>
  )
}
