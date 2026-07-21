import { useState, useCallback, useEffect } from 'react'
import { Button } from './ui'
import { MOCK_QUESTIONS, type QuizQuestion } from '../mocks'
import { workflowApi } from '../api/client'
import { useTranslation } from '../contexts/LanguageContext'

export type QuizResult = {
  score: number
  total: number
  correctCount: number
  timeSpent: string
  wrongQuestions: { topic: string; questionNumbers: number[] }[]
  suggestedTopics: { title: string; percent: number }[]
}

function reviewTopicTitle(topic: string, t: (key: string, params?: Record<string, string | number>) => string) {
  if (topic.length > 30) {
    return t('ai.quiz.reviewTopicTruncated', { topic: topic.substring(0, 30) })
  }
  return t('ai.quiz.reviewTopic', { topic })
}

function computeResult(
  answers: (number | null)[],
  questions: any[],
  timeSpent: string,
  t: (key: string, params?: Record<string, string | number>) => string,
): QuizResult {
  let correctCount = 0
  const wrongIndices: number[] = []
  answers.forEach((a, i) => {
    const q = questions[i]
    if (typeof q.correctIndex === 'number') {
      if (a === q.correctIndex) correctCount++
      else wrongIndices.push(i + 1)
    } else {
      const selectedStr = a !== null ? q.options[a] : ''
      if (selectedStr === q.correctAnswer) correctCount++
      else wrongIndices.push(i + 1)
    }
  })
  const wrongQuestions =
    wrongIndices.length > 0
      ? [{ topic: 'Compare Gradient Descent and Adam', questionNumbers: wrongIndices }]
      : []

  const generatedTopics =
    wrongQuestions.length > 0
      ? wrongQuestions.slice(0, 3).map((wq: any) => ({
          title: reviewTopicTitle(wq.topic, t),
          percent: Math.floor(Math.random() * 40) + 50,
        }))
      : [{ title: t('ai.quiz.generalKnowledgeGreat'), percent: 100 }]

  return {
    score: correctCount * 10,
    total: questions.length * 10,
    correctCount,
    timeSpent,
    wrongQuestions,
    suggestedTopics: generatedTopics,
  }
}

type QuizletQuizModalProps = {
  onClose: () => void
  questions?: QuizQuestion[]
  quizId?: number
}

export function QuizletQuizModal({ onClose, questions: initialQuestions = MOCK_QUESTIONS, quizId }: QuizletQuizModalProps) {
  const { t } = useTranslation()
  const [questions, setQuestions] = useState<any[]>(initialQuestions)
  const [attemptId, setAttemptId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'quiz' | 'result'>('quiz')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [startTime, setStartTime] = useState(Date.now())
  const [result, setResult] = useState<QuizResult | null>(null)

  useEffect(() => {
    if (quizId) {
      setLoading(true)
      workflowApi
        .startQuizAttempt(quizId)
        .then((res) => {
          if (res.success && res.data) {
            setAttemptId(res.data.attemptId)
          }
        })
        .catch((err) => console.error(err))

      workflowApi
        .getQuizQuestions(quizId)
        .then((res) => {
          if (res.success && res.data) {
            const mapped = res.data.map((q: any) => {
              let parsedOpts: string[] = []
              try {
                parsedOpts = JSON.parse(q.options)
              } catch {
                parsedOpts = []
              }
              return {
                id: q.questionId,
                question: q.questionText,
                options: parsedOpts,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
              }
            })
            setQuestions(mapped)
            setAnswers(mapped.map(() => null))
            setStartTime(Date.now())
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false))
    } else {
      setQuestions(initialQuestions)
      setAnswers(initialQuestions.map(() => null))
      setStartTime(Date.now())
    }
  }, [quizId, initialQuestions])

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
    [currentIndex],
  )

  const handleNext = useCallback(async () => {
    if (isLast) {
      const elapsed = Math.round((Date.now() - startTime) / 1000)
      const timeStr = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`

      if (quizId && attemptId) {
        const submissions = answers.map((ansIndex, idx) => {
          const q = questions[idx]
          return {
            questionId: q.id,
            selectedAnswer: ansIndex !== null ? q.options[ansIndex] : '',
          }
        })
        try {
          const res = await workflowApi.submitQuizAttempt(attemptId, submissions)
          if (res.success && res.data) {
            const resData = res.data
            const wrongQuestions = resData.results
              .filter((r: any) => !r.isCorrect)
              .map((r: any, idx: number) => ({
                topic: r.questionText,
                questionNumbers: [idx + 1],
              }))
            const generatedTopics =
              wrongQuestions.length > 0
                ? wrongQuestions.slice(0, 3).map((wq: any) => ({
                    title: reviewTopicTitle(wq.topic, t),
                    percent: Math.floor(Math.random() * 40) + 50,
                  }))
                : [{ title: t('ai.quiz.generalKnowledgeGreat'), percent: 100 }]

            setResult({
              score: resData.pointsEarned,
              total: resData.pointsPossible,
              correctCount: resData.results.filter((r: any) => r.isCorrect).length,
              timeSpent: timeStr,
              wrongQuestions,
              suggestedTopics: generatedTopics,
            })
          }
        } catch (e) {
          console.error(e)
          setResult(computeResult(answers, questions, timeStr, t))
        }
      } else {
        setResult(computeResult(answers, questions, timeStr, t))
      }
      setStep('result')
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }, [isLast, answers, questions, startTime, quizId, attemptId, t])

  if (loading || !currentQuestion) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/50" onClick={onClose}>
        <div className="bg-white dark:bg-[var(--color-surface)] rounded-2xl p-10 shadow-xl max-w-sm text-center">
          <p className="text-sm font-medium text-neutral-900">{t('ai.quiz.loading')}</p>
        </div>
      </div>
    )
  }

  if (step === 'result' && result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/50" onClick={onClose}>
        <div
          className="bg-white dark:bg-[var(--color-surface)] rounded-2xl border border-neutral-200 dark:border-neutral-600 shadow-xl w-full max-w-4xl min-h-[36rem] max-h-[95vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-shrink-0 flex items-center justify-end gap-4 px-10 py-5 border-b border-neutral-200 dark:border-neutral-600">
            <span className="px-4 py-2 rounded-lg bg-accent-muted text-accent text-xs font-semibold">
              {t('ai.quiz.timeLabel', { time: result.timeSpent })}
            </span>
            <Button variant="secondary" size="sm" className="!bg-error/10 !border-error/50 !text-error hover:!bg-error/20" onClick={onClose}>
              {t('ai.quiz.exit')}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-10 py-10">
            <h1 className="text-lg font-bold uppercase text-neutral-900 dark:text-neutral-900 text-center mb-12">
              {t('ai.quiz.analysisResults')}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50/50 dark:bg-[var(--color-surface)] p-8">
                <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-600 mb-5">
                  {t('ai.quiz.wrongQuestions')}
                </h2>
                {result.wrongQuestions.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-600">{t('ai.quiz.allCorrect')}</p>
                ) : (
                  <ul className="space-y-5">
                    {result.wrongQuestions.map((w, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="w-1 flex-shrink-0 rounded-full bg-highlight mt-0.5" aria-hidden />
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-900">{w.topic}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-600 mt-1">
                            {t('ai.quiz.wrongInQuestions', { numbers: w.questionNumbers.join(' & ') })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50/50 dark:bg-[var(--color-surface)] p-8">
                <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-600 mb-5 flex items-center gap-1.5">
                  {t('ai.quiz.suggestedTopics')}
                  <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </h2>
                <ul className="space-y-5">
                  {result.suggestedTopics.map((s, i) => (
                    <li key={i}>
                      <p className="text-xs font-medium text-neutral-900 dark:text-neutral-900 mb-1.5">{s.title}</p>
                      <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${s.percent}%` }} />
                      </div>
                      <span className="text-[10px] text-neutral-500 mt-0.5 inline-block">{s.percent}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex items-center justify-center gap-16 py-8 border-t border-neutral-200 dark:border-neutral-600">
              <div className="text-center min-w-[4rem]">
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-900">
                  {result.score}/{result.total}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-600 uppercase tracking-wide mt-1.5">{t('ai.quiz.score')}</p>
              </div>
              <div className="w-px h-12 bg-neutral-200 dark:bg-neutral-600" />
              <div className="text-center min-w-[4rem]">
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-900">
                  {String(result.correctCount).padStart(2, '0')}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-600 uppercase tracking-wide mt-1.5">{t('ai.quiz.correct')}</p>
              </div>
              <div className="w-px h-12 bg-neutral-200 dark:bg-neutral-600" />
              <div className="text-center min-w-[4rem]">
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-900">{result.timeSpent}</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-600 uppercase tracking-wide mt-1.5">{t('ai.quiz.timeSpent')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const elapsedSec = Math.floor((Date.now() - startTime) / 1000)
  const liveTime = `${String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:${String(elapsedSec % 60).padStart(2, '0')}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-[var(--color-surface)] rounded-2xl border border-neutral-200 dark:border-neutral-600 shadow-xl w-full max-w-3xl min-h-[34rem] max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-center justify-between gap-5 px-10 py-5 border-b border-neutral-200 dark:border-neutral-600">
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-900">
            {t('ai.quiz.questionProgress', { current: currentIndex + 1, total: questions.length })}
          </span>
          <div className="flex items-center gap-4">
            <span className="px-4 py-2 rounded-lg bg-accent-muted text-accent text-[11px] font-semibold">
              {t('ai.quiz.timeLabel', { time: liveTime })}
            </span>
            <Button variant="secondary" size="sm" className="!bg-error/10 !border-error/50 !text-error hover:!bg-error/20" onClick={onClose}>
              {t('ai.quiz.exit')}
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
            <p className="text-[11px] font-bold uppercase text-neutral-500 dark:text-neutral-600 mb-4">{t('ai.quiz.topicLabel')}</p>
            <p className="text-base font-bold text-neutral-900 dark:text-neutral-900 leading-snug max-w-xl mx-auto">
              &quot;{currentQuestion.question}&quot;
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-5 justify-center px-10 py-6 border-t border-neutral-200 dark:border-neutral-600 bg-white dark:bg-[var(--color-surface)]">
            {currentQuestion.options.map((opt: string, idx: number) => (
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
            {isLast ? t('ai.quiz.finish') : t('ai.quiz.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
