'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
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
      const res = await api.get<EnrolledCourse[]>('/instructor/my-courses')
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
            <Grid cols={3} gap="md">
              {courses?.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/courses/${course.course_id}`}>
                    <SurfaceCard className="overflow-hidden hover:shadow-lg transition-all group cursor-pointer h-full">
                      {/* Thumbnail */}
                      <div className="relative h-36 bg-gradient-to-br from-primary/20 via-indigo-500/10 to-purple-500/20">
                        {course.thumbnail_url ? (
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.course_title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="h-14 w-14 text-primary/30" />
                          </div>
                        )}
                        
                        {/* Completion badge */}
                        {course.progress_percent === 100 && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-green-600 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Complete
                            </Badge>
                          </div>
                        )}
                        
                        {/* Gradient overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
                      </div>

                      <div className="p-5 space-y-4 -mt-4 relative">
                        <div>
                          <Heading level={4} className="line-clamp-2 group-hover:text-primary transition-colors mb-1">
                            {course.course_title}
                          </Heading>
                          {course.instructor_name && (
                            <Text size="sm" variant="muted">
                              by {course.instructor_name}
                            </Text>
                          )}
                        </div>

                        {/* Progress */}
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <Text size="sm" variant="muted">
                              {course.lessons_completed ?? 0} of {course.total_lessons ?? 0} lessons
                            </Text>
                            <Text size="sm" className="font-semibold text-primary">
                              {Math.round(course.progress_percent ?? 0)}%
                            </Text>
                          </div>
                          <Progress value={course.progress_percent ?? 0} className="h-2" />
                        </div>

                        {/* Continue button */}
                        <Button 
                          className="w-full gap-2 group-hover:gap-3 transition-all" 
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
                              <ArrowRight className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              <BookOpen className="h-4 w-4" />
                              Start Learning
                            </>
                          )}
                        </Button>
                      </div>
                    </SurfaceCard>
                  </Link>
                </motion.div>
              ))}
            </Grid>
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
