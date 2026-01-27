'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useAuth } from '@/hooks/useAuth'
import { useMastery } from '@/hooks/useMastery'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Navbar } from './_components/navbar'
import { Sidebar } from './_components/sidebar'
import { MasteryCard } from './_components/mastery-card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  BookOpen, 
  Code, 
  Flame, 
  Trophy, 
  CheckCircle2, 
  GraduationCap,
  Sparkles,
  Play
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { AuthGuard } from './_components/auth-guard'
import LandingPage from './(public)/landing/page'
import { useEffect } from 'react'
import Link from 'next/link'

// Design System
import { PageShell, PageHeader, Section, Grid, Stack } from '@/design-system/layout'
import { MetricCard, SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text } from '@/design-system/typography'

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
  const { data: masteryData, isLoading, error, refetch } = useMastery(user?.id)

  // Redirect instructors
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
      const [coursesRes, completedRes] = await Promise.all([
        api.get('/courses?enrolled_only=true'),
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
    return (
      <PageShell maxWidth="2xl">
        <LoadingState message="Loading your dashboard..." />
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell maxWidth="2xl">
        <EmptyState 
          icon={GraduationCap}
          title="Unable to load dashboard"
          description="We couldn't load your progress data. Please try again."
          action={{
            label: 'Retry',
            onClick: () => refetch()
          }}
        />
      </PageShell>
    )
  }

  const lessonProgress = lessonStats 
    ? Math.round((lessonStats.completedLessons / Math.max(lessonStats.totalLessons, 1)) * 100)
    : 0

  const hasContent = lessonStats && lessonStats.courses.length > 0

  return (
    <PageShell maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Welcome Header */}
        <div>
          <Heading level={1} className="mb-2">
            Welcome back, {user?.name || 'Student'}
          </Heading>
          <Text variant="muted" className="text-lg">
            Ready to continue your learning journey?
          </Text>
        </div>

        {/* Next Up Hero - If has courses */}
        {hasContent && lessonStats.courses.some(c => c.completed < c.total) && (
          <SurfaceCard variant="elevated" className="bg-gradient-to-br from-primary/5 to-indigo-500/5">
            <Stack gap="md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Text className="uppercase tracking-wide text-xs font-medium text-primary mb-1">
                    Next Up
                  </Text>
                  <Heading level={3} className="mb-2">
                    {lessonStats.courses.find(c => c.completed < c.total)?.title || 'Continue Learning'}
                  </Heading>
                  <Text variant="muted">
                    {lessonStats.courses.find(c => c.completed < c.total) && 
                     `${lessonStats.courses.find(c => c.completed < c.total)!.completed} of ${lessonStats.courses.find(c => c.completed < c.total)!.total} lessons completed`}
                  </Text>
                </div>
                <Link href="/lessons">
                  <Button size="lg" className="gap-2">
                    <Play className="h-4 w-4" />
                    Continue
                  </Button>
                </Link>
              </div>
            </Stack>
          </SurfaceCard>
        )}

        {/* Quick Stats */}
        <Section>
          <Grid cols={4} gap="md">
            <MetricCard
              label="Current Streak"
              value={streak?.currentStreak ?? 0}
              icon={Flame}
              variant={streak?.isActiveToday ? 'warning' : 'default'}
              trend={streak?.isActiveToday ? { value: 'Active today!', positive: true } : undefined}
            />
            <MetricCard
              label="Lessons Done"
              value={lessonStats?.completedLessons ?? 0}
              icon={CheckCircle2}
              variant="success"
              trend={lessonStats?.totalLessons ? { value: `of ${lessonStats.totalLessons}`, positive: true } : undefined}
            />
            <MetricCard
              label="Understanding"
              value={masteryData?.filter(m => m.mastery >= 80).length ?? 0}
              icon={Trophy}
              variant="info"
              trend={masteryData?.length ? { value: `of ${masteryData.length} concepts`, positive: true } : undefined}
            />
            <MetricCard
              label="Overall Progress"
              value={`${lessonProgress}%`}
              icon={GraduationCap}
              variant="default"
            />
          </Grid>
        </Section>

        {/* Course Progress */}
        {hasContent && (
          <Section title="Your Courses" description="Track your progress across courses">
            <Grid cols={2} gap="md">
              {lessonStats.courses.map((course, index) => {
                const progress = course.total > 0 
                  ? Math.round((course.completed / course.total) * 100) 
                  : 0
                const isComplete = course.completed === course.total && course.total > 0

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href="/lessons">
                      <SurfaceCard 
                        className={`cursor-pointer hover:shadow-md transition-all ${
                          isComplete ? 'border-green-300 dark:border-green-700' : ''
                        }`}
                      >
                        <Stack gap="sm">
                          <div className="flex items-center justify-between">
                            <Text className="font-medium">{course.title}</Text>
                            {isComplete ? (
                              <Badge variant="default" className="bg-green-600 shrink-0 gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Complete
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="shrink-0">
                                {course.completed}/{course.total}
                              </Badge>
                            )}
                          </div>
                          <Progress value={progress} className="h-2" />
                          <Text size="xs" variant="muted">
                            {progress}% complete
                          </Text>
                        </Stack>
                      </SurfaceCard>
                    </Link>
                  </motion.div>
                )
              })}
            </Grid>
          </Section>
        )}

        {/* Understanding Overview */}
        {masteryData && masteryData.length > 0 && (
          <Section title="Understanding Overview" description="Your progress on key concepts">
            <Grid cols={4} gap="md">
              {masteryData.slice(0, 8).map((item, index) => (
                <MasteryCard
                  key={item.conceptId}
                  concept={item.conceptName}
                  value={item.mastery}
                  index={index}
                  onPractice={() => router.push('/practice')}
                />
              ))}
            </Grid>
            {masteryData.length > 8 && (
              <div className="flex justify-center pt-4">
                <Link href="/analytics">
                  <Button variant="outline" className="gap-2">
                    View All Concepts
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </Section>
        )}

        {/* Quick Actions */}
        <Section title="Quick Actions">
          <Grid cols={3} gap="md">
            <Link href="/practice">
              <SurfaceCard className="cursor-pointer hover:shadow-md transition-all group">
                <Stack gap="sm">
                  <div className="p-3 rounded-lg bg-primary/10 w-fit">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <Text className="font-semibold group-hover:text-primary transition-colors">
                    Continue Practice
                  </Text>
                  <Text size="sm" variant="muted">
                    Reinforce concepts with adaptive questions
                  </Text>
                </Stack>
              </SurfaceCard>
            </Link>

            <Link href="/lessons">
              <SurfaceCard className="cursor-pointer hover:shadow-md transition-all group">
                <Stack gap="sm">
                  <div className="p-3 rounded-lg bg-primary/10 w-fit">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <Text className="font-semibold group-hover:text-primary transition-colors">
                    Browse Lessons
                  </Text>
                  <Text size="sm" variant="muted">
                    Learn new concepts and topics
                  </Text>
                </Stack>
              </SurfaceCard>
            </Link>

            <Link href="/attempts">
              <SurfaceCard className="cursor-pointer hover:shadow-md transition-all group">
                <Stack gap="sm">
                  <div className="p-3 rounded-lg bg-primary/10 w-fit">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <Text className="font-semibold group-hover:text-primary transition-colors">
                    View History
                  </Text>
                  <Text size="sm" variant="muted">
                    See your practice attempts
                  </Text>
                </Stack>
              </SurfaceCard>
            </Link>
          </Grid>
        </Section>

        {/* Recent Activity */}
        {recentAttempts && recentAttempts.length > 0 && (
          <Section 
            title="Recent Activity" 
            action={{
              label: 'View All',
              onClick: () => router.push('/attempts')
            }}
          >
            <SurfaceCard>
              <Stack gap="sm">
                {recentAttempts.map((attempt, index) => (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        attempt.passed 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-red-500/10 text-red-600'
                      }`}>
                        {attempt.passed ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Code className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <Text className="font-medium">
                          {attempt.concept_name || 'Practice Task'}
                        </Text>
                        <Text size="xs" variant="muted">
                          {attempt.passed ? 'Completed' : 'Attempted'} • {new Date(attempt.created_at).toLocaleDateString()}
                        </Text>
                      </div>
                    </div>
                    <Badge variant={attempt.passed ? 'default' : 'secondary'} className={attempt.passed ? 'bg-green-600' : ''}>
                      {attempt.passed ? 'Passed' : 'Failed'}
                    </Badge>
                  </motion.div>
                ))}
              </Stack>
            </SurfaceCard>
          </Section>
        )}

        {/* Empty State - No Courses */}
        {!hasContent && (
          <div className="py-12">
            <EmptyState
              icon={GraduationCap}
              title="Start Your Learning Journey"
              description="You haven't enrolled in any courses yet. Browse lessons to get started!"
              action={{
                label: 'Browse Lessons',
                onClick: () => router.push('/lessons')
              }}
            />
            <div className="mt-8">
              <InfoPanel icon={Sparkles} title="How It Works" variant="info">
                <ul className="text-sm space-y-1">
                  <li>• Watch lessons and learn concepts</li>
                  <li>• Practice with adaptive questions</li>
                  <li>• Track your understanding in real-time</li>
                  <li>• Build streaks and stay motivated</li>
                </ul>
              </InfoPanel>
            </div>
          </div>
        )}
      </motion.div>
    </PageShell>
  )
}

export default function Home() {
  const { token, user } = useAuthStore()
  const router = useRouter()

  // If not authenticated, show landing page
  if (!token) {
    return <LandingPage />
  }

  // Redirect instructors
  if (user?.role === 'instructor' || user?.role === 'admin') {
    if (typeof window !== 'undefined') {
      router.push('/instructor')
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <DashboardContent />
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
