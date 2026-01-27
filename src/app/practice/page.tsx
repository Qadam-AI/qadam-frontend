'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNextTask } from '@/hooks/useMastery'
import { useTasks } from '@/hooks/useTasks'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Navbar } from '../_components/navbar'
import { Sidebar } from '../_components/sidebar'
import { TaskRenderer } from '@/components/task-renderers'
import type { TaskType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { 
  ChevronRight, 
  BookOpen, 
  CheckCircle2, 
  Sparkles,
  Lightbulb,
  ArrowRight,
  RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'
import { AuthGuard } from '../_components/auth-guard'
import { HintButton } from '@/components/hint-button'
import Link from 'next/link'

// Design System
import { PageShell, Stack } from '@/design-system/layout'
import { SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { EmptyState, LoadingState } from '@/design-system/feedback'
import { LabelText, Text, Heading } from '@/design-system/typography'

interface EnrolledCourse {
  id: string
  course_id: string
  course_title: string
  progress_percent: number
  total_lessons: number
  lessons_completed: number
}

function PracticeContent() {
  const { user } = useAuth()
  
  // Fetch enrolled courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const res = await api.get<EnrolledCourse[]>('/instructor/my-courses')
      return res.data
    }
  })

  const { data: nextTaskData, isLoading: isLoadingNext, error: nextError, refetch: refetchNext } = useNextTask(user?.id)
  const { generateTaskAsync, gradeTaskAsync, isGenerating, isGrading } = useTasks()

  const [currentTask, setCurrentTask] = useState<any>(null)
  const [code, setCode] = useState('')
  const [feedback, setFeedback] = useState<any>(null)
  const [taskNumber, setTaskNumber] = useState(1)

  // Generate task when we have next task info
  useEffect(() => {
    if (nextTaskData && !currentTask) {
      handleGenerateTask()
    }
  }, [nextTaskData])

  const handleGenerateTask = async () => {
    if (!nextTaskData || !user?.id) return

    try {
      const task = await generateTaskAsync({
        userId: user.id,
        conceptId: nextTaskData.conceptId,
        difficulty: nextTaskData.difficulty,
        errorTags: [],
      })
      setCurrentTask(task)
      setCode(task.starterCode || '')
      setFeedback(null)
    } catch (error) {
      toast.error('Failed to generate task')
    }
  }

  const handleRunTests = async () => {
    if (!currentTask || !code.trim()) {
      toast.error('Please provide an answer first')
      return
    }

    try {
      const result = await gradeTaskAsync({
        taskId: currentTask.taskId,
        code,
      })
      setFeedback(result)

      if (result.passed) {
        toast.success('Correct!')
      }
    } catch (error) {
      toast.error('Failed to grade task')
    }
  }

  const handleNextTask = () => {
    setCurrentTask(null)
    setCode('')
    setFeedback(null)
    setTaskNumber(prev => prev + 1)
    refetchNext()
  }

  const handleReset = () => {
    setCode(currentTask?.starterCode || '')
    setFeedback(null)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (currentTask && !isGrading && !feedback?.passed) {
          handleRunTests()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentTask, isGrading, code, feedback])

  // Loading state
  if (coursesLoading) {
    return (
      <PageShell maxWidth="2xl">
        <LoadingState message="Loading practice..." />
      </PageShell>
    )
  }

  // No courses enrolled
  if (!courses || courses.length === 0) {
    return (
      <PageShell maxWidth="lg">
        <div className="py-12">
          <EmptyState
            icon={BookOpen}
            title="Ready to Start Practicing"
            description="Active recall is the most efficient way to learn. Enroll in a course to begin."
            action={{
              label: 'Browse Courses',
              onClick: () => window.location.href = '/courses'
            }}
          />
          <div className="mt-8">
            <InfoPanel variant="info" icon={Sparkles} title="How Practice Works">
              <ul className="text-sm space-y-1">
                <li>• Questions adapt to your level</li>
                <li>• Instant feedback after each answer</li>
                <li>• Focus on concepts you need most</li>
                <li>• Track your progress over time</li>
              </ul>
            </InfoPanel>
          </div>
        </div>
      </PageShell>
    )
  }

  // Error state
  if (nextError) {
    return (
      <PageShell maxWidth="lg">
        <div className="py-12">
          <EmptyState
            icon={Lightbulb}
            title="Unable to load practice"
            description="Please try again later or contact support if the problem persists."
            action={{
              label: 'Try Again',
              onClick: () => refetchNext()
            }}
          />
        </div>
      </PageShell>
    )
  }

  // Generate loading
  if (isLoadingNext || (nextTaskData && isGenerating && !currentTask)) {
    return (
      <PageShell maxWidth="2xl">
        <LoadingState message="Generating your next question..." />
      </PageShell>
    )
  }

  // All done
  if (!nextTaskData || !currentTask) {
    return (
      <PageShell maxWidth="lg">
        <div className="py-12">
          <SurfaceCard variant="muted" className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <Heading level={2} className="mb-2">Practice Complete</Heading>
            <Text variant="muted" className="mb-8 max-w-md mx-auto">
              You've reviewed all pending items for now. Great work!
            </Text>
            <div className="flex gap-4 justify-center">
              <Link href="/lessons">
                <Button variant="outline" size="lg">Back to Lessons</Button>
              </Link>
              <Button onClick={() => refetchNext()} size="lg">Refresh</Button>
            </div>
          </SurfaceCard>
        </div>
      </PageShell>
    )
  }

  const progressPercent = feedback?.passed ? 100 : 0

  return (
    <PageShell maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 py-8"
      >
        {/* Focused Header */}
        <div className="flex items-center justify-between">
          <div>
            <Text variant="subtle" className="uppercase tracking-wide text-xs font-medium mb-1">
              {nextTaskData.conceptName}
            </Text>
            <Heading level={1}>Practice</Heading>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <Text size="sm" className="font-medium">Question {taskNumber}</Text>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Question */}
        <SurfaceCard variant="elevated">
          <Stack gap="lg">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="leading-relaxed whitespace-pre-wrap text-foreground">
                {currentTask.prompt}
              </p>
            </div>

            {/* Answer Input */}
            <div className="pt-4">
              <TaskRenderer
                taskType={(currentTask.taskType || 'short_answer') as TaskType}
                prompt={currentTask.prompt}
                starterCode={currentTask.starterCode}
                options={currentTask.options}
                pairs={currentTask.pairs}
                items={currentTask.items}
                statements={currentTask.statements}
                value={code}
                onChange={setCode}
                disabled={isGrading || feedback?.passed}
              />
            </div>

            {/* Actions */}
            {!feedback?.passed && (
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleReset} 
                    disabled={isGrading}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                  <HintButton
                    taskPrompt={currentTask.prompt}
                    userCode={code}
                    failures={feedback?.failures}
                    concept={nextTaskData.conceptName}
                  />
                </div>
                
                <Button 
                  onClick={handleRunTests} 
                  disabled={isGrading || !code.trim()} 
                  size="lg" 
                  className="gap-2 min-w-[140px]"
                >
                  {isGrading ? (
                    'Checking...'
                  ) : (
                    <>
                      Submit
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </Stack>
        </SurfaceCard>

        {/* Feedback */}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SurfaceCard variant={feedback.passed ? 'default' : 'bordered'}>
              <Stack gap="md">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    feedback.passed 
                      ? 'bg-green-500/10 text-green-600' 
                      : 'bg-yellow-500/10 text-yellow-600'
                  }`}>
                    {feedback.passed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Lightbulb className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <LabelText className={feedback.passed ? 'text-green-600' : 'text-yellow-600'}>
                      {feedback.passed ? 'Correct!' : 'Not quite right'}
                    </LabelText>
                    {feedback.aiFeedback && (
                      <Text className="mt-2 whitespace-pre-wrap">
                        {feedback.aiFeedback}
                      </Text>
                    )}
                    {!feedback.passed && feedback.failures && feedback.failures.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {feedback.failures.map((failure: string, idx: number) => (
                          <Text key={idx} size="sm" variant="muted">
                            • {failure}
                          </Text>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {feedback.passed && (
                  <div className="flex justify-center pt-4">
                    <Button onClick={handleNextTask} size="lg" className="gap-2 min-w-[180px]">
                      Next Question
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Stack>
            </SurfaceCard>
          </motion.div>
        )}

        {/* Keyboard hint */}
        {!feedback?.passed && (
          <Text size="xs" variant="subtle" className="text-center">
            Press Ctrl+Enter to submit
          </Text>
        )}
      </motion.div>
    </PageShell>
  )
}

export default function PracticePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <PracticeContent />
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
