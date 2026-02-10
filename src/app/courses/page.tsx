'use client'

import { useQuery } from '@tanstack/react-query'
import api, { getImageUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Play, 
  CheckCircle2,
  Clock,
  Trophy,
  ArrowRight,
  GraduationCap
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Navbar } from '../_components/navbar'
import { Sidebar } from '../_components/sidebar'
import { AuthGuard } from '../_components/auth-guard'

// Design System
import { PageShell, PageHeader, Section, Grid, Stack } from '@/design-system/layout'
import { MetricCard, SurfaceCard } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text } from '@/design-system/typography'

interface EnrolledCourse {
  id: string
  course_id: string
  course_title: string
  course_description?: string
  instructor_name?: string
  enrolled_at: string
  status: string
  lessons_completed: number
  total_lessons: number
  progress_percent: number
  last_lesson_id?: string
  last_lesson_title?: string
  thumbnail_url?: string
}

function MyCoursesContent() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const res = await api.get<EnrolledCourse[]>('/enrollments/my-courses')
      return res.data
    }
  })

  const completedCourses = courses?.filter(c => (c.progress_percent ?? 0) === 100).length || 0
  const inProgressCourses = courses?.filter(c => (c.progress_percent ?? 0) > 0 && (c.progress_percent ?? 0) < 100).length || 0
  const totalProgress = courses?.length 
    ? Math.round(courses.reduce((sum, c) => sum + (c.progress_percent ?? 0), 0) / courses.length) 
    : 0

  if (isLoading) {
    return (
      <PageShell maxWidth="2xl">
        <LoadingState message="Loading your courses..." />
      </PageShell>
    )
  }

  return (
    <PageShell maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <PageHeader
          title="My Courses"
          description="Your enrolled courses and learning progress"
        />

        {/* Quick Stats */}
        <Section>
          <Grid cols={4} gap="md">
            <MetricCard
              label="Enrolled"
              value={courses?.length || 0}
              icon={BookOpen}
              variant="info"
            />
            <MetricCard
              label="In Progress"
              value={inProgressCourses}
              icon={Clock}
              variant="warning"
            />
            <MetricCard
              label="Completed"
              value={completedCourses}
              icon={Trophy}
              variant="success"
            />
            <MetricCard
              label="Overall"
              value={`${totalProgress}%`}
              icon={GraduationCap}
              variant="default"
            />
          </Grid>
        </Section>

        {/* Courses Grid */}
        {courses?.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={GraduationCap}
              title="No courses yet"
              description="You haven't enrolled in any courses. Browse lessons to start learning!"
              action={{
                label: 'Browse Lessons',
                onClick: () => window.location.href = '/lessons'
              }}
            />
          </div>
        ) : (
          <Section title="Continue Learning" description="Pick up where you left off">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses?.map((course, index) => (
                <motion.div
                  key={course.enrollment_id || course.course_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/courses/${course.course_id}`}>
                    <SurfaceCard className="group h-full flex flex-col cursor-pointer hover:shadow-md hover:border-primary/50 transition-all">
                      {/* Course Image - matching instructor style */}
                      <div className="w-[calc(100%+3rem)] aspect-video bg-gradient-to-br from-primary/10 via-indigo-500/10 to-purple-500/10 relative overflow-hidden rounded-t-lg -mt-6 -mx-6 mb-4">
                        {course.thumbnail_url ? (
                          <img 
                            src={getImageUrl(course.thumbnail_url)}
                            alt={course.course_title}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <BookOpen className="h-10 w-10 opacity-20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

                        
                        
                        {/* Progress badge */}
                        {course.progress_percent === 100 ? (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-green-600 text-white gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </Badge>
                          </div>
                        ) : (course.progress_percent ?? 0) > 0 ? (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-primary text-white">
                              {Math.round(course.progress_percent ?? 0)}%
                            </Badge>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg line-clamp-1 mb-1">{course.course_title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {course.course_description || 'No description'}
                          </p>
                        </div>
                      </div>

                      {/* Stats bar */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4" />
                          <span>{course.total_lessons ?? 0}</span>
                        </div>
                        {course.instructor_name && (
                          <div className="flex items-center gap-1.5">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="truncate">{course.instructor_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      {(course.total_lessons ?? 0) > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-muted-foreground">
                              {course.lessons_completed ?? 0} of {course.total_lessons} completed
                            </span>
                            <span className="font-medium text-primary">
                              {Math.round(course.progress_percent ?? 0)}%
                            </span>
                          </div>
                          <Progress value={course.progress_percent ?? 0} className="h-2" />
                        </div>
                      )}

                      {/* Action button */}
                      <Button 
                        className="w-full gap-2" 
                        variant={(course.progress_percent ?? 0) > 0 ? 'default' : 'outline'}
                      >
                        {(course.progress_percent ?? 0) === 100 ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Review Course
                          </>
                        ) : (course.progress_percent ?? 0) > 0 ? (
                          <>
                            <Play className="h-4 w-4" />
                            Continue
                            <ArrowRight className="h-4 w-4 ml-auto" />
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Start Course
                          </>
                        )}
                      </Button>
                    </SurfaceCard>
                  </Link>
                </motion.div>
              ))}
            </div>
          </Section>
        )}
      </motion.div>
    </PageShell>
  )
}

export default function MyCoursesPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <MyCoursesContent />
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
