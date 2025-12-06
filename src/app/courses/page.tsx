'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Play, 
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

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

export default function MyCoursesPage() {
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const res = await api.get<EnrolledCourse[]>('/api/v1/instructor/my-courses')
      return res.data
    }
  })

  const { data: invitations } = useQuery({
    queryKey: ['my-invitations'],
    queryFn: async () => {
      const res = await api.get('/api/v1/instructor/my-invitations')
      return res.data
    }
  })

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground mt-1">
            Continue learning where you left off
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg py-1.5 px-3">
            {courses?.length || 0} Enrolled
          </Badge>
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {invitations.map((inv: any) => (
                <div 
                  key={inv.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-background border"
                >
                  <div>
                    <p className="font-medium">{inv.course_title}</p>
                    <p className="text-sm text-muted-foreground">
                      From {inv.instructor_name || 'Instructor'}
                    </p>
                  </div>
                  <Link href={`/courses/join/${inv.invite_token}`}>
                    <Button size="sm">
                      Accept
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No courses yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You haven't enrolled in any courses yet. Ask your instructor 
              for an invitation link to get started.
            </p>
            <Link href="/lessons">
              <Button variant="outline" size="lg">
                Browse Free Lessons
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                {/* Thumbnail */}
                <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.course_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-12 w-12 text-primary/40" />
                  )}
                </div>

                <CardContent className="p-4 space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-2">
                        {course.course_title}
                      </h3>
                      {course.status === 'completed' && (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    {course.instructor_name && (
                      <p className="text-sm text-muted-foreground">
                        By {course.instructor_name}
                      </p>
                    )}
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">
                        {course.lessons_completed} of {course.total_lessons} lessons
                      </span>
                      <span className="font-medium">
                        {Math.round(course.progress_percent)}%
                      </span>
                    </div>
                    <Progress value={course.progress_percent} className="h-2" />
                  </div>

                  {/* Continue button */}
                  <Link href={`/courses/${course.course_id}`}>
                    <Button className="w-full gap-2" variant={
                      course.progress_percent > 0 ? 'default' : 'outline'
                    }>
                      {course.progress_percent > 0 ? (
                        <>
                          <Play className="h-4 w-4" />
                          Continue Learning
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-4 w-4" />
                          Start Course
                        </>
                      )}
                    </Button>
                  </Link>

                  {/* Last lesson */}
                  {course.last_lesson_title && (
                    <p className="text-xs text-muted-foreground truncate">
                      Last: {course.last_lesson_title}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
