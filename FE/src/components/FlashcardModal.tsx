import { useState, useEffect } from 'react'
import { Button } from './ui'
import { workflowApi } from '../api/client'

type FlashcardModalProps = {
  onClose: () => void
  quizId: number
}

export function FlashcardModal({ onClose, quizId }: FlashcardModalProps) {
  const [loading, setLoading] = useState(false)
  const [cards, setCards] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    setLoading(true)
    workflowApi.getQuizQuestions(quizId)
      .then((res) => {
        if (res.success && res.data) {
          const mapped = res.data.map((q: any) => ({
            id: q.questionId,
            front: q.questionText,
            back: q.correctAnswer,
            explanation: q.explanation
          }))
          setCards(mapped)
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [quizId])

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setFlipped(false)
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setFlipped(false)
      setTimeout(() => setCurrentIndex(currentIndex - 1), 150)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/50" onClick={onClose}>
        <div className="bg-white dark:bg-[var(--color-surface)] rounded-2xl p-10 shadow-xl max-w-sm text-center">
          <p className="text-sm font-medium text-neutral-900">Loading flashcards...</p>
        </div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/50" onClick={onClose}>
        <div className="bg-white dark:bg-[var(--color-surface)] rounded-2xl p-10 shadow-xl max-w-sm text-center">
          <p className="text-sm font-medium text-neutral-900 mb-4">No flashcards found.</p>
          <Button variant="primary" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    )
  }

  const currentCard = cards[currentIndex]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-transparent w-full max-w-2xl min-h-[30rem] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-center justify-between mb-4 text-white">
          <span className="text-sm font-bold bg-black/50 px-3 py-1 rounded-lg">
            Card {currentIndex + 1} / {cards.length}
          </span>
          <Button variant="secondary" size="sm" className="!bg-white/10 !text-white hover:!bg-white/20 !border-white/20" onClick={onClose}>
            Exit
          </Button>
        </div>

        <div className="flex-1 relative">
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setFlipped(!flipped)}
          >
            <div className={`absolute inset-0 w-full h-full bg-white dark:bg-[var(--color-surface)] rounded-3xl shadow-2xl border-2 ${flipped ? 'border-emerald-500/50' : 'border-neutral-200 dark:border-neutral-700'} flex flex-col p-6 sm:p-10 text-center hover:shadow-primary/20 transition-all duration-300 transform overflow-hidden`}>
              {!flipped ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4 shrink-0">Question</p>
                  <div className="flex-1 overflow-y-auto w-full flex flex-col items-center justify-center min-h-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 leading-relaxed max-w-4xl mx-auto break-words">
                      {currentCard.front}
                    </h2>
                  </div>
                  <p className="text-sm text-neutral-400 mt-4 shrink-0">Click to reveal answer</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-4 shrink-0">Answer</p>
                  <div className="flex-1 overflow-y-auto w-full flex flex-col items-center justify-center min-h-0 space-y-6">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-relaxed max-w-4xl mx-auto break-words">
                      {currentCard.back}
                    </h2>
                    {currentCard.explanation && (
                      <div className="w-full max-w-2xl mx-auto p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 text-left shrink-0">
                        <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">{currentCard.explanation}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-neutral-400 mt-4 shrink-0">Click to see question</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-between gap-4 mt-8">
          <Button 
            variant="secondary" 
            size="lg" 
            className="flex-1 !bg-white/10 !text-white hover:!bg-white/20 !border-white/20"
            disabled={currentIndex === 0}
            onClick={handlePrev}
          >
            Previous
          </Button>
          <Button 
            variant="primary" 
            size="lg" 
            className="flex-1 shadow-lg shadow-primary/30"
            disabled={currentIndex === cards.length - 1}
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
