'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  Play,
  CheckCircle2,
  Lock,
  Clock,
  User,
  Target,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Navbar } from '../../_components/navbar'
import { Sidebar } from '../../_components/sidebar'
import { AuthGuard } from '../../_components/auth-guard'

// Design System
import { PageShell, Section, Stack, Grid } from '@/design-system/layout'
import { SurfaceCard, MetricCard, InfoPanel } from '@/design-system/surfaces'
import { LoadingState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'

interface CourseDetails {
  id: string
  title: string
  description?: string
  instructorName?: string
  thumbnailUrl?: string
  totalLessons: number
  completedLessons: number
  progressPercent: number
  enrolledAt: string
  lessons: LessonItem[]
}

interface LessonItem {
  id: string
  title: string
  description?: string
  contentType: 'video' | 'text' | 'file'
  durationMinutes?: number
  position: number
  isCompleted: boolean
  isLocked: boolean
  progressPercent?: number
}

function CourseDetailContent() {
  const params = useParams()
  const queryClient = useQueryClient()
  const courseId = params.courseId as string

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-view', courseId],
    queryFn: async () => {
      const res = await api.get<CourseDetails>(`/courses/${courseId}/enrolled`)
      return res.data
    }
  })

  const markCompleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      await api.post(`/courses/${courseId}/lessons/${lessonId}/complete`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-view', courseId] })
    }
  })

  if (isLoading) {
    return (
      <PageShell maxWidth="2xl">
        <LoadingState message="Loading course..." />
      </PageShell>
    )
  }

  if (!course) {
    return (
      <PageShell maxWidth="lg">
        <Text variant="muted">Course not found</Text>
      </PageShell>
    )
  }

  const nextLesson = course.lessons.find(l => !l.isCompleted && !l.isLocked)

  return (
    <PageShell maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Back button */}
        <Link href="/courses">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            My Courses
          </Button>
        </Link>

        {/* Course Header */}
        <SurfaceCard variant="elevated">
          <div className="flex items-start gap-6">
            {course.thumbnailUrl ? (
              <img 
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-32 h-32 rounded-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-14 w-14 text-primary/30" />
              </div>
            )}
            <div className="flex-1">
              <Heading level={1} className="mb-2">{course.title}</Heading>
              {course.instructorName && (
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <User className="h-4 w-4" />
                  <Text variant="muted">by {course.instructorName}</Text>
                </div>
              )}
              {course.description && (
                <Text variant="muted">{course.description}</Text>
              )}
            </div>
          </div>
        </SurfaceCard>

        {/* Progress Card */}
        <SurfaceCard variant="muted">
          <Stack gap="md">
            <div className="flex items-center justify-between">
              <LabelText>Course Progress</LabelText>
              <Text className="text-2xl font-bold text-primary">
                {Math.round(course.progressPercent)}%
              </Text>
            </div>
            <Progress value={course.progressPercent} className="h-3" />
            <Text size="sm" variant="muted">
              {course.completedLessons} of {course.totalLessons} lessons completed
            </Text>
          </Stack>
        </SurfaceCard>

        {/* Next Up */}
        {nextLesson && (
          <InfoPanel icon={Target} title="Next Up" variant="info">
            <div className="flex items-center justify-between">
              <Text size="sm">{nextLesson.title}</Text>
              <Link href={`/lesson/${nextLesson.id}`}>
                <Button size="sm" className="gap-2">
                  <Play className="h-4 w-4" />
                  Continue
                </Button>
              </Link>
            </div>
          </InfoPanel>
        )}

        {/* Lessons List */}
        <Section title="Course Content" description={`${course.totalLessons} lessons`}>
          <Stack gap="sm">
            {course.lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Link 
                  href={lesson.isLocked ? '#' : `/lesson/${lesson.id}`}
                  className={lesson.isLocked ? 'pointer-events-none' : ''}
                >
                  <SurfaceCard 
                    className={cn(
                      "transition-all",
                      lesson.isLocked ? 'opacity-60' : 'hover:shadow-md cursor-pointer'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {/* Number/Icon */}
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 font-semibold",
                        lesson.isCompleted 
                          ? 'bg-green-500/10 text-green-600' 
                          : lesson.isLocked
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/10 text-primary'
                      )}>
                        {lesson.isCompleted ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : lesson.isLocked ? (
                          <Lock className="h-5 w-5" />
                        ) : (
                          <span>{lesson.position}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <Text className="font-medium mb-1">
                          {lesson.title}
                        </Text>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {lesson.durationMinutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {lesson.durationMinutes} min
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {lesson.contentType}
                          </Badge>
                          {lesson.isLocked && (
                            <Badge variant="secondary" className="text-xs">
                              Locked
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="shrink-0">
                        {lesson.isCompleted ? (
                          <Badge variant="default" className="bg-green-600 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Done
                          </Badge>
                        ) : lesson.isLocked ? (
                          <Badge variant="secondary">Locked</Badge>
                        ) : (
                          <Button size="sm" variant="ghost" className="gap-2">
                            Start
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </SurfaceCard>
                </Link>
              </motion.div>
            ))}
          </Stack>
        </Section>
      </motion.div>
    </PageShell>
  )
}

export default function CourseViewPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <CourseDetailContent />
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
