'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useAuth } from '@/hooks/useAuth'
import { useMastery } from '@/hooks/useMastery'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Navbar } from './_components/navbar'
import { Sidebar } from './_components/sidebar'
import { Footer } from './_components/footer'
import { MasteryCard } from './_components/mastery-card'
import { DashboardSkeleton } from './_components/skeletons'
import { ErrorState } from './_components/empty-states'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, BookOpen, Code, History, Flame, Trophy, CheckCircle2, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { AuthGuard } from './_components/auth-guard'
import LandingPage from './(public)/landing/page'
import { useTranslations } from '@/lib/i18n'

import { useEffect } from 'react'

interface LessonProgressStats {
  totalLessons: number
  completedLessons: number
  courses: { id: string; title: string; total: number; completed: number }[]
}

interface UserStreak {
  currentStreak: number
  longestStreak: number
  lastActivityDate: string | null
  isActiveToday: boolean
}

interface RecentAttempt {
  id: string
  task_id: string
  concept_id: string | null
  concept_name: string | null
  passed: boolean
  created_at: string
  time_ms: number | null
}

function DashboardContent() {
  const { user } = useAuth()
  const router = useRouter()
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const { data: masteryData, isLoading, error, refetch } = useMastery(user?.id)

  // If instructor, redirect to instructor dashboard (safety check, should be handled by login/useAuth)
  useEffect(() => {
    if (user?.role === 'instructor' || user?.role === 'admin') {
      router.push('/instructor')
    }
  }, [user, router])

  // Fetch streak
  const { data: streak } = useQuery<UserStreak>({
    queryKey: ['user-streak'],
    queryFn: async () => {
      const response = await api.get('/users/streak')
      return response.data
    },
  })

  // Fetch lesson progress stats
  const { data: lessonStats } = useQuery<LessonProgressStats>({
    queryKey: ['lesson-progress-stats'],
    queryFn: async () => {
      // Fetch courses and completed lessons in parallel
      const [coursesRes, completedRes] = await Promise.all([
        api.get('/courses'),
        api.get('/lessons/progress'),
      ])
      
      const courseList = coursesRes.data || []
      const completedIds = new Set(completedRes.data || [])
      
      let totalLessons = 0
      let completedLessons = 0
      const courses: LessonProgressStats['courses'] = []
      
      for (const course of courseList) {
        try {
          const courseDetail = await api.get(`/courses/${course.id}`)
          const lessons = courseDetail.data?.lessons || []
          const completed = lessons.filter((l: any) => completedIds.has(l.id)).length
          
          totalLessons += lessons.length
          completedLessons += completed
          
          courses.push({
            id: course.id,
            title: courseDetail.data.title,
            total: lessons.length,
            completed,
          })
        } catch {}
      }
      
      return { totalLessons, completedLessons, courses }
    },
  })

  // Fetch recent attempts
  const { data: recentAttempts } = useQuery<RecentAttempt[]>({
    queryKey: ['recent-attempts', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const response = await api.get(`/users/${user.id}/attempts?limit=5&offset=0`)
      return response.data
    },
    enabled: !!user?.id,
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return <ErrorState error="Failed to load mastery data" retry={() => refetch()} />
  }

  const lessonProgress = lessonStats 
    ? Math.round((lessonStats.completedLessons / Math.max(lessonStats.totalLessons, 1)) * 100)
    : 0

  // Helper function to format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return tCommon('justNow')
    if (diffMins < 60) return `${diffMins}m ${tCommon('ago')}`
    if (diffHours < 24) return `${diffHours}h ${tCommon('ago')}`
    return `${diffDays}d ${tCommon('ago')}`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-4xl font-bold tracking-tight">
          {t('welcomeBack', { name: user?.name || t('defaultUser') })}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
      </motion.div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className={`bg-gradient-to-br border-orange-200 dark:border-orange-800 ${streak?.isActiveToday ? 'from-orange-100 to-orange-200/50 dark:from-orange-900/40 dark:to-orange-800/30' : 'from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">{t('currentStreak')}</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{streak?.currentStreak ?? 0}</p>
                  <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
                    {streak?.isActiveToday ? `🔥 ${t('activeToday')}` : t('days')}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${streak?.isActiveToday ? 'bg-orange-300 dark:bg-orange-700' : 'bg-orange-200 dark:bg-orange-800'}`}>
                  <Flame className={`h-6 w-6 ${streak?.isActiveToday ? 'text-orange-700 dark:text-orange-200' : 'text-orange-600 dark:text-orange-300'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">{t('lessonsDone')}</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {lessonStats?.completedLessons ?? 0}
                  </p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70">
                    {t('ofTotal', { total: lessonStats?.totalLessons ?? 0 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-200 dark:bg-green-800">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('conceptsMastered')}</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {masteryData?.filter(m => m.mastery >= 80).length ?? 0}
                  </p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                    {t('ofConcepts', { total: masteryData?.length ?? 0 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-200 dark:bg-blue-800">
                  <Trophy className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{t('overallProgress')}</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{lessonProgress}%</p>
                  <Progress value={lessonProgress} className="h-1.5 mt-2 w-24" />
                </div>
                <div className="p-3 rounded-full bg-purple-200 dark:bg-purple-800">
                  <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Course Progress */}
      {lessonStats && lessonStats.courses.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">{t('courseProgress')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lessonStats.courses.map((course, index) => {
              const progress = course.total > 0 
                ? Math.round((course.completed / course.total) * 100) 
                : 0
              const isComplete = course.completed === course.total && course.total > 0

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  <Card 
                    className={`cursor-pointer hover:shadow-md transition-all ${isComplete ? 'border-green-300 dark:border-green-700' : ''}`}
                    onClick={() => router.push('/lessons')}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium truncate pr-2">{course.title}</h3>
                        {isComplete ? (
                          <Badge variant="default" className="bg-green-500 shrink-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {t('complete')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="shrink-0">
                            {course.completed}/{course.total}
                          </Badge>
                        )}
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {progress}% {t('percentComplete')}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mastery Overview */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">{t('yourMastery')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {masteryData && masteryData.length > 0 ? (
            masteryData.map((item, index) => (
              <MasteryCard
                key={item.conceptId}
                concept={item.conceptName}
                value={item.mastery}
                index={index}
                onPractice={() => router.push('/practice')}
              />
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {t('noMasteryData')}
                </p>
                <Button className="mt-4" onClick={() => router.push('/practice')}>
                  {t('startPractice')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/practice')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Code className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t('continuePractice')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('continuePracticeDesc')}
                </p>
                <Button variant="ghost" className="w-full justify-between">
                  {t('start')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/lessons')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t('goToLessons')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('goToLessonsDesc')}
                </p>
                <Button variant="ghost" className="w-full justify-between">
                  {t('browse')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/attempts')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <History className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t('viewHistory')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('viewHistoryDesc')}
                </p>
                <Button variant="ghost" className="w-full justify-between">
                  {t('view')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentAttempts && recentAttempts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">{t('recentActivity')}</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/attempts')}>
              {t('viewHistory')}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {recentAttempts.map((attempt, index) => (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${attempt.passed 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-red-100 dark:bg-red-900/30'}`}
                      >
                        {attempt.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <Code className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {attempt.concept_name || 'Practice Task'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {attempt.passed ? tCommon('completed') : 'Attempted'} • {formatTimeAgo(attempt.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={attempt.passed ? 'default' : 'secondary'} className={attempt.passed ? 'bg-green-500' : ''}>
                      {attempt.passed ? tCommon('completed') : 'Failed'}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const { token, user } = useAuthStore()
  const router = useRouter()

  // If not authenticated, show landing page
  if (!token) {
    return <LandingPage />
  }

  // Double check redirection for instructors landing on root
  if (user?.role === 'instructor' || user?.role === 'admin') {
    if (typeof window !== 'undefined') {
      router.push('/instructor')
    }
  }

  // If authenticated, show dashboard
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-8 lg:ml-64">
            <div className="container max-w-7xl mx-auto">
              <DashboardContent />
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </AuthGuard>
  )
}

