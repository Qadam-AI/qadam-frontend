'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Users, 
  Video, 
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
  GraduationCap,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Target,
  TrendingDown,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PilotBanner } from '@/components/feature-gate'

// Design System
import { PageShell, PageHeader, Section, Grid, Stack } from '@/design-system/layout'
import { MetricCard, SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { EmptyState, LoadingState, Skeleton } from '@/design-system/feedback'
import { Heading, Text } from '@/design-system/typography'

interface DashboardStats {
  total_courses: number
  total_students: number
  total_lessons: number
  recent_enrollments: number
}

interface RecentCourse {
  id: string
  title: string
  student_count: number
  lesson_count: number
  created_at: string
  cover_image_url?: string
}

interface SubscriptionUsage {
  courses_created: number
  storage_used_bytes: number
  storage_used_display: string
  tasks_generated_total: number
  tasks_generated_this_month: number
}

interface SubscriptionLimits {
  max_courses: number
  max_lessons_per_course: number
  max_storage_bytes: number
  max_storage_display: string
  max_tasks_total: number
  max_tasks_per_month: number
  max_students_per_course: number
  max_tasks_per_student: number
}

interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  description: string | null
}

interface SubscriptionInfo {
  subscription: {
    id: string
    status: string
    billing_cycle: string
    expires_at: string | null
    plan: SubscriptionPlan
  }
  plan: SubscriptionPlan
  usage: SubscriptionUsage
  limits: SubscriptionLimits
  courses_usage_percent: number
  storage_usage_percent: number
  tasks_usage_percent: number
}

interface ConceptAnalytics {
  concept_id: string
  concept_name: string
  course_title: string
  struggling_count: number
  struggling_percentage: number
  avg_pass_rate: number
  total_attempts: number
}

interface StudentActivity {
  user_id: string
  user_name: string
  user_email: string
  status: 'active' | 'at-risk' | 'inactive'
  last_activity: string | null
  total_attempts: number
  pass_rate: number
}

export default function InstructorDashboard() {
  const { user } = useAuth()

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn: async () => {
      const res = await api.get<DashboardStats>('/instructor/dashboard')
      return res.data
    }
  })

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const res = await api.get<RecentCourse[]>('/instructor/courses')
      return res.data
    }
  })


  // Fetch teaching insights (concepts that need attention)
  const { data: strugglingConcepts } = useQuery<ConceptAnalytics[]>({
    queryKey: ['struggling-concepts'],
    queryFn: async () => {
      const res = await api.get('/instructor/analytics/concepts')
      const data = res.data || []
      return data.filter((c: ConceptAnalytics) => c.struggling_percentage > 30)
        .sort((a: ConceptAnalytics, b: ConceptAnalytics) => b.struggling_percentage - a.struggling_percentage)
        .slice(0, 5)
    }
  })

  // Fetch at-risk students
  const { data: atRiskStudents } = useQuery<StudentActivity[]>({
    queryKey: ['at-risk-students'],
    queryFn: async () => {
      const res = await api.get('/instructor/students')
      const data = res.data || []
      return data.filter((s: StudentActivity) => s.status === 'at-risk' || s.status === 'inactive')
        .slice(0, 5)
    }
  })

  // Calculate actionable metrics
  const needsAttention = (strugglingConcepts?.length || 0) + (atRiskStudents?.length || 0)

  return (
    <PageShell maxWidth="2xl">
      {/* Pilot Banner */}
      <PilotBanner />

      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Instructor'}!`}
        description="Your teaching dashboard - track student progress and identify where to focus your attention"
        action={
          <Link href="/instructor/courses/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Course
            </Button>
          </Link>
        }
      />

      {/* Actionable Teaching Metrics */}
      <Section>
        <Grid cols={4} gap="md">
          <MetricCard
            label="Needs Attention"
            value={needsAttention}
            icon={AlertTriangle}
            variant={needsAttention > 0 ? "warning" : "success"}
            trend={
              needsAttention > 0
                ? { value: 'Students + concepts', positive: false }
                : { value: 'All on track', positive: true }
            }
          />
          <MetricCard
            label="Active Students"
            value={loadingStats ? '...' : stats?.total_students || 0}
            icon={Users}
            variant="info"
            trend={
              stats?.recent_enrollments
                ? { value: `+${stats.recent_enrollments} this week`, positive: true }
                : undefined
            }
          />
          <MetricCard
            label="Total Courses"
            value={loadingStats ? '...' : stats?.total_courses || 0}
            icon={BookOpen}
            variant="default"
          />
          <MetricCard
            label="Lessons Created"
            value={loadingStats ? '...' : stats?.total_lessons || 0}
            icon={Video}
            variant="default"
          />
        </Grid>
      </Section>

      {/* Critical Alerts - Students & Concepts Needing Attention */}
      {(strugglingConcepts && strugglingConcepts.length > 0) || (atRiskStudents && atRiskStudents.length > 0) ? (
        <Section>
          <InfoPanel 
            icon={AlertTriangle} 
            title="Immediate Attention Needed" 
            variant="warning"
          >
            <Stack gap="md">
              {/* Struggling Concepts */}
              {strugglingConcepts && strugglingConcepts.length > 0 && (
                <div>
                  <Text className="font-semibold mb-2">
                    {strugglingConcepts.length} concept{strugglingConcepts.length !== 1 ? 's' : ''} with low performance:
                  </Text>
                  <Stack gap="sm">
                    {strugglingConcepts.slice(0, 3).map((concept) => (
                      <div
                        key={concept.concept_id}
                        className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                      >
                        <div>
                          <Text className="font-medium text-sm">{concept.concept_name}</Text>
                          <Text className="text-xs text-muted-foreground">{concept.course_title}</Text>
                        </div>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {concept.struggling_count} struggling
                        </Badge>
                      </div>
                    ))}
                  </Stack>
                  <Link href="/instructor/mastery">
                    <Button variant="link" size="sm" className="mt-2 gap-2">
                      View all in Understanding Overview
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              )}

              {/* At-Risk Students */}
              {atRiskStudents && atRiskStudents.length > 0 && (
                <div className={strugglingConcepts && strugglingConcepts.length > 0 ? 'pt-4 border-t' : ''}>
                  <Text className="font-semibold mb-2">
                    {atRiskStudents.length} student{atRiskStudents.length !== 1 ? 's' : ''} inactive or at-risk:
                  </Text>
                  <Stack gap="sm">
                    {atRiskStudents.slice(0, 3).map((student) => (
                      <div
                        key={student.user_id}
                        className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                      >
                        <div>
                          <Text className="font-medium text-sm">{student.user_name}</Text>
                          <Text className="text-xs text-muted-foreground">
                            {student.last_activity 
                              ? `Last active: ${new Date(student.last_activity).toLocaleDateString()}`
                              : 'Never active'}
                          </Text>
                        </div>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          {student.status === 'inactive' ? 'Inactive' : 'At Risk'}
                        </Badge>
                      </div>
                    ))}
                  </Stack>
                  <Link href="/instructor/students">
                    <Button variant="link" size="sm" className="mt-2 gap-2">
                      View all students
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              )}
            </Stack>
          </InfoPanel>
        </Section>
      ) : (
        <Section>
          <InfoPanel icon={CheckCircle2} title="All On Track!" variant="success">
            <Text className="text-sm">
              No concepts or students need immediate attention. Great work! Keep monitoring the Understanding Overview for trends.
            </Text>
          </InfoPanel>
        </Section>
      )}


      {/* Your Courses */}
      <Section
        title="Your Courses"
        action={
          <Link href="/instructor/courses">
            <Button variant="ghost" size="sm" className="gap-2">
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      >
        {loadingCourses ? (
          <Grid cols={3} gap="md">
            {[1, 2, 3].map(i => (
              <SurfaceCard key={i} padding="lg">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex gap-4">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </SurfaceCard>
            ))}
          </Grid>
        ) : courses?.length === 0 ? (
          <SurfaceCard variant="muted" padding="lg">
            <EmptyState
              icon={GraduationCap}
              title="Create Your First Course"
              description="Start sharing your knowledge! Create a course, add lessons, extract concepts, and invite students."
              action={{
                label: 'Create Course',
                onClick: () => window.location.href = '/instructor/courses/new'
              }}
            />
          </SurfaceCard>
        ) : (
          <Grid cols={3} gap="md">
            {courses?.slice(0, 6).map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/instructor/courses/${course.id}`}>
                  <SurfaceCard className="group cursor-pointer hover:shadow-md hover:border-primary/50 transition-all h-full flex flex-col">
                    {/* Course Cover Image */}
                    <div className="w-[calc(100%+3rem)] aspect-video bg-gradient-to-br from-primary/10 via-indigo-500/10 to-purple-500/10 relative overflow-hidden rounded-t-lg -mt-6 -mx-6 mb-4">
                      {course.cover_image_url ? (
                        <img 
                          src={course.cover_image_url} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <BookOpen className="h-12 w-12 text-muted-foreground/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1.5">
                        <Video className="h-4 w-4" />
                        <span>{course.lesson_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>{course.student_count}</span>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        onClick={(e) => {
                          e.preventDefault()
                          window.location.href = `/instructor/courses/${course.id}`
                        }}
                      >
                        View Course
                      </Button>
                    </div>
                  </SurfaceCard>
                </Link>
              </motion.div>
            ))}
          </Grid>
        )}
      </Section>

      {/* Quick Actions */}
      <Section title="Quick Actions">
        <Grid cols={3} gap="md">
          <Link href="/instructor/ai-tools">
            <SurfaceCard className="group cursor-pointer hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Text className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    Extract Concepts
                  </Text>
                  <Text size="sm" variant="muted">
                    Analyze lesson content with AI
                  </Text>
                </div>
              </div>
            </SurfaceCard>
          </Link>

          <Link href="/instructor/mastery">
            <SurfaceCard className="group cursor-pointer hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Text className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    Understanding Overview
                  </Text>
                  <Text size="sm" variant="muted">
                    See student performance visually
                  </Text>
                </div>
              </div>
            </SurfaceCard>
          </Link>

          <Link href="/instructor/assessments-hub">
            <SurfaceCard className="group cursor-pointer hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Text className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    Create Assessment
                  </Text>
                  <Text size="sm" variant="muted">
                    Quizzes, exams, and tests
                  </Text>
                </div>
              </div>
            </SurfaceCard>
          </Link>
        </Grid>
      </Section>
    </PageShell>
  )
}
