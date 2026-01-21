'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNextTask } from '@/hooks/useMastery'
import { useTasks } from '@/hooks/useTasks'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Navbar } from '../_components/navbar'
import { Sidebar } from '../_components/sidebar'
import { Footer } from '../_components/footer'
import { FeedbackPanel } from '../_components/feedback-panel'
import { TaskCardSkeleton } from '../_components/skeletons'
import { TaskRenderer, isCodeTask } from '@/components/task-renderers'
import type { TaskType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Play, RotateCcw, Sparkles, BookOpen, ArrowRight, Send, CheckCircle2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { AuthGuard } from '../_components/auth-guard'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTranslations } from '@/lib/i18n'
import { AIAssistant } from '@/components/ai-assistant'
import { HintButton } from '@/components/hint-button'
import Link from 'next/link'


interface EnrolledCourse {
  id: string
  course_id: string
  course_title: string
  progress_percent: number
  total_lessons: number
  lessons_completed: number
}

// Onboarding component for new users with no courses
function PracticeOnboarding() {
  const t = useTranslations('practice')
  
  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-serif text-foreground mb-4">{t('title')}</h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
          {t('onboarding.welcome') || "Active recall is the most efficient way to learn. Start practicing to reinforce your knowledge."}
        </p>
      </div>

      <div className="grid gap-6">
        <Link href="/courses" className="block group">
          <div className="border rounded-lg p-6 hover:border-primary/50 transition-colors bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg mb-1">{t('onboarding.browseCourses') || "Browse Courses"}</h3>
                <p className="text-muted-foreground">{t('onboarding.step1Desc') || "Find a course to start your learning journey."}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </Link>

        <Link href="/lessons" className="block group">
          <div className="border rounded-lg p-6 hover:border-primary/50 transition-colors bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg mb-1">{t('onboarding.viewLessons') || "Go to Lessons"}</h3>
                <p className="text-muted-foreground">{t('onboarding.step2Desc') || "Review material before practicing."}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

// Course selector for users with multiple courses
function CourseSelector({ 
  courses, 
  selectedCourse, 
  onSelect 
}: { 
  courses: EnrolledCourse[]
  selectedCourse: string | null
  onSelect: (courseId: string) => void
}) {
  const t = useTranslations('practice')
  
  if (courses.length <= 1) return null
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">Course:</span>
      <select 
        className="h-9 px-3 rounded-md border border-input bg-transparent text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={selectedCourse || ''}
        onChange={(e) => onSelect(e.target.value)}
      >
        {courses.map((course) => (
          <option key={course.course_id} value={course.course_id}>
            {course.course_title}
          </option>
        ))}
      </select>
    </div>
  )
}

function PracticeContent() {
  const { user } = useAuth()
  const t = useTranslations('practice')
  const { width, height } = useWindowSize()
  
  // Fetch enrolled courses to determine what to practice
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const res = await api.get<EnrolledCourse[]>('/instructor/my-courses')
      return res.data
    }
  })

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const { data: nextTaskData, isLoading: isLoadingNext, error: nextError, refetch: refetchNext } = useNextTask(user?.id)
  const { generateTaskAsync, gradeTaskAsync, isGenerating, isGrading } = useTasks()

  const [currentTask, setCurrentTask] = useState<any>(null)
  const [code, setCode] = useState('')
  const [feedback, setFeedback] = useState<any>(null)
  const [scaffoldedHint, setScaffoldedHint] = useState<string | null>(null)
  const [isLoadingHint, setIsLoadingHint] = useState(false)

  // Set default course when courses load
  useEffect(() => {
    if (courses && courses.length > 0 && !selectedCourseId) {
      // Pick the course with most progress or the first one
      const activeCourse = courses.find(c => c.progress_percent > 0 && c.progress_percent < 100) || courses[0]
      setSelectedCourseId(activeCourse.course_id)
    }
  }, [courses, selectedCourseId])

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
        code, // code is the user's answer for any task type
      })
      setFeedback(result)

      if (result.passed) {
        toast.success(`Correct.`)
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
      toast.success('Hint generated')
    } catch (error) {
      toast.error('Failed to generate hint.')
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
      // Ctrl/Cmd + Shift + R to reset
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

  // Loading state
  if (coursesLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <TaskCardSkeleton />
      </div>
    )
  }

  // No courses enrolled - show onboarding
  if (!courses || courses.length === 0) {
    return <PracticeOnboarding />
  }

  // Error getting next task
  if (nextError) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <h3 className="text-xl font-medium mb-2">{t('error.title') || "Unable to load task"}</h3>
        <p className="text-muted-foreground mb-6">{t('error.description') || "Please try again later."}</p>
        <Button onClick={() => refetchNext()} variant="outline">{t('error.retry') || "Retry"}</Button>
      </div>
    )
  }

  // Generate loading
  if (isLoadingNext || (nextTaskData && isGenerating && !currentTask)) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-8">
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-32 bg-muted/50 rounded animate-pulse" />
        <div className="h-64 bg-muted/30 rounded animate-pulse" />
      </div>
    )
  }

  if (!nextTaskData || !currentTask) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-serif mb-2">{t('allDone.title') || "Practice Complete"}</h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
           You've reviewed all pending items for now. 
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/lessons">
            <Button variant="outline">{t('allDone.goToLessons') || "Back to Lessons"}</Button>
          </Link>
          <Button onClick={() => refetchNext()}>{t('allDone.refresh') || "Refresh"}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      
      {/* "Paper" Header */}
      <div className="flex items-start justify-between pb-6 border-b">
        <div>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {nextTaskData.conceptName}
          </span>
          <h1 className="text-3xl font-serif text-foreground mt-1">Practice</h1>
        </div>
        
        {courses && courses.length > 1 && (
           <CourseSelector 
             courses={courses} 
             selectedCourse={selectedCourseId} 
             onSelect={setSelectedCourseId} 
           />
        )}
      </div>

      {/* Task Prompt - Clean Typography */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
         <p className="leading-relaxed whitespace-pre-wrap">{currentTask.prompt}</p>
      </div>

      {/* Input Area */}
      <div className="pt-4 space-y-6">
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
            disabled={isGrading}
          />
          
          <div className="flex justify-between items-center pt-4">
             <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleReset} disabled={isGrading} className="text-muted-foreground">
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
                disabled={isGrading || !code} 
                size="lg" 
                className="px-8"
              >
                {isGrading ? (
                   <span className="flex items-center gap-2">Checking...</span>
                ) : (
                   <span className="flex items-center gap-2">Submit <ArrowRight className="h-4 w-4" /></span>
                )}
             </Button>
          </div>
      </div>

      {/* Feedback Panel */}
      {feedback && (
        <div className="pt-8 border-t animate-in slide-in-from-bottom-4">
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
            <div className="mt-8 flex justify-center">
              <Button onClick={handleNextTask} size="lg" className="min-w-[200px]">
                Next Problem <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
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

