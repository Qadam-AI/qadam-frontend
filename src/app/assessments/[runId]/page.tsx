'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, ArrowRight, Clock, CheckCircle2, AlertTriangle,
  FileText, Send
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Navbar } from '../../_components/navbar'
import { Sidebar } from '../../_components/sidebar'
import { AuthGuard } from '../../_components/auth-guard'

// Design System
import { PageShell, Stack } from '@/design-system/layout'
import { SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'
import { ModalLayout } from '@/design-system/patterns/modal-layout'

interface QuestionData {
  question_id: string
  type: string
  points: number
  concept_id?: string
  order: number
}

interface QuestionDetail {
  id: string
  question_text: string
  question_type: string
  options?: Array<{ id: string; text: string }>
  correct_answer?: string
}

interface StartResponse {
  attempt_id: string
  variant_id: string
  status: string
  started_at?: string
  questions: QuestionData[]
  time_limit_seconds?: number
}

function AssessmentTakingContent() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const runId = params.runId as string

  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  // Fetch run info
  const { data: runInfo, isLoading: runLoading } = useQuery({
    queryKey: ['student-assessment', runId],
    queryFn: async () => {
      const res = await api.get(`/student/assessments/${runId}`)
      return res.data
    }
  })

  // Start attempt
  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<StartResponse>(`/student/assessments/${runId}/start`)
      return res.data
    },
    onSuccess: (data) => {
      setAttemptId(data.attempt_id)
      if (data.time_limit_seconds) {
        setTimeRemaining(data.time_limit_seconds)
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to start assessment')
    }
  })

  // Fetch questions
  const { data: questionsData } = useQuery({
    queryKey: ['attempt-questions', attemptId],
    queryFn: async () => {
      if (!attemptId) return null
      const startData = startMutation.data!
      
      // Fetch full question details
      const questions = await Promise.all(
        startData.questions.map(async (q) => {
          const res = await api.get<QuestionDetail>(`/question-pool/${q.question_id}`)
          return { ...res.data, ...q }
        })
      )
      return questions
    },
    enabled: !!attemptId && !!startMutation.data
  })

  // Save answer (auto-save)
  const saveMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: any }) => {
      if (!attemptId) return
      await api.post(`/student/assessments/attempts/${attemptId}/save`, {
        question_id: questionId,
        question_type: questionsData?.[currentQuestionIndex]?.question_type || 'mcq',
        answer_json: answer,
        max_score: questionsData?.[currentQuestionIndex]?.points || 1
      })
    }
  })

  // Submit attempt
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!attemptId) return
      await api.post(`/student/assessments/attempts/${attemptId}/submit`)
    },
    onSuccess: () => {
      toast.success('Assessment submitted successfully!')
      router.push(`/assessments/${runId}/result`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit')
    }
  })

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(interval)
          // Auto-submit when time runs out
          if (attemptId) {
            submitMutation.mutate()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining, attemptId])

  // Auto-save on answer change (debounced)
  useEffect(() => {
    if (!questionsData || currentQuestionIndex >= questionsData.length) return
    
    const currentQuestion = questionsData[currentQuestionIndex]
    const answer = answers[currentQuestion.question_id]
    
    if (!answer) return

    const timer = setTimeout(() => {
      saveMutation.mutate({
        questionId: currentQuestion.question_id,
        answer
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [answers, currentQuestionIndex, questionsData])

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const goToNext = () => {
    if (questionsData && currentQuestionIndex < questionsData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const goToPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = () => {
    const unanswered = questionsData?.filter(q => !answers[q.question_id]).length || 0
    if (unanswered > 0) {
      setShowSubmitConfirm(true)
    } else {
      submitMutation.mutate()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (runLoading) {
    return (
      <PageShell maxWidth="2xl">
        <LoadingState message="Loading assessment..." />
      </PageShell>
    )
  }

  // Show rules/start screen if not started
  if (!attemptId) {
    return (
      <PageShell maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <Heading level={1} className="mb-2">
              {runInfo?.template?.title || 'Assessment'}
            </Heading>
            {runInfo?.template?.description && (
              <Text variant="muted">{runInfo.template.description}</Text>
            )}
          </div>

          <SurfaceCard variant="elevated">
            <Stack gap="md">
              <Heading level={3}>Assessment Rules</Heading>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <Text className="font-medium">Questions</Text>
                    <Text variant="muted">{runInfo?.template?.question_count || 0} questions</Text>
                  </div>
                </div>

                {runInfo?.duration_minutes && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <Text className="font-medium">Time Limit</Text>
                      <Text variant="muted">{runInfo.duration_minutes} minutes</Text>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <Text className="font-medium">Question Types</Text>
                    <Text variant="muted">
                      {runInfo?.template?.allowed_question_types?.join(', ') || 'Multiple choice'}
                    </Text>
                  </div>
                </div>

                {runInfo?.template?.show_results_mode && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <Text className="font-medium">Results</Text>
                      <Text variant="muted">
                        {runInfo.template.show_results_mode === 'immediate' ? 'Available immediately after submission' :
                         runInfo.template.show_results_mode === 'after_close' ? 'Available after assessment closes' :
                         'Released manually by instructor'}
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </Stack>
          </SurfaceCard>

          <InfoPanel icon={AlertTriangle} title="Before You Start" variant="warning">
            <ul className="text-sm space-y-1">
              <li>• Make sure you have a stable internet connection</li>
              <li>• Your answers are auto-saved as you go</li>
              <li>• You can navigate between questions freely</li>
              {runInfo?.duration_minutes && <li>• The timer will start when you click "Start Assessment"</li>}
              <li>• Once submitted, you cannot change your answers</li>
            </ul>
          </InfoPanel>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="gap-2"
            >
              <CheckCircle2 className="h-5 w-5" />
              {startMutation.isPending ? 'Starting...' : 'Start Assessment'}
            </Button>
          </div>
        </motion.div>
      </PageShell>
    )
  }

  // Taking UI
  if (!questionsData || questionsData.length === 0) {
    return (
      <PageShell maxWidth="2xl">
        <LoadingState message="Loading questions..." />
      </PageShell>
    )
  }

  const currentQuestion = questionsData[currentQuestionIndex]
  const currentAnswer = answers[currentQuestion.question_id]
  const progress = ((currentQuestionIndex + 1) / questionsData.length) * 100
  const answeredCount = Object.keys(answers).length

  return (
    <PageShell maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header with timer and progress */}
        <div className="flex items-center justify-between">
          <div>
            <Text variant="muted" size="sm">Question {currentQuestionIndex + 1} of {questionsData.length}</Text>
            <Progress value={progress} className="w-48 h-2 mt-1" />
          </div>
          
          {timeRemaining !== null && (
            <div className="flex items-center gap-2">
              <Clock className={`h-5 w-5 ${timeRemaining < 300 ? 'text-red-600' : 'text-muted-foreground'}`} />
              <Text className={`text-xl font-mono font-bold ${timeRemaining < 300 ? 'text-red-600' : ''}`}>
                {formatTime(timeRemaining)}
              </Text>
            </div>
          )}
        </div>

        {/* Question Card */}
        <SurfaceCard variant="elevated">
          <Stack gap="lg">
            <div>
              <Badge variant="secondary" className="mb-3">
                {currentQuestion.question_type.replace('_', ' ')}
              </Badge>
              <Heading level={3}>{currentQuestion.question_text}</Heading>
              <Text size="sm" variant="muted" className="mt-2">
                {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
              </Text>
            </div>

            {/* MCQ */}
            {currentQuestion.question_type === 'mcq' && currentQuestion.options && (
              <RadioGroup
                value={currentAnswer?.selected || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.question_id, { selected: value })}
              >
                <Stack gap="sm">
                  {currentQuestion.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </Stack>
              </RadioGroup>
            )}

            {/* Short Answer */}
            {currentQuestion.question_type === 'short_answer' && (
              <Textarea
                value={currentAnswer?.text || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.question_id, { text: e.target.value })}
                placeholder="Enter your answer..."
                rows={6}
              />
            )}

            {/* Code (simplified - could add code editor) */}
            {currentQuestion.question_type === 'code' && (
              <Textarea
                value={currentAnswer?.code || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.question_id, { code: e.target.value, language: 'python' })}
                placeholder="Enter your code..."
                rows={12}
                className="font-mono text-sm"
              />
            )}

            {saveMutation.isPending && (
              <Text size="xs" variant="muted" className="flex items-center gap-1">
                <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
                Saving...
              </Text>
            )}
          </Stack>
        </SurfaceCard>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPrev}
            disabled={currentQuestionIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <Text size="sm" variant="muted">
            {answeredCount} of {questionsData.length} answered
          </Text>

          {currentQuestionIndex === questionsData.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {submitMutation.isPending ? 'Submitting...' : 'Submit Assessment'}
            </Button>
          ) : (
            <Button onClick={goToNext} className="gap-2">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Submit Confirmation Modal */}
      <ModalLayout
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        title="Submit Assessment?"
        size="md"
      >
        <Stack gap="md">
          <div>
            <Text className="mb-2">You have answered {answeredCount} out of {questionsData.length} questions.</Text>
            {answeredCount < questionsData.length && (
              <InfoPanel icon={AlertTriangle} title="Unanswered Questions" variant="warning">
                <Text size="sm">{questionsData.length - answeredCount} question(s) left unanswered. Are you sure you want to submit?</Text>
              </InfoPanel>
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowSubmitConfirm(false)}>
              Go Back
            </Button>
            <Button
              onClick={() => {
                setShowSubmitConfirm(false)
                submitMutation.mutate()
              }}
              disabled={submitMutation.isPending}
            >
              Submit Anyway
            </Button>
          </div>
        </Stack>
      </ModalLayout>
    </PageShell>
  )
}

export default function AssessmentTakingPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <AssessmentTakingContent />
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
