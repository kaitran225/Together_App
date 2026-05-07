/** AI domain: quizlet cards, chats, messages, summary history, quiz questions */

export const MOCK_QUIZLET_CARDS = [
  { id: '1', title: 'Compare Gradient Descent and Adam', subtitle: 'Optimization basics' },
  { id: '2', title: 'Neural Networks & Backprop', subtitle: 'Deep learning fundamentals' },
  { id: '3', title: 'Optimization algorithms', subtitle: 'SGD, Adam, RMSprop' },
]

export const MOCK_SETS = [
  { id: '1', title: 'Compare Gradient Descent and Adam', subtitle: 'Optimization basics' },
  { id: '2', title: 'Neural Networks & Backprop', subtitle: 'Deep learning fundamentals' },
]

export const SIDEBAR_CHATS = [
  { id: '1', title: 'Intro to Quantum Physics', active: true, time: 'Today' },
  { id: '2', title: 'History Exam Prep', active: false, time: 'Today' },
  { id: '3', title: 'Python Lists Help', active: false, time: 'Yesterday' },
  { id: '4', title: 'Essay Outline Gen', active: false, time: 'Yesterday' },
]

export const AI_SUPPORT_MESSAGES = [
  { id: '1', role: 'assistant' as const, text: "Hello! I'm your Premium AI Tutor. How can I help you with your studies today? You can ask for explanations, summaries, or practice questions.", time: '10:02' },
  { id: '2', role: 'user' as const, text: 'Can you explain wave-particle duality in simple terms?', time: '10:03' },
  { id: '3', role: 'assistant' as const, text: "Sure. Wave-particle duality means that light (and matter like electrons) sometimes behaves like a wave and sometimes like a particle, depending on how we measure it. Think of it as one thing showing two different 'faces' in different experiments.", time: '10:04' },
]

export const MEET_AI_MESSAGES = [
  { id: '1', role: 'assistant' as const, text: "Hello! I'm your Premium AI Tutor. How can I help you with your studies today?", time: '10:02' },
  { id: '2', role: 'user' as const, text: 'Can you explain wave-particle duality?', time: '10:03' },
  { id: '3', role: 'assistant' as const, text: "Wave-particle duality means light and matter can behave like a wave or a particle depending on how we measure them.", time: '10:04' },
]

export const SUMMARY_HISTORY = [
  { id: '1', name: 'Quantum_Computing.pdf', time: '2 Hours Ago' },
  { id: '2', name: 'History_of_Rome.pdf', time: 'Yesterday' },
  { id: '3', name: 'Bio_101_Chapter_4.pdf', time: '3 Days Ago' },
]

export const QUICK_PROMPTS = [
  'Explain this concept in simple terms',
  'Summarize my notes',
  'Generate practice questions',
  'Help me with problem solving',
]

export const RECENT_CHATS = [
  { id: '1', title: 'Intro to Quantum Physics', preview: 'Wave-particle duality...', time: '2h ago' },
  { id: '2', title: 'Calculus Chain Rule', preview: 'Derivative of composite...', time: 'Yesterday' },
  { id: '3', title: 'Essay Outline Help', preview: 'Thesis and three main...', time: '2 days ago' },
]

export const MOCK_RESULT = {
  score: 7,
  total: 10,
  correctCount: 7,
  timeSpent: '01:45',
  wrongQuestions: [
    { topic: 'Compare Gradient Descent and Adam', questionNumbers: [3, 5] },
  ],
  suggestedTopics: [
    { title: 'Optimization algorithms', percent: 45 },
    { title: 'Optimization algorithms', percent: 62 },
    { title: 'Optimization algorithms', percent: 78 },
  ],
}

export type QuizQuestion = {
  id: number
  question: string
  options: string[]
  correctIndex: number
}

export const MOCK_QUESTIONS: QuizQuestion[] = [
  { id: 1, question: 'Back propagation is primarily used to calculate the gradient of the loss function with respect to the weights.', options: ['True', 'False'], correctIndex: 0 },
  { id: 2, question: 'Gradient descent always converges to the global minimum in neural network training.', options: ['True', 'False'], correctIndex: 1 },
  { id: 3, question: 'Adam optimizer combines the benefits of Momentum and RMSprop.', options: ['True', 'False'], correctIndex: 0 },
  { id: 4, question: 'Learning rate has no effect on convergence speed.', options: ['True', 'False'], correctIndex: 1 },
  { id: 5, question: 'SGD with momentum can help escape shallow local minima.', options: ['True', 'False'], correctIndex: 0 },
  { id: 6, question: 'Batch normalization is applied before the activation function.', options: ['True', 'False'], correctIndex: 1 },
  { id: 7, question: 'Dropout is used during training to prevent overfitting.', options: ['True', 'False'], correctIndex: 0 },
  { id: 8, question: 'ReLU can cause "dying ReLU" when neurons output zero for all inputs.', options: ['True', 'False'], correctIndex: 0 },
  { id: 9, question: 'The chain rule is not used in backpropagation.', options: ['True', 'False'], correctIndex: 1 },
  { id: 10, question: 'Optimization algorithms like Adam adapt the learning rate per parameter.', options: ['True', 'False'], correctIndex: 0 },
]

export const MAX_FILE_SIZE_MB = 10
export const ACCEPT_FILES = '.pdf,.doc,.docx,.txt,.md,image/*'
export const MAX_PDF_MB = 25
