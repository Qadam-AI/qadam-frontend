'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Brain, Sparkles, Target, TrendingUp, CheckCircle2, XCircle,
  ChevronRight, Clock, Lightbulb, Trophy, RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

interface AdaptiveQuestion {
  id: string
  question: string
  type: 'multiple_choice' | 'short_answer' | 'code'
  options?: string[]
  difficulty: number
  concept: string
  hints: string[]
}

interface AdaptiveSessionState {
  currentQuestion: AdaptiveQuestion | null
  questionsAnswered: number
  correctCount: number
  currentDifficulty: number
  streak: number
  hints_used: number
  masteryProgress: number
}

interface AdaptiveQuestionsProps {
  userId: string
  lessonId?: string
  conceptId?: string
  onComplete?: (results: AdaptiveSessionState) => void
}

export function AdaptiveQuestions({ userId, lessonId, conceptId, onComplete }: AdaptiveQuestionsProps) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<AdaptiveSessionState>({
    currentQuestion: null,
    questionsAnswered: 0,
    correctCount: 0,
    currentDifficulty: 5,
    streak: 0,
    hints_used: 0,
    masteryProgress: 0,
  })
  const [answer, setAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [currentHintIndex, setCurrentHintIndex] = useState(0)
  const [feedback, setFeedback] = useState<{
    correct: boolean
    explanation: string
  } | null>(null)
  const [sessionComplete, setSessionComplete] = useState(false)

  // Get adaptive question
  const questionQuery = useQuery({
    queryKey: ['adaptive-question', userId, lessonId, conceptId, session.currentDifficulty],
    queryFn: async () => {
      const res = await api.post('/api/v1/llm/assessments/adaptive', {
        user_id: userId,
        lesson_id: lessonId,
        concept_id: conceptId,
        current_difficulty: session.currentDifficulty,
        history: {
          questions_answered: session.questionsAnswered,
          correct_count: session.correctCount,
          streak: session.streak,
        },
      })
      return res.data as AdaptiveQuestion
    },
    enabled: !session.currentQuestion && !sessionComplete,
    staleTime: 0,
  })

  // Update session when new question arrives
  useEffect(() => {
    if (questionQuery.data && !session.currentQuestion) {
      setSession(prev => ({
        ...prev,
        currentQuestion: questionQuery.data,
      }))
    }
  }, [questionQuery.data])

  // Submit answer
  const submitMutation = useMutation({
    mutationFn: async (userAnswer: string) => {
      const res = await api.post('/api/v1/llm/assessments/check', {
        question_id: session.currentQuestion?.id,
        answer: userAnswer,
        user_id: userId,
      })
      return res.data
    },
    onSuccess: (data) => {
      const isCorrect = data.correct

      setFeedback({
        correct: isCorrect,
        explanation: data.explanation || (isCorrect ? 'Correct!' : 'Not quite right.'),
      })

      if (isCorrect) {
        const newStreak = session.streak + 1
        if (newStreak >= 3) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          })
        }
      }

      // Update session state
      setSession(prev => {
        const newCorrect = isCorrect ? prev.correctCount + 1 : prev.correctCount
        const newStreak = isCorrect ? prev.streak + 1 : 0
        const newDifficulty = isCorrect
          ? Math.min(10, prev.currentDifficulty + (newStreak >= 2 ? 1 : 0.5))
          : Math.max(1, prev.currentDifficulty - 1)
        const newMastery = (newCorrect / (prev.questionsAnswered + 1)) * 100

        return {
          ...prev,
          questionsAnswered: prev.questionsAnswered + 1,
          correctCount: newCorrect,
          streak: newStreak,
          currentDifficulty: newDifficulty,
          masteryProgress: newMastery,
        }
      })

      queryClient.invalidateQueries({ queryKey: ['mastery', userId] })
    },
    onError: () => {
      toast.error('Failed to submit answer')
    },
  })

  const handleSubmit = () => {
    if (!session.currentQuestion) return

    const userAnswer = session.currentQuestion.type === 'multiple_choice'
      ? selectedOption
      : answer

    if (!userAnswer) {
      toast.error('Please provide an answer')
      return
    }

    submitMutation.mutate(userAnswer)
  }

  const handleNextQuestion = () => {
    // Check if session is complete (e.g., 10 questions or high mastery)
    if (session.questionsAnswered >= 10 || session.masteryProgress >= 90) {
      setSessionComplete(true)
      onComplete?.(session)
      return
    }

    // Reset for next question
    setSession(prev => ({ ...prev, currentQuestion: null }))
    setAnswer('')
    setSelectedOption(null)
    setFeedback(null)
    setShowHint(false)
    setCurrentHintIndex(0)
  }

  const useHint = () => {
    if (!session.currentQuestion) return

    setShowHint(true)
    if (currentHintIndex < session.currentQuestion.hints.length - 1) {
      setCurrentHintIndex(prev => prev + 1)
    }
    setSession(prev => ({ ...prev, hints_used: prev.hints_used + 1 }))
  }

  const restartSession = () => {
    setSession({
      currentQuestion: null,
      questionsAnswered: 0,
      correctCount: 0,
      currentDifficulty: 5,
      streak: 0,
      hints_used: 0,
      masteryProgress: 0,
    })
    setSessionComplete(false)
    setFeedback(null)
    setAnswer('')
    setSelectedOption(null)
  }

  // Session complete view
  if (sessionComplete) {
    const grade = session.correctCount / session.questionsAnswered * 100

    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
          </motion.div>

          <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
          <p className="text-muted-foreground mb-6">
            Great work on your adaptive practice session
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600">{session.correctCount}/{session.questionsAnswered}</p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <p className="text-2xl font-bold text-blue-600">{Math.round(grade)}%</p>
              <p className="text-sm text-muted-foreground">Score</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <p className="text-2xl font-bold text-purple-600">{session.streak}</p>
              <p className="text-sm text-muted-foreground">Best Streak</p>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={restartSession}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Practice Again
            </Button>
            <Button onClick={() => onComplete?.(session)}>
              Continue Learning
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (questionQuery.isLoading || !session.currentQuestion) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-6" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const question = session.currentQuestion

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium">Adaptive Practice</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1">
              <Target className="h-3 w-3" />
              {session.questionsAnswered + 1}/10
            </Badge>
            {session.streak >= 2 && (
              <Badge className="gap-1 bg-orange-500">
                🔥 {session.streak} streak
              </Badge>
            )}
          </div>
        </div>

        <Progress value={(session.questionsAnswered / 10) * 100} className="h-2" />

        {/* Difficulty and concept */}
        <div className="flex items-center justify-between mt-4">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            {question.concept}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Difficulty: {Math.round(session.currentDifficulty)}/10
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question */}
        <div>
          <h3 className="text-lg font-medium mb-4">{question.question}</h3>

          {/* Multiple choice */}
          {question.type === 'multiple_choice' && question.options && (
            <RadioGroup
              value={selectedOption || ''}
              onValueChange={setSelectedOption}
              disabled={!!feedback}
            >
              <div className="space-y-3">
                {question.options.map((option, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Label
                      htmlFor={`option-${idx}`}
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        feedback
                          ? option === selectedOption
                            ? feedback.correct
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'opacity-50'
                          : selectedOption === option
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <RadioGroupItem value={option} id={`option-${idx}`} />
                      <span>{option}</span>
                    </Label>
                  </motion.div>
                ))}
              </div>
            </RadioGroup>
          )}

          {/* Short answer / Code */}
          {(question.type === 'short_answer' || question.type === 'code') && (
            <Textarea
              placeholder={question.type === 'code' ? 'Write your code here...' : 'Type your answer...'}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={question.type === 'code' ? 8 : 4}
              className={question.type === 'code' ? 'font-mono' : ''}
              disabled={!!feedback}
            />
          )}
        </div>

        {/* Hint */}
        {showHint && question.hints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
          >
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-300 mb-1">
                  Hint {currentHintIndex + 1}
                </p>
                <p className="text-amber-600 dark:text-amber-400">
                  {question.hints[currentHintIndex]}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-lg ${
                feedback.correct
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {feedback.correct ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${
                    feedback.correct
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {feedback.correct ? 'Correct!' : 'Not quite right'}
                  </p>
                  <p className={
                    feedback.correct
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }>
                    {feedback.explanation}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="flex justify-between">
        {!feedback && question.hints.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={useHint}
            disabled={currentHintIndex >= question.hints.length - 1 && showHint}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            {showHint ? 'Next Hint' : 'Get Hint'}
          </Button>
        )}
        {feedback && <div />}

        {feedback ? (
          <Button onClick={handleNextQuestion}>
            Next Question
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || (!answer && !selectedOption)}
          >
            {submitMutation.isPending ? 'Checking...' : 'Submit Answer'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default AdaptiveQuestions
