'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  Trophy,
  AlertCircle,
  Loader2,
  Lightbulb,
  RotateCcw,
  Home,
  Target,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import confetti from 'canvas-confetti'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qadam-backend-production.up.railway.app/api/v1'

interface Question {
  id: string
  question_type: string
  question_text: string
  options: Array<{ id: string; text: string; is_correct?: boolean }> | null
  difficulty: number
  hints: string[] | null
}

interface QuestionResponse {
  finished: boolean
  message?: string
  question?: Question
  progress: {
    answered: number
    total: number
    correct: number
  }
}

interface AnswerResponse {
  is_correct: boolean
  correct_answer: string | null
  explanation: string | null
  new_difficulty: number
  streak: number
  questions_answered: number
  questions_correct: number
  progress: {
    answered: number
    total: number
    correct: number
  }
}

interface SessionSummary {
  session_id: string
  guest_name: string
  questions_answered: number
  questions_correct: number
  accuracy: number
  max_streak: number
  total_time_seconds: number | null
}

export default function PracticeSessionPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [guestName, setGuestName] = useState<string>('')
  const [totalQuestions, setTotalQuestions] = useState(10)
  const [timeLimit, setTimeLimit] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [shortAnswer, setShortAnswer] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastAnswer, setLastAnswer] = useState<AnswerResponse | null>(null)
  const [progress, setProgress] = useState({ answered: 0, total: 10, correct: 0 })
  const [sessionComplete, setSessionComplete] = useState(false)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null)
  const [hintsRevealed, setHintsRevealed] = useState(0)

  // Initialize from localStorage
  useEffect(() => {
    const token = localStorage.getItem('practice_session_token')
    const sid = localStorage.getItem('practice_session_id')
    const name = localStorage.getItem('practice_guest_name')
    const count = localStorage.getItem('practice_questions_count')
    const limit = localStorage.getItem('practice_time_limit')

    if (!token || !sid) {
      router.push(`/practice/${code}`)
      return
    }

    setSessionToken(token)
    setSessionId(sid)
    setGuestName(name || 'Student')
    setTotalQuestions(count ? parseInt(count) : 10)
    setTimeLimit(limit ? parseInt(limit) * 60 : null)
    setTimeRemaining(limit ? parseInt(limit) * 60 : null)
    setStartTime(new Date())
    setProgress(p => ({ ...p, total: count ? parseInt(count) : 10 }))
  }, [code, router])

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || sessionComplete) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Time's up - end session
          endSessionMutation.mutate()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining, sessionComplete])

  // Fetch next question
  const fetchNextQuestion = useCallback(async () => {
    if (!sessionToken || !sessionId) return null
    
    const response = await axios.get<QuestionResponse>(
      `${API_BASE}/practice/guest/session/${sessionId}/next-question`,
      { headers: { 'X-Session-Token': sessionToken } }
    )
    return response.data
  }, [sessionToken, sessionId])

  const { data: questionData, refetch: refetchQuestion, isLoading: loadingQuestion } = useQuery({
    queryKey: ['practice-question', sessionId],
    queryFn: fetchNextQuestion,
    enabled: !!sessionToken && !!sessionId && !sessionComplete,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
    retry: 1,
  })

  // Handle question data changes
  useEffect(() => {
    if (questionData?.finished) {
      setSessionComplete(true)
      endSessionMutation.mutate()
    } else if (questionData?.question) {
      setCurrentQuestion(questionData.question)
      setProgress(questionData.progress)
      setQuestionStartTime(new Date())
      setHintsRevealed(0)
    }
  }, [questionData])

  // Submit answer mutation
  const answerMutation = useMutation<AnswerResponse, Error, { questionId: string; answer: string }>({
    mutationFn: async ({ questionId, answer }) => {
      const timeTaken = questionStartTime 
        ? Math.round((new Date().getTime() - questionStartTime.getTime()) / 1000)
        : undefined

      const response = await axios.post<AnswerResponse>(
        `${API_BASE}/practice/guest/session/${sessionId}/answer`,
        {
          question_id: questionId,
          answer: answer,
          time_taken_seconds: timeTaken,
          hints_used: hintsRevealed
        },
        { headers: { 'X-Session-Token': sessionToken } }
      )
      return response.data
    },
    onSuccess: (data) => {
      setLastAnswer(data)
      setShowFeedback(true)
      setProgress(data.progress)

      // Celebration on correct
      if (data.is_correct) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        })
      }
    },
  })

  // End session mutation
  const endSessionMutation = useMutation<SessionSummary, Error>({
    mutationFn: async () => {
      const response = await axios.post<SessionSummary>(
        `${API_BASE}/practice/guest/session/${sessionId}/end`,
        {},
        { headers: { 'X-Session-Token': sessionToken } }
      )
      return response.data
    },
    onSuccess: (data) => {
      setSummary(data)
      setSessionComplete(true)

      // Big celebration for good performance
      if (data.accuracy >= 0.7) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      }

      // Clear localStorage
      localStorage.removeItem('practice_session_token')
      localStorage.removeItem('practice_session_id')
      localStorage.removeItem('practice_guest_name')
      localStorage.removeItem('practice_questions_count')
      localStorage.removeItem('practice_time_limit')
    },
  })

  const handleSubmitAnswer = () => {
    if (!currentQuestion) return
    
    const answer = currentQuestion.question_type === 'multiple_choice'
      ? selectedAnswer
      : shortAnswer.trim()
    
    if (!answer) return
    
    answerMutation.mutate({ 
      questionId: currentQuestion.id, 
      answer 
    })
  }

  const handleNextQuestion = () => {
    setShowFeedback(false)
    setSelectedAnswer('')
    setShortAnswer('')
    setLastAnswer(null)
    setCurrentQuestion(null)
    refetchQuestion()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Loading state
  if (!sessionToken || !sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Session complete / Summary
  if (sessionComplete && summary) {
    const percentCorrect = Math.round(summary.accuracy * 100)
    const grade = percentCorrect >= 90 ? 'A' : percentCorrect >= 80 ? 'B' : percentCorrect >= 70 ? 'C' : percentCorrect >= 60 ? 'D' : 'F'
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-lg">
            <CardHeader className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
                  percentCorrect >= 70 ? 'bg-green-500/10' : 'bg-yellow-500/10'
                }`}
              >
                <Trophy className={`h-10 w-10 ${
                  percentCorrect >= 70 ? 'text-green-500' : 'text-yellow-500'
                }`} />
              </motion.div>
              <div>
                <CardTitle className="text-2xl">Practice Complete!</CardTitle>
                <CardDescription className="mt-1">
                  Great work, {summary.guest_name}!
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Score */}
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">{percentCorrect}%</div>
                <Badge variant={percentCorrect >= 70 ? 'default' : 'secondary'} className="text-lg px-4 py-1">
                  Grade: {grade}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{summary.questions_correct}/{summary.questions_answered}</div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{summary.max_streak}</div>
                  <div className="text-sm text-muted-foreground">Best Streak</div>
                </div>
              </div>

              {summary.total_time_seconds && (
                <div className="text-center text-muted-foreground">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Completed in {formatTime(summary.total_time_seconds)}
                </div>
              )}

              {/* Encouragement */}
              <div className={`p-4 rounded-lg text-center ${
                percentCorrect >= 70 ? 'bg-green-500/10' : 'bg-yellow-500/10'
              }`}>
                <p className="font-medium">
                  {percentCorrect >= 90 ? '🌟 Outstanding! You mastered this topic!' :
                   percentCorrect >= 70 ? '👏 Well done! Keep up the great work!' :
                   percentCorrect >= 50 ? '💪 Good effort! Review and try again!' :
                   '📚 Keep practicing! You\'ll get better!'}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button 
                  className="w-full gap-2" 
                  onClick={() => router.push(`/practice/${code}`)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Try Again with New Questions
                </Button>
                <p className="text-xs text-center text-muted-foreground pt-1">
                  Your score has been recorded. Great effort!
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Question UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-semibold text-lg">{guestName}&apos;s Practice</h1>
            <p className="text-sm text-muted-foreground">
              Question {progress.answered + 1} of {progress.total}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              {progress.correct} correct
            </Badge>
            {timeRemaining !== null && (
              <Badge 
                variant={timeRemaining < 60 ? 'destructive' : 'secondary'} 
                className="gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                {formatTime(timeRemaining)}
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Progress bar */}
        <Progress value={(progress.answered / progress.total) * 100} className="h-2" />

        {/* Question Card */}
        <AnimatePresence mode="wait">
          {loadingQuestion || !currentQuestion ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading next question...</p>
            </motion.div>
          ) : showFeedback ? (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className={`border-2 ${
                lastAnswer?.is_correct ? 'border-green-500' : 'border-destructive'
              }`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {lastAnswer?.is_correct ? (
                      <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                        <XCircle className="h-6 w-6 text-destructive" />
                      </div>
                    )}
                    <div>
                      <CardTitle className={lastAnswer?.is_correct ? 'text-green-500' : 'text-destructive'}>
                        {lastAnswer?.is_correct ? 'Correct!' : 'Incorrect'}
                      </CardTitle>
                      {!lastAnswer?.is_correct && lastAnswer?.correct_answer && (
                        <CardDescription>
                          Correct answer: <span className="font-medium text-foreground">{lastAnswer.correct_answer}</span>
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {lastAnswer?.explanation && (
                  <CardContent>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">Explanation</p>
                          <p className="text-sm text-muted-foreground">{lastAnswer.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}

                <CardContent className="pt-0">
                  <Button onClick={handleNextQuestion} className="w-full gap-2">
                    {progress.answered >= progress.total ? (
                      <>
                        See Results
                        <Trophy className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Next Question
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg leading-relaxed">
                      {currentQuestion.question_text}
                    </CardTitle>
                    <Badge variant="outline" className="shrink-0">
                      {currentQuestion.difficulty <= 3 ? 'Easy' : 
                       currentQuestion.difficulty <= 6 ? 'Medium' : 'Hard'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Multiple Choice */}
                  {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                    <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                      <div className="space-y-3">
                        {currentQuestion.options.map((option, idx) => (
                          <motion.div
                            key={option.id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <Label
                              htmlFor={option.id || String(idx)}
                              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedAnswer === (option.id || option.text)
                                  ? 'border-primary bg-primary/5'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <RadioGroupItem 
                                value={option.id || option.text} 
                                id={option.id || String(idx)} 
                              />
                              <span>{option.text}</span>
                            </Label>
                          </motion.div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}

                  {/* Short Answer */}
                  {currentQuestion.question_type !== 'multiple_choice' && (
                    <div className="space-y-2">
                      <Label htmlFor="answer">Your Answer</Label>
                      <Input
                        id="answer"
                        value={shortAnswer}
                        onChange={(e) => setShortAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        className="text-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && shortAnswer.trim()) {
                            handleSubmitAnswer()
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Hints */}
                  {currentQuestion.hints && currentQuestion.hints.length > 0 && hintsRevealed < currentQuestion.hints.length && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHintsRevealed(h => h + 1)}
                      className="gap-2"
                    >
                      <Lightbulb className="h-4 w-4" />
                      Show Hint ({currentQuestion.hints.length - hintsRevealed} left)
                    </Button>
                  )}

                  {currentQuestion.hints && hintsRevealed > 0 && (
                    <div className="space-y-2">
                      {currentQuestion.hints.slice(0, hintsRevealed).map((hint, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm"
                        >
                          <Lightbulb className="h-4 w-4 text-yellow-500 inline mr-2" />
                          {hint}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Submit */}
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={
                      answerMutation.isPending ||
                      (currentQuestion.question_type === 'multiple_choice' && !selectedAnswer) ||
                      (currentQuestion.question_type !== 'multiple_choice' && !shortAnswer.trim())
                    }
                    className="w-full gap-2"
                    size="lg"
                  >
                    {answerMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Submit Answer
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
