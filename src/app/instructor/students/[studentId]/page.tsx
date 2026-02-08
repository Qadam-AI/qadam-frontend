'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api, { getImageUrl } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  BookOpen,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Calendar,
  GitBranch,
  Sparkles,
  BarChart3
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import Link from 'next/link'

// Design System
import { PageShell, PageHeader, Section, Grid, Stack } from '@/design-system/layout'
import { MetricCard, SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { EmptyState, LoadingState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'

// Visual map component
import { StudentConceptMap } from './components/StudentConceptMap'

interface StudentOverview {
  user_id: string
  user_name: string
  user_email: string
  avatar_url?: string
  total_courses: number
  concepts_mastered: number
  total_concepts: number
  overall_pass_rate: number
  total_attempts: number
  last_activity: string | null
  status: 'active' | 'at-risk' | 'inactive'
  created_at: string
}

interface EnrolledCourse {
  course_id: string
  course_title: string
  enrolled_at: string
  concepts_in_course: number
  concepts_mastered: number
  total_attempts: number
  pass_rate: number
  last_activity: string | null
  progress_percentage: number
}

interface RecentAttempt {
  id: string
  concept_id: string
  concept_name: string
  course_title: string
  passed: boolean
  score: number
  created_at: string
}

interface ConceptPerformance {
  concept_id: string
  concept_name: string
  course_id: string
  course_title: string
  total_attempts: number
  passed_attempts: number
  pass_rate: number
  status: 'not-started' | 'weak' | 'ok' | 'strong'
  last_attempt: string | null
}

export default function StudentProfilePage() {
  const params = useParams<{ studentId: string }>()
  const router = useRouter()
  const studentId = params?.studentId || ''

  const [selectedCourseId, setSelectedCourseId] = useState<string>('all')

  // Fetch student overview
  const { data: student, isLoading: loadingStudent } = useQuery<StudentOverview>({
    queryKey: ['student-overview', studentId],
    queryFn: async () => {
      const res = await api.get(`/instructor/students/${studentId}/overview`)
      return res.data
    },
  })

  // Fetch enrolled courses
  const { data: courses, isLoading: loadingCourses } = useQuery<EnrolledCourse[]>({
    queryKey: ['student-courses', studentId],
    queryFn: async () => {
      const res = await api.get(`/instructor/students/${studentId}/courses`)
      return res.data
    },
  })

  // Fetch recent activity
  const { data: recentAttempts } = useQuery<RecentAttempt[]>({
    queryKey: ['student-recent-attempts', studentId],
    queryFn: async () => {
      const res = await api.get(`/instructor/students/${studentId}/recent-attempts?limit=10`)
      return res.data
    },
  })

  // Fetch concept performance (for selected course or all)
  const { data: conceptPerformance, isLoading: loadingPerformance } = useQuery<ConceptPerformance[]>({
    queryKey: ['student-concept-performance', studentId, selectedCourseId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedCourseId !== 'all') {
        params.append('course_id', selectedCourseId)
      }
      const res = await api.get(`/instructor/analytics/students/${studentId}/concepts?${params}`)
      return res.data
    },
  })

  // Performance breakdown
  const performanceBreakdown = useMemo(() => {
    if (!conceptPerformance) return { mastered: 0, learning: 0, struggling: 0, notStarted: 0 }
    return {
      mastered: conceptPerformance.filter(c => c.status === 'strong').length,
      learning: conceptPerformance.filter(c => c.status === 'ok').length,
      struggling: conceptPerformance.filter(c => c.status === 'weak').length,
      notStarted: conceptPerformance.filter(c => c.status === 'not-started').length,
    }
  }, [conceptPerformance])

  if (loadingStudent) {
    return (
      <PageShell maxWidth="full">
        <LoadingState message="Loading student profile..." />
      </PageShell>
    )
  }

  if (!student) {
    return (
      <PageShell maxWidth="2xl">
        <EmptyState
          icon={AlertTriangle}
          title="Student not found"
          description="This student may have been removed or you don't have access"
          action={{
            label: 'Back to Students',
            onClick: () => router.push('/instructor/students')
          }}
        />
      </PageShell>
    )
  }

  const initials = student.user_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <PageShell maxWidth="full">
      {/* Back button */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/instructor/students')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Students
        </Button>
      </div>

      {/* Student Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <SurfaceCard className="mb-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20 text-2xl">
              <AvatarImage src={getImageUrl(student.avatar_url)} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Heading level={2} className="mb-1">{student.user_name}</Heading>
                  <Text variant="muted">{student.user_email}</Text>
                </div>
                <Badge
                  variant="outline"
                  className={
                    student.status === 'active'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : student.status === 'at-risk'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  }
                >
                  {student.status === 'active' ? (
                    <>
                      <Activity className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : student.status === 'at-risk' ? (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      At Risk
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined {new Date(student.created_at).toLocaleDateString()}
                  </span>
                </div>
                {student.last_activity && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>
                      Last active {formatDistanceToNow(new Date(student.last_activity), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SurfaceCard>
      </motion.div>

      {/* Key Metrics */}
      <Section>
        <Grid cols={4} gap="md">
          <MetricCard
            label="Courses Enrolled"
            value={student.total_courses}
            icon={BookOpen}
            variant="info"
          />
          <MetricCard
            label="Concepts Mastered"
            value={student.concepts_mastered}
            icon={CheckCircle2}
            variant="success"
            trend={{
              value: `${student.total_concepts} total`,
              positive: true
            }}
          />
          <MetricCard
            label="Overall Pass Rate"
            value={`${Math.round(student.overall_pass_rate)}%`}
            icon={Target}
            variant={
              student.overall_pass_rate >= 70
                ? 'success'
                : student.overall_pass_rate >= 50
                ? 'warning'
                : 'default'
            }
          />
          <MetricCard
            label="Total Attempts"
            value={student.total_attempts}
            icon={Activity}
            variant="default"
          />
        </Grid>
      </Section>

      {/* Enrolled Courses */}
      <Section
        title="Enrolled Courses"
        description="Student progress across all courses"
      >
        {loadingCourses ? (
          <LoadingState message="Loading courses..." />
        ) : !courses || courses.length === 0 ? (
          <SurfaceCard variant="muted" className="py-8">
            <EmptyState
              icon={BookOpen}
              title="No courses yet"
              description="This student hasn't enrolled in any courses"
            />
          </SurfaceCard>
        ) : (
          <Grid cols={3} gap="md">
            {courses.map((course, index) => (
              <motion.div
                key={course.course_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SurfaceCard
                  className={`cursor-pointer transition-all ${
                    selectedCourseId === course.course_id
                      ? 'border-primary shadow-md'
                      : 'hover:shadow-md hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedCourseId(course.course_id)}
                >
                  <div className="mb-4">
                    <Heading level={5} className="mb-2 line-clamp-2">
                      {course.course_title}
                    </Heading>
                    <Text className="text-xs text-muted-foreground">
                      Enrolled {formatDistanceToNow(new Date(course.enrolled_at), { addSuffix: true })}
                    </Text>
                  </div>

                  <div className="space-y-3">
                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{Math.round(course.progress_percentage)}%</span>
                      </div>
                      <Progress value={course.progress_percentage} className="h-2" />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                      <div>
                        <Text className="text-xs text-muted-foreground">Mastered</Text>
                        <Text className="text-sm font-semibold text-green-600">
                          {course.concepts_mastered}/{course.concepts_in_course}
                        </Text>
                      </div>
                      <div>
                        <Text className="text-xs text-muted-foreground">Pass Rate</Text>
                        <Text className="text-sm font-semibold">
                          {Math.round(course.pass_rate)}%
                        </Text>
                      </div>
                    </div>
                  </div>
                </SurfaceCard>
              </motion.div>
            ))}
          </Grid>
        )}
      </Section>

      {/* Visual Performance Map */}
      <Section
        title="Visual Performance Map"
        description="See how the student is progressing through concepts"
      >
        <div className="mb-4">
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="w-[300px]">
              <BookOpen className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses?.map((course) => (
                <SelectItem key={course.course_id} value={course.course_id}>
                  {course.course_title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCourseId === 'all' ? (
          <SurfaceCard variant="muted" className="py-12">
            <EmptyState
              icon={GitBranch}
              title="Select a course"
              description="Choose a specific course above to see the visual performance map"
            />
          </SurfaceCard>
        ) : (
          <StudentConceptMap
            studentId={studentId}
            courseId={selectedCourseId}
          />
        )}
      </Section>

      {/* Performance Breakdown */}
      <Section
        title="Concept Performance Breakdown"
        description="Detailed view of understanding by concept"
      >
        <Grid cols={4} gap="md" className="mb-6">
          <SurfaceCard variant="muted">
            <div className="flex items-center justify-between mb-2">
              <Text className="text-xs text-muted-foreground">Mastered</Text>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <Text className="text-2xl font-bold text-green-600">
              {performanceBreakdown.mastered}
            </Text>
          </SurfaceCard>
          <SurfaceCard variant="muted">
            <div className="flex items-center justify-between mb-2">
              <Text className="text-xs text-muted-foreground">Learning</Text>
              <Minus className="h-4 w-4 text-yellow-600" />
            </div>
            <Text className="text-2xl font-bold text-yellow-600">
              {performanceBreakdown.learning}
            </Text>
          </SurfaceCard>
          <SurfaceCard variant="muted">
            <div className="flex items-center justify-between mb-2">
              <Text className="text-xs text-muted-foreground">Struggling</Text>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <Text className="text-2xl font-bold text-red-600">
              {performanceBreakdown.struggling}
            </Text>
          </SurfaceCard>
          <SurfaceCard variant="muted">
            <div className="flex items-center justify-between mb-2">
              <Text className="text-xs text-muted-foreground">Not Started</Text>
              <AlertTriangle className="h-4 w-4 text-gray-400" />
            </div>
            <Text className="text-2xl font-bold text-gray-600">
              {performanceBreakdown.notStarted}
            </Text>
          </SurfaceCard>
        </Grid>

        {loadingPerformance ? (
          <LoadingState message="Loading performance data..." />
        ) : !conceptPerformance || conceptPerformance.length === 0 ? (
          <SurfaceCard variant="muted" className="py-8">
            <EmptyState
              icon={Target}
              title="No performance data"
              description="This student hasn't attempted any concepts yet"
            />
          </SurfaceCard>
        ) : (
          <Stack gap="md">
            {/* Struggling Concepts */}
            {performanceBreakdown.struggling > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <Heading level={4}>Needs Help</Heading>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {performanceBreakdown.struggling}
                  </Badge>
                </div>
                <Grid cols={2} gap="sm">
                  {conceptPerformance
                    .filter(c => c.status === 'weak')
                    .map((concept) => (
                      <SurfaceCard key={concept.concept_id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <Text className="font-semibold text-sm mb-1">
                              {concept.concept_name}
                            </Text>
                            <Text className="text-xs text-muted-foreground mb-2">
                              {concept.course_title}
                            </Text>
                            <Progress value={concept.pass_rate} className="h-1.5" />
                          </div>
                          <div className="text-right shrink-0">
                            <Text className="text-sm font-bold text-red-600">
                              {Math.round(concept.pass_rate)}%
                            </Text>
                            <Text className="text-xs text-muted-foreground">
                              {concept.passed_attempts}/{concept.total_attempts}
                            </Text>
                          </div>
                        </div>
                      </SurfaceCard>
                    ))}
                </Grid>
              </div>
            )}

            {/* Learning Concepts */}
            {performanceBreakdown.learning > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Minus className="h-5 w-5 text-yellow-600" />
                  <Heading level={4}>In Progress</Heading>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    {performanceBreakdown.learning}
                  </Badge>
                </div>
                <Grid cols={2} gap="sm">
                  {conceptPerformance
                    .filter(c => c.status === 'ok')
                    .slice(0, 4)
                    .map((concept) => (
                      <SurfaceCard key={concept.concept_id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <Text className="font-semibold text-sm mb-1">
                              {concept.concept_name}
                            </Text>
                            <Text className="text-xs text-muted-foreground mb-2">
                              {concept.course_title}
                            </Text>
                            <Progress value={concept.pass_rate} className="h-1.5" />
                          </div>
                          <div className="text-right shrink-0">
                            <Text className="text-sm font-bold text-yellow-600">
                              {Math.round(concept.pass_rate)}%
                            </Text>
                            <Text className="text-xs text-muted-foreground">
                              {concept.passed_attempts}/{concept.total_attempts}
                            </Text>
                          </div>
                        </div>
                      </SurfaceCard>
                    ))}
                </Grid>
              </div>
            )}

            {/* Mastered Concepts - Condensed */}
            {performanceBreakdown.mastered > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <Heading level={4}>Mastered</Heading>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {performanceBreakdown.mastered}
                  </Badge>
                </div>
                <SurfaceCard variant="muted">
                  <Text className="text-sm text-muted-foreground">
                    Student has mastered {performanceBreakdown.mastered} concept{performanceBreakdown.mastered !== 1 ? 's' : ''} with ≥80% pass rate
                  </Text>
                </SurfaceCard>
              </div>
            )}
          </Stack>
        )}
      </Section>

      {/* Recent Activity */}
      {recentAttempts && recentAttempts.length > 0 && (
        <Section
          title="Recent Activity"
          description="Latest practice attempts"
        >
          <SurfaceCard>
            <Stack gap="sm">
              {recentAttempts.slice(0, 8).map((attempt, index) => (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between py-2 border-b last:border-b-0 border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        attempt.passed ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <div>
                      <Text className="text-sm font-medium">{attempt.concept_name}</Text>
                      <Text className="text-xs text-muted-foreground">
                        {attempt.course_title}
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <Text className={`text-sm font-semibold ${
                        attempt.passed ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {attempt.passed ? 'Passed' : 'Failed'}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {Math.round(attempt.score)}%
                      </Text>
                    </div>
                    <Text className="text-xs text-muted-foreground w-24">
                      {formatDistanceToNow(new Date(attempt.created_at), { addSuffix: true })}
                    </Text>
                  </div>
                </motion.div>
              ))}
            </Stack>
          </SurfaceCard>
        </Section>
      )}

      {/* Quick Actions */}
      <Section title="Instructor Actions">
        <Grid cols={3} gap="md">
          <Link href={`/instructor/ai-tools?student=${studentId}`}>
            <SurfaceCard className="group cursor-pointer hover:shadow-md hover:border-primary/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <Text className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    Generate Custom Practice
                  </Text>
                  <Text size="sm" variant="muted">
                    AI-tailored to weak areas
                  </Text>
                </div>
              </div>
            </SurfaceCard>
          </Link>

          <Link href={`/instructor/mastery?student=${studentId}`}>
            <SurfaceCard className="group cursor-pointer hover:shadow-md hover:border-primary/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <Text className="font-semibold mb-1 group-hover:text-primary transition-colors">
                    View in Mastery
                  </Text>
                  <Text size="sm" variant="muted">
                    Compare with other students
                  </Text>
                </div>
              </div>
            </SurfaceCard>
          </Link>

          <SurfaceCard className="group cursor-pointer hover:shadow-md hover:border-primary/50 transition-all opacity-50">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gray-100 shrink-0">
                <Target className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <Text className="font-semibold mb-1">
                  Send Feedback
                </Text>
                <Text size="sm" variant="muted">
                  Coming soon
                </Text>
              </div>
            </div>
          </SurfaceCard>
        </Grid>
      </Section>
    </PageShell>
  )
}
