'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNextTask } from '@/hooks/useMastery'
import { useTasks } from '@/hooks/useTasks'
import { useXP } from '@/hooks/useXP'
import api from '@/lib/api'
import { Navbar } from '../_components/navbar'
import { Sidebar } from '../_components/sidebar'
import { Footer } from '../_components/footer'
import { TaskCard } from '../_components/task-card'
import { CodeEditor } from '../_components/code-editor'
import { FeedbackPanel } from '../_components/feedback-panel'
import { WhyThisTaskDrawer } from '../_components/why-this-task-drawer'
import { TaskCardSkeleton } from '../_components/skeletons'
import { NoTasksState, ErrorState } from '../_components/empty-states'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Play, RotateCcw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { AuthGuard } from '../_components/auth-guard'
import Confetti from 'react-confetti'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTranslations } from '@/lib/i18n'
import { AIAssistant } from '@/components/ai-assistant'
import { HintButton } from '@/components/hint-button'

function PracticeContent() {
  const { user } = useAuth()
  const t = useTranslations('practice')
  const { data: nextTaskData, isLoading: isLoadingNext, error: nextError, refetch: refetchNext } = useNextTask(user?.id)
  const { generateTaskAsync, gradeTaskAsync, isGenerating, isGrading } = useTasks()
  const { invalidateXP } = useXP()

  const [currentTask, setCurrentTask] = useState<any>(null)
  const [code, setCode] = useState('')
  const [feedback, setFeedback] = useState<any>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [scaffoldedHint, setScaffoldedHint] = useState<string | null>(null)
  const [isLoadingHint, setIsLoadingHint] = useState(false)
  const { width, height } = useWindowSize()

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
      toast.error('Please write some code first')
      return
    }

    try {
      const result = await gradeTaskAsync({
        taskId: currentTask.taskId,
        code,
      })
      setFeedback(result)

      if (result.passed) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
        invalidateXP() // Refresh XP display
        const xpMessage = result.xpEarned > 0 ? ` +${result.xpEarned} XP! ` : ''
        toast.success(`Nice work!${xpMessage}Difficulty adjusted for your next step 🚀`)
      }
    } catch (error) {
      toast.error('Failed to grade task')
    }
  }

  const handleNextTask = () => {
    setCurrentTask(null)
    setCode('')
    setFeedback(null)
    setScaffoldedHint(null)
    refetchNext()
  }

  const handleReset = () => {
    setCode(currentTask?.starterCode || '')
    setFeedback(null)
    setScaffoldedHint(null)
  }

  const handleGetHint = async () => {
    if (!currentTask || !feedback || feedback.passed) return

    setIsLoadingHint(true)
    try {
      const response = await api.post('/task/hint', {
        taskId: currentTask.taskId,
        code: code,
        failures: feedback.failures || []
      })
      setScaffoldedHint(response.data.hint)
      toast.success('Hint generated!')
    } catch (error) {
      toast.error('Failed to generate hint. This feature may not be enabled.')
    } finally {
      setIsLoadingHint(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to run tests
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (currentTask && !isGrading) {
          handleRunTests()
        }
      }
      // Ctrl/Cmd + Shift + R to reset (avoid conflict with browser refresh)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        if (currentTask && !isGrading) {
          handleReset()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentTask, isGrading, code])

  if (isLoadingNext || (nextTaskData && isGenerating && !currentTask)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <TaskCardSkeleton />
      </div>
    )
  }

  if (nextError) {
    return <ErrorState error="Failed to load next task" retry={() => refetchNext()} />
  }

  if (!nextTaskData || !currentTask) {
    return <NoTasksState onStart={() => refetchNext()} />
  }

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {nextTaskData.conceptName}
            </Badge>
            <WhyThisTaskDrawer
              conceptName={nextTaskData.conceptName}
              difficulty={nextTaskData.difficulty}
              reason={nextTaskData.reason}
              mastery={undefined}
            />
          </div>
        </div>
      </motion.div>

      {/* Task */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <TaskCard
          prompt={currentTask.prompt}
          tests={currentTask.tests}
          hint={currentTask.hint}
          difficulty={nextTaskData.difficulty}
        />
      </motion.div>

      {/* Editor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('yourSolution')}</h2>
            <div className="flex items-center gap-2">
              <HintButton
                taskPrompt={currentTask.prompt}
                userCode={code}
                failures={feedback?.failures}
                concept={nextTaskData.conceptName}
              />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {t('shortcuts')}
              </span>
              <Button variant="outline" size="sm" onClick={handleReset} disabled={isGrading} title="Reset (Ctrl+Shift+R)">
                <RotateCcw className="h-4 w-4 mr-1" />
                {t('reset')}
              </Button>
              <Button onClick={handleRunTests} disabled={isGrading} size="sm" title="Run Tests (Ctrl+Enter)">
                <Play className="h-4 w-4 mr-1" />
                {isGrading ? t('running') : t('runTests')}
              </Button>
            </div>
          </div>
          <CodeEditor initialCode={code} onChange={setCode} />
        </div>
      </motion.div>

      {/* Feedback */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FeedbackPanel
            passed={feedback.passed}
            feedback={feedback.aiFeedback}
            failures={feedback.failures}
            timeMs={feedback.timeMs}
            onGetHint={!feedback.passed ? handleGetHint : undefined}
            isLoadingHint={isLoadingHint}
            scaffoldedHint={scaffoldedHint}
          />
          {feedback.passed && (
            <div className="mt-4 flex justify-center">
              <Button onClick={handleNextTask} size="lg">
                <Sparkles className="h-4 w-4 mr-2" />
                {t('nextTask')}
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default function PracticePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-8 lg:ml-64">
            <div className="container max-w-6xl mx-auto">
              <PracticeContent />
            </div>
          </main>
        </div>
        <Footer />
        {/* AI Assistant floating button */}
        <AIAssistant context="Python programming practice with adaptive difficulty tasks" />
      </div>
    </AuthGuard>
  )
}

