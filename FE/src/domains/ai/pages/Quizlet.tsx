import { useState } from 'react'
import { Button, Card, QuizletQuizModal } from '../../../components/common'
import { MOCK_SETS } from '../../../mocks'

export default function Quizlet() {
  const [showQuizModal, setShowQuizModal] = useState(false)

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold uppercase text-neutral-900">Quizlet</h1>
      <p className="text-sm text-neutral-500">Choose a set and do the quiz (10 questions).</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MOCK_SETS.map((set) => (
          <Card key={set.id} className="p-4 flex flex-col min-h-[10rem]">
            <div className="flex-1 min-h-0">
              <p className="text-sm font-bold text-neutral-900">{set.title}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{set.subtitle}</p>
            </div>
            <div className="flex-shrink-0 pt-3 mt-auto">
              <Button variant="primary" size="sm" className="w-full" onClick={() => setShowQuizModal(true)}>
                Do the quiz
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {showQuizModal && <QuizletQuizModal onClose={() => setShowQuizModal(false)} />}
    </div>
  )
}
