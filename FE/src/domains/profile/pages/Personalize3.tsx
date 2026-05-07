import { Link } from 'react-router-dom'
import { Button, Card, Textarea } from '../../../components/common'

export default function Personalize3() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">Step 3/3</span>
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-[width]" style={{ width: '100%' }} />
          </div>
          <span className="text-sm font-medium text-neutral-600 w-10">100%</span>
        </div>
      </div>

      <Card className="p-6 shadow-sm border-2 border-neutral-200">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">Personalize your journey</h1>

        <div className="space-y-5">
          <Textarea
            label="Your interests"
            placeholder="Reading, music, movies, sports, travel..."
            className="min-h-[100px]"
          />
          <Textarea
            label="Topics you care about"
            placeholder="Education, technology, startups, self-development, personal finance..."
            className="min-h-[100px]"
          />
          <Textarea
            label="A small promise to yourself"
            placeholder="Let's try together!"
            className="min-h-[100px]"
          />
        </div>

        <div className="flex justify-between mt-8 pt-6 border-t border-neutral-200">
          <Link to="/personalize-2">
            <Button variant="secondary">Back</Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="primary">Complete</Button>
          </Link>
        </div>
      </Card>

      <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent-muted/50 p-4 flex items-center gap-4">
        <span className="w-12 h-12 rounded-full border-2 border-dashed border-accent flex items-center justify-center text-accent shrink-0" aria-hidden>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-neutral-900">Unlock your first achievement</p>
          <p className="text-xs text-neutral-600 mt-0.5">Complete to earn experience points and coins.</p>
        </div>
      </div>
    </div>
  )
}
