import { useState, useEffect } from 'react'
import { Button, Card, QuizletQuizModal } from '../../../components/common'
import { MOCK_SETS } from '../../../mocks'
import { workflowApi } from '../../../api/client'

export default function Quizlet() {
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState<number | undefined>(undefined)
  const [quizSets, setQuizSets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchQuizSets = () => {
    setLoading(true)
    workflowApi.getQuizSets()
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setQuizSets(res.data)
        } else {
          setQuizSets(MOCK_SETS.map(s => ({
            quizId: parseInt(s.id),
            title: s.title,
            description: s.subtitle,
            difficulty: 'EASY',
            questionCount: 10,
            isMock: true
          })))
        }
      })
      .catch((err) => {
        console.error(err)
        setQuizSets(MOCK_SETS.map(s => ({
          quizId: parseInt(s.id),
          title: s.title,
          description: s.subtitle,
          difficulty: 'EASY',
          questionCount: 10,
          isMock: true
        })))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchQuizSets()
  }, [])

  const startQuiz = (quiz: any) => {
    if (quiz.isMock) {
      setSelectedQuizId(undefined)
    } else {
      setSelectedQuizId(quiz.quizId)
    }
    setShowQuizModal(true)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold uppercase text-neutral-900">Quizlet</h1>
      <p className="text-sm text-neutral-500">Choose a set and do the quiz.</p>
      
      {loading ? (
        <div className="text-center py-8 text-neutral-500 text-sm">Loading quiz sets...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quizSets.map((set) => (
            <Card key={set.quizId} className="p-4 flex flex-col min-h-[10rem]">
              <div className="flex-1 min-h-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-neutral-900">{set.title}</p>
                  {set.isMock && (
                    <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded font-semibold uppercase">Mock</span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-1">{set.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[10px] bg-accent-muted text-primary px-2 py-0.5 rounded-full font-semibold uppercase">
                    {set.difficulty || 'MEDIUM'}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {set.questionCount} questions
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 pt-3 mt-auto">
                <Button variant="primary" size="sm" className="w-full" onClick={() => startQuiz(set)}>
                  Do the quiz
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {showQuizModal && (
        <QuizletQuizModal 
          quizId={selectedQuizId} 
          onClose={() => {
            setShowQuizModal(false)
            fetchQuizSets()
          }} 
        />
      )}
    </div>
  )
}
