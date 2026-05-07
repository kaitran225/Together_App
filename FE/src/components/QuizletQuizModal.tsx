import { useState, useCallback } from 'react'
import { Button } from './ui'
import { MOCK_QUESTIONS, type QuizQuestion } from '../mocks'

export type QuizResult = {
  score: number
  total: number
  correctCount: number
  timeSpent: string
  wrongQuestions: { topic: string; questionNumbers: number[] }[]
  suggestedTopics: { title: string; percent: number }[]
}

function computeResult(answers: (number | null)[], questions: QuizQuestion[], timeSpent: string): QuizResult {
  let correctCount = 0
  const wrongIndices: number[] = []
  answers.forEach((a, i) => {
    if (a === questions[i].correctIndex) correctCount++
    else wrongIndices.push(i + 1)
  })
  const wrongQuestions =
    wrongIndices.length > 0
      ? [{ topic: 'Compare Gradient Descent and Adam', questionNumbers: wrongIndices }]
      : []
  return {
    score: correctCount,
    total: questions.length,
    correctCount,
    timeSpent,
    wrongQuestions,
    suggestedTopics: [
      { title: 'Optimization algorithms', percent: 45 },
      { title: 'Optimization algorithms', percent: 62 },
      { title: 'Optimization algorithms', percent: 78 },
    ],
  }
}

type QuizletQuizModalProps = {
  onClose: () => void
  questions?: QuizQuestion[]
}

export function QuizletQuizModal({ onClose, questions = MOCK_QUESTIONS }: QuizletQuizModalProps) {
  const [step, setStep] = useState<'quiz' | 'result'>('quiz')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null))
  const [startTime] = useState(Date.now())
  const [result, setResult] = useState<QuizResult | null>(null)

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const answered = answers[currentIndex] !== null

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      setAnswers((prev) => {
        const next = [...prev]
        next[currentIndex] = optionIndex
        return next
      })
    },
    [currentIndex]
  )

  const handleNext = useCallback(() => {
    if (isLast) {
      const elapsed = Math.round((Date.now() - startTime) / 1000)
      const timeStr = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`
      setResult(computeResult(answers, questions, timeStr))
      setStep('result')
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }, [isLast, answers, questions, startTime])

  if (step === 'result' && result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/50" onClick={onClose}>
        <div
          className="bg-white dark:bg-[var(--color-surface)] rounded-2xl border border-neutral-200 dark:border-neutral-600 shadow-xl w-full max-w-4xl min-h-[36rem] max-h-[95vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-shrink-0 flex items-center justify-end gap-4 px-10 py-5 border-b border-neutral-200 dark:border-neutral-600">
            <span className="px-4 py-2 rounded-lg bg-accent-muted text-accent text-xs font-semibold">
              Time {result.timeSpent}
            </span>
            <Button variant="secondary" size="sm" className="!bg-error/10 !border-error/50 !text-error hover:!bg-error/20" onClick={onClose}>
              Exit
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-10 py-10">
            <h1 className="text-lg font-bold uppercase text-neutral-900 dark:text-neutral-900 text-center mb-12">Analysis results</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50/50 dark:bg-[var(--color-surface)] p-8">
                <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-600 mb-5">Questions you got wrong</h2>
                {result.wrongQuestions.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-600">None — all correct!</p>
                ) : (
                  <ul className="space-y-5">
                    {result.wrongQuestions.map((w, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="w-1 flex-shrink-0 rounded-full bg-highlight mt-0.5" aria-hidden />
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-900">{w.topic}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-600 mt-1">
                            Wrong in questions {w.questionNumbers.join(' & ')}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50/50 dark:bg-[var(--color-surface)] p-8">
                <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-600 mb-5 flex items-center gap-1.5">
                  Suggested topics
                  <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </h2>
                <ul className="space-y-5">
                  {result.suggestedTopics.map((s, i) => (
                    <li key={i}>
                      <p className="text-xs font-medium text-neutral-900 dark:text-neutral-900 mb-1.5">{s.title}</p>
                      <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${s.percent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-neutral-500 mt-0.5 inline-block">{s.percent}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex items-center justify-center gap-16 py-8 border-t border-neutral-200 dark:border-neutral-600">
              <div className="text-center min-w-[4rem]">
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-900">{result.score}/{result.total}</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-600 uppercase tracking-wide mt-1.5">Score</p>
              </div>
              <div className="w-px h-12 bg-neutral-200 dark:bg-neutral-600" />
              <div className="text-center min-w-[4rem]">
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-900">{String(result.correctCount).padStart(2, '0')}</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-600 uppercase tracking-wide mt-1.5">Correct</p>
              </div>
              <div className="w-px h-12 bg-neutral-200 dark:bg-neutral-600" />
              <div className="text-center min-w-[4rem]">
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-900">{result.timeSpent}</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-600 uppercase tracking-wide mt-1.5">Time spent</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-[var(--color-surface)] rounded-2xl border border-neutral-200 dark:border-neutral-600 shadow-xl w-full max-w-3xl min-h-[34rem] max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-center justify-between gap-5 px-10 py-5 border-b border-neutral-200 dark:border-neutral-600">
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-900">
            Question {currentIndex + 1} / {questions.length}
          </span>
          <div className="flex items-center gap-4">
            <span className="px-4 py-2 rounded-lg bg-accent-muted text-accent text-[11px] font-semibold">
              Time {String(Math.floor((Date.now() - startTime) / 60000)).padStart(2, '0')}:{String(Math.floor(((Date.now() - startTime) / 1000) % 60)).padStart(2, '0')}
            </span>
            <Button variant="secondary" size="sm" className="!bg-error/10 !border-error/50 !text-error hover:!bg-error/20" onClick={onClose}>
              Exit
            </Button>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-10 py-10">
            <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden mb-10">
              <div
                className="h-full bg-neutral-700 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
            <p className="text-[11px] font-bold uppercase text-neutral-500 dark:text-neutral-600 mb-4">Topic: Neural Networks</p>
            <p className="text-base font-bold text-neutral-900 dark:text-neutral-900 leading-snug max-w-xl mx-auto">
              &quot;{currentQuestion.question}&quot;
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-5 justify-center px-10 py-6 border-t border-neutral-200 dark:border-neutral-600 bg-white dark:bg-[var(--color-surface)]">
            {currentQuestion.options.map((opt, idx) => (
              <Button
                key={idx}
                variant={answers[currentIndex] === idx ? 'primary' : 'secondary'}
                size="lg"
                className="flex-1 min-h-[3.25rem] max-w-md mx-auto sm:max-w-none w-full sm:w-auto"
                onClick={() => handleAnswer(idx)}
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 flex justify-end px-10 py-5 border-t border-neutral-200 dark:border-neutral-600">
          <Button variant="primary" size="sm" onClick={handleNext} disabled={!answered}>
            {isLast ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
