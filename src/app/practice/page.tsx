'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNextTask } from '@/hooks/useMastery'
import { useTasks } from '@/hooks/useTasks'
import { useXP } from '@/hooks/useXP'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Navbar } from '../_components/navbar'
import { Sidebar } from '../_components/sidebar'
import { Footer } from '../_components/footer'
import { TaskCard } from '../_components/task-card'
import { CodeEditor } from '../_components/code-editor'
import { FeedbackPanel } from '../_components/feedback-panel'
import { WhyThisTaskDrawer } from '../_components/why-this-task-drawer'
import { TaskCardSkeleton } from '../_components/skeletons'
import { TaskRenderer, isCodeTask, getTaskTypeLabel, getTaskTypeIcon } from '@/components/task-renderers'
import type { TaskType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Play, RotateCcw, Sparkles, BookOpen, GraduationCap, Rocket, Target, Trophy, ArrowRight, Zap, AlertCircle, Send } from 'lucide-react'
import { toast } from 'sonner'
import { AuthGuard } from '../_components/auth-guard'
import Confetti from 'react-confetti'
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('onboarding.welcome')}
        </p>
      </div>

      {/* Onboarding steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full border-2 border-dashed hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">{t('onboarding.step1Title')}</CardTitle>
              <CardDescription>
                {t('onboarding.step1Desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/courses">
                <Button variant="outline" className="w-full gap-2">
                  <BookOpen className="h-4 w-4" />
                  {t('onboarding.browseCourses')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full border-2 border-dashed hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                <Play className="h-6 w-6 text-amber-500" />
              </div>
              <CardTitle className="text-lg">{t('onboarding.step2Title')}</CardTitle>
              <CardDescription>
                {t('onboarding.step2Desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/lessons">
                <Button variant="outline" className="w-full gap-2">
                  <Target className="h-4 w-4" />
                  {t('onboarding.viewLessons')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full border-2 border-dashed hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle className="text-lg">{t('onboarding.step3Title')}</CardTitle>
              <CardDescription>
                {t('onboarding.step3Desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full gap-2" disabled>
                <Zap className="h-4 w-4" />
                {t('onboarding.comingSoon')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Motivation card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-muted/50">
          <CardContent className="py-8 text-center">
            <Rocket className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">
              {t('onboarding.readyTitle')}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t('onboarding.readyDesc')}
            </p>
            <Link href="/discover">
              <Button size="lg" className="gap-2">
                <Sparkles className="h-4 w-4" />
                {t('onboarding.explore')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2"
    >
      <span className="text-sm text-muted-foreground self-center mr-2">
        {t('selectCourse') || 'Practice from:'}
      </span>
      {courses.map((course) => (
        <Button
          key={course.course_id}
          variant={selectedCourse === course.course_id ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(course.course_id)}
          className="gap-2"
        >
          <BookOpen className="h-3 w-3" />
          {course.course_title}
          <Badge variant="secondary" className="ml-1 text-xs">
            {course.progress_percent}%
          </Badge>
        </Button>
      ))}
    </motion.div>
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
      const res = await api.get<EnrolledCourse[]>('/api/v1/instructor/my-courses')
      return res.data
    }
  })

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const { data: nextTaskData, isLoading: isLoadingNext, error: nextError, refetch: refetchNext } = useNextTask(user?.id)
  const { generateTaskAsync, gradeTaskAsync, isGenerating, isGrading } = useTasks()
  const { invalidateXP } = useXP()

  const [currentTask, setCurrentTask] = useState<any>(null)
  const [code, setCode] = useState('')
  const [feedback, setFeedback] = useState<any>(null)
  const [showConfetti, setShowConfetti] = useState(false)
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

  // Loading state
  if (coursesLoading) {
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

  // No courses enrolled - show onboarding
  if (!courses || courses.length === 0) {
    return <PracticeOnboarding />
  }

  // Error getting next task (no concepts in system)
  if (nextError) {
    const errorMessage = (nextError as any)?.response?.data?.detail || 'No practice content available'
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>

        {/* Course selector if multiple */}
        {courses && courses.length > 1 && (
          <CourseSelector 
            courses={courses} 
            selectedCourse={selectedCourseId} 
            onSelect={setSelectedCourseId} 
          />
        )}

        {/* No content yet message */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {t('noContent.title') || 'Practice Content Coming Soon'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t('noContent.description') || 'Complete some lessons first to unlock personalized practice challenges. Your progress is being tracked!'}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/lessons">
                <Button variant="outline" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  {t('noContent.goToLessons') || 'Go to Lessons'}
                </Button>
              </Link>
              <Link href="/courses">
                <Button className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  {t('noContent.myCourses') || 'My Courses'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Loading next task
  if (isLoadingNext || (nextTaskData && isGenerating && !currentTask)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        {courses && courses.length > 1 && (
          <CourseSelector 
            courses={courses} 
            selectedCourse={selectedCourseId} 
            onSelect={setSelectedCourseId} 
          />
        )}
        <TaskCardSkeleton />
      </div>
    )
  }

  if (nextError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {t('error.title')}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t('error.description')}
            </p>
            <Button onClick={() => refetchNext()} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              {t('error.retry')}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (!nextTaskData || !currentTask) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>

        {courses && courses.length > 1 && (
          <CourseSelector 
            courses={courses} 
            selectedCourse={selectedCourseId} 
            onSelect={setSelectedCourseId} 
          />
        )}

        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {t('allDone.title') || 'All Caught Up!'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t('allDone.description') || "You've completed all available challenges. Check back later for more or explore other courses."}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/lessons">
                <Button variant="outline" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  {t('allDone.goToLessons') || 'Continue Learning'}
                </Button>
              </Link>
              <Button onClick={() => refetchNext()} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                {t('allDone.refresh') || 'Check for New Tasks'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1">
            <Target className="h-3 w-3 mr-1" />
            {nextTaskData.conceptName}
          </Badge>
          <Badge className={cn(
            "px-3 py-1",
            nextTaskData.difficulty === 'easy' && "bg-green-500/10 text-green-600 border-green-500/30",
            nextTaskData.difficulty === 'medium' && "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
            nextTaskData.difficulty === 'hard' && "bg-red-500/10 text-red-600 border-red-500/30"
          )}>
            <Zap className="h-3 w-3 mr-1" />
            {nextTaskData.difficulty}
          </Badge>
          <WhyThisTaskDrawer
            conceptName={nextTaskData.conceptName}
            difficulty={nextTaskData.difficulty}
            reason={nextTaskData.reason}
            mastery={undefined}
          />
        </div>
      </motion.div>

      {/* Course Selector */}
      {courses && courses.length > 1 && (
        <CourseSelector 
          courses={courses} 
          selectedCourse={selectedCourseId} 
          onSelect={setSelectedCourseId} 
        />
      )}

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
          taskType={currentTask.taskType}
        />
      </motion.div>

      {/* Dynamic Task Input - renders appropriate UI based on task type */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {isCodeTask(currentTask.taskType as TaskType) ? t('yourSolution') : t('yourAnswer') || 'Your Answer'}
            </h2>
            <div className="flex items-center gap-2">
              <HintButton
                taskPrompt={currentTask.prompt}
                userCode={code}
                failures={feedback?.failures}
                concept={nextTaskData.conceptName}
              />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {isCodeTask(currentTask.taskType as TaskType) ? t('shortcuts') : ''}
              </span>
              <Button variant="outline" size="sm" onClick={handleReset} disabled={isGrading} title="Reset">
                <RotateCcw className="h-4 w-4 mr-1" />
                {t('reset')}
              </Button>
              <Button onClick={handleRunTests} disabled={isGrading} size="sm" title="Submit">
                {isCodeTask(currentTask.taskType as TaskType) ? (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    {isGrading ? t('running') : t('runTests')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    {isGrading ? t('running') : t('submit') || 'Submit'}
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Render dynamic task input based on task type */}
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

