'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Brain, Sparkles, Calendar, Clock, RotateCcw,
  CheckCircle2, XCircle, Eye, EyeOff, Lightbulb,
  ChevronRight, Target, TrendingUp, Zap, BookOpen
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface ReviewItem {
  id: string
  question: string
  answer: string
  hint?: string
  tags: string[]
  ease_factor: number
  interval: number
  repetitions: number
  next_review: string
  is_due: boolean
  days_overdue?: number
}

interface DueItemsResponse {
  count: number
  items: {
    id: string
    question: string
    hint?: string
    tags: string[]
    days_overdue: number
  }[]
}

interface StudySchedule {
  due_today: number
  due_this_week: number
  new_items: number
  total_reviews: number
  average_retention: number
  items_by_date: Record<string, number>
}

interface QualityLevel {
  value: number
  name: string
  description: string
  color: string
  icon: React.ReactNode
}

const QUALITY_LEVELS: QualityLevel[] = [
  { value: 0, name: 'Forgot', description: 'Complete failure', color: 'bg-red-500', icon: <XCircle className="h-5 w-5" /> },
  { value: 1, name: 'Almost', description: 'Wrong, remembered after', color: 'bg-orange-500', icon: <XCircle className="h-5 w-5" /> },
  { value: 2, name: 'Hard', description: 'Wrong, seemed easy', color: 'bg-yellow-500', icon: <Target className="h-5 w-5" /> },
  { value: 3, name: 'Good', description: 'Correct with difficulty', color: 'bg-blue-500', icon: <CheckCircle2 className="h-5 w-5" /> },
  { value: 4, name: 'Easy', description: 'Correct with hesitation', color: 'bg-green-400', icon: <CheckCircle2 className="h-5 w-5" /> },
  { value: 5, name: 'Perfect', description: 'Perfect recall', color: 'bg-green-500', icon: <Zap className="h-5 w-5" /> },
]

export default function SpacedRepetitionPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0, incorrect: 0 })
  const [startTime, setStartTime] = useState<Date | null>(null)

  // Fetch due items
  const { data: dueItems, isLoading: loadingItems, refetch: refetchDue } = useQuery({
    queryKey: ['review-due-items', user?.id],
    queryFn: async () => {
      const res = await api.get<DueItemsResponse>(`/api/v1/llm/spaced-repetition/items/due/${user?.id}?limit=50`)
      return res.data
    },
    enabled: !!user?.id,
  })

  // Fetch schedule
  const { data: schedule, isLoading: loadingSchedule } = useQuery({
    queryKey: ['review-schedule', user?.id],
    queryFn: async () => {
      const res = await api.get<StudySchedule>(`/api/v1/llm/spaced-repetition/schedule/${user?.id}`)
      return res.data
    },
    enabled: !!user?.id,
  })

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ itemId, quality }: { itemId: string, quality: number }) => {
      const responseTime = startTime ? (new Date().getTime() - startTime.getTime()) / 1000 : 0
      const res = await api.post('/api/v1/llm/spaced-repetition/review', {
        item_id: itemId,
        quality,
        response_time_seconds: responseTime,
      })
      return res.data
    },
    onSuccess: (data, variables) => {
      const wasCorrect = variables.quality >= 3
      setSessionStats(prev => ({
        reviewed: prev.reviewed + 1,
        correct: wasCorrect ? prev.correct + 1 : prev.correct,
        incorrect: wasCorrect ? prev.incorrect : prev.incorrect + 1,
      }))
      
      // Move to next card
      if (currentIndex < (dueItems?.items.length || 0) - 1) {
        setCurrentIndex(prev => prev + 1)
        setShowAnswer(false)
        setStartTime(new Date())
      } else {
        // Session complete
        toast.success(`Session complete! Reviewed ${sessionStats.reviewed + 1} items`)
        queryClient.invalidateQueries({ queryKey: ['review-due-items'] })
        queryClient.invalidateQueries({ queryKey: ['review-schedule'] })
      }
    },
    onError: () => {
      toast.error('Failed to record review')
    },
  })

  // Start timer when showing new card
  useEffect(() => {
    if (dueItems?.items.length && !startTime) {
      setStartTime(new Date())
    }
  }, [dueItems])

  const currentItem = dueItems?.items[currentIndex]
  const isSessionComplete = currentIndex >= (dueItems?.items.length || 0) || !dueItems?.items.length

  const handleQualitySelect = (quality: number) => {
    if (!currentItem) return
    reviewMutation.mutate({ itemId: currentItem.id, quality })
  }

  const handleRevealAnswer = () => {
    setShowAnswer(true)
  }

  const handleStartSession = () => {
    setCurrentIndex(0)
    setShowAnswer(false)
    setSessionStats({ reviewed: 0, correct: 0, incorrect: 0 })
    setStartTime(new Date())
    refetchDue()
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-8 text-white"
      >
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-6 w-6" />
            <span className="text-lg font-medium text-white/80">Spaced Repetition</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Review & Remember 🧠
          </h1>
          <p className="text-white/80 text-lg max-w-2xl">
            Use the power of spaced repetition to strengthen your memory and master concepts.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-violet-400/20 blur-3xl" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Review Area */}
        <div className="lg:col-span-2 space-y-6">
          {loadingItems ? (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center gap-4">
                  <Skeleton className="h-32 w-full max-w-md" />
                  <Skeleton className="h-8 w-48" />
                </div>
              </CardContent>
            </Card>
          ) : isSessionComplete ? (
            /* Session Complete or No Items */
            <Card>
              <CardContent className="py-16 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {sessionStats.reviewed > 0 ? (
                    <>
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Session Complete! 🎉</h2>
                      <p className="text-muted-foreground mb-6">
                        You reviewed {sessionStats.reviewed} items with {Math.round((sessionStats.correct / sessionStats.reviewed) * 100)}% accuracy!
                      </p>
                      <div className="flex justify-center gap-4 mb-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-green-500">{sessionStats.correct}</p>
                          <p className="text-sm text-muted-foreground">Correct</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-red-500">{sessionStats.incorrect}</p>
                          <p className="text-sm text-muted-foreground">Need Review</p>
                        </div>
                      </div>
                      <Button onClick={handleStartSession} size="lg" className="gap-2">
                        <RotateCcw className="h-5 w-5" />
                        Start New Session
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Sparkles className="h-12 w-12 text-purple-500" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">All Caught Up! ✨</h2>
                      <p className="text-muted-foreground mb-6">
                        No items due for review right now. Great job staying on top of your studies!
                      </p>
                      <div className="flex justify-center gap-4">
                        <Link href="/study-guides">
                          <Button variant="outline" className="gap-2">
                            <BookOpen className="h-5 w-5" />
                            Generate Study Guide
                          </Button>
                        </Link>
                        <Link href="/courses">
                          <Button className="gap-2">
                            <ChevronRight className="h-5 w-5" />
                            Continue Learning
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
                </motion.div>
              </CardContent>
            </Card>
          ) : (
            /* Flashcard Review */
            <>
              {/* Progress */}
              <div className="flex items-center gap-4">
                <Progress 
                  value={(currentIndex / (dueItems?.items.length || 1)) * 100} 
                  className="flex-1 h-2"
                />
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} / {dueItems?.items.length}
                </span>
              </div>

              {/* Flashcard */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentItem?.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="min-h-[400px] flex flex-col">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Question</CardTitle>
                        <div className="flex gap-2">
                          {currentItem?.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                          {currentItem?.days_overdue && currentItem.days_overdue > 0 && (
                            <Badge variant="destructive">{currentItem.days_overdue}d overdue</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      {/* Question */}
                      <div className="flex-1 flex items-center justify-center p-8">
                        <p className="text-xl text-center">{currentItem?.question}</p>
                      </div>

                      {/* Hint */}
                      {currentItem?.hint && !showAnswer && (
                        <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
                            <p className="text-sm text-amber-800 dark:text-amber-200">{currentItem.hint}</p>
                          </div>
                        </div>
                      )}

                      {/* Answer (hidden until revealed) */}
                      {showAnswer ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 p-6 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                        >
                          <p className="text-lg font-medium text-center text-green-800 dark:text-green-200">
                            {/* Answer would be fetched separately when revealed */}
                            Answer will be shown here
                          </p>
                        </motion.div>
                      ) : (
                        <Button 
                          onClick={handleRevealAnswer}
                          size="lg" 
                          className="mt-6 gap-2"
                        >
                          <Eye className="h-5 w-5" />
                          Show Answer
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {/* Quality Buttons (only show after answer revealed) */}
              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-center">How well did you remember?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {QUALITY_LEVELS.map((level) => (
                          <Button
                            key={level.value}
                            variant="outline"
                            onClick={() => handleQualitySelect(level.value)}
                            disabled={reviewMutation.isPending}
                            className={`flex flex-col h-auto py-3 hover:${level.color} hover:text-white transition-colors`}
                          >
                            <span className={`mb-1 ${level.value >= 3 ? 'text-green-500' : level.value >= 2 ? 'text-yellow-500' : 'text-red-500'}`}>
                              {level.icon}
                            </span>
                            <span className="font-medium text-sm">{level.name}</span>
                            <span className="text-xs text-muted-foreground hidden md:block">{level.description}</span>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Sidebar - Stats & Schedule */}
        <div className="space-y-6">
          {/* Today's Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSchedule ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : schedule ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <span className="text-sm font-medium">Due Today</span>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {schedule.due_today}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Due This Week</span>
                    <span className="font-medium">{schedule.due_this_week}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">New Items</span>
                    <span className="font-medium">{schedule.new_items}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Total Reviews</span>
                    <span className="font-medium">{schedule.total_reviews}</span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Retention Rate</span>
                      <span className="font-bold text-green-500">
                        {Math.round(schedule.average_retention * 100)}%
                      </span>
                    </div>
                    <Progress value={schedule.average_retention * 100} className="h-2" />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No schedule data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Session Stats */}
          {sessionStats.reviewed > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Session Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{sessionStats.reviewed}</p>
                      <p className="text-xs text-muted-foreground">Reviewed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-500">{sessionStats.correct}</p>
                      <p className="text-xs text-muted-foreground">Correct</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-500">{sessionStats.incorrect}</p>
                      <p className="text-xs text-muted-foreground">Incorrect</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/study-guides">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  Generate Study Guide
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  View Analytics
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  Leaderboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
