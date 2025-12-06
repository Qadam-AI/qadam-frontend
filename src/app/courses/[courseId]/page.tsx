'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  Play,
  Video,
  FileText,
  CheckCircle2,
  Lock,
  Clock,
  User
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CourseDetails {
  id: string
  title: string
  description?: string
  instructor_name?: string
  thumbnail_url?: string
  total_lessons: number
  completed_lessons: number
  progress_percent: number
  enrolled_at: string
  lessons: LessonItem[]
}

interface LessonItem {
  id: string
  title: string
  description?: string
  content_type: 'video' | 'text' | 'file'
  duration_minutes?: number
  position: number
  is_completed: boolean
  is_locked: boolean
  progress_percent?: number
}

export default function CourseViewPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const courseId = params.courseId as string

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-view', courseId],
    queryFn: async () => {
      // Get course details from enrolled courses perspective
      const res = await api.get<CourseDetails>(`/api/v1/courses/${courseId}/enrolled`)
      return res.data
    }
  })

  const markCompleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      await api.post(`/api/v1/courses/${courseId}/lessons/${lessonId}/complete`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-view', courseId] })
    }
  })

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-8">
      {/* Back button */}
      <Link href="/courses">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to My Courses
        </Button>
      </Link>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      ) : course ? (
        <>
          {/* Course Header */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {course.thumbnail_url ? (
                <img 
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Play className="h-10 w-10 text-primary/40" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold">{course.title}</h1>
                {course.instructor_name && (
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>By {course.instructor_name}</span>
                  </div>
                )}
              </div>
            </div>

            {course.description && (
              <p className="text-muted-foreground">{course.description}</p>
            )}

            {/* Progress */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Course Progress</span>
                  <span className="text-2xl font-bold text-primary">
                    {Math.round(course.progress_percent)}%
                  </span>
                </div>
                <Progress value={course.progress_percent} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  {course.completed_lessons} of {course.total_lessons} lessons completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lessons List */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Course Content</h2>
            
            {course.lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "overflow-hidden transition-all",
                  lesson.is_locked && "opacity-60",
                  lesson.is_completed && "border-green-500/30 bg-green-500/5"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Lesson number / status */}
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        lesson.is_completed 
                          ? "bg-green-500 text-white" 
                          : lesson.is_locked 
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary"
                      )}>
                        {lesson.is_completed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : lesson.is_locked ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <span className="font-semibold">{lesson.position}</span>
                        )}
                      </div>

                      {/* Content type icon */}
                      <div className="flex-shrink-0">
                        {lesson.content_type === 'video' ? (
                          <Video className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-amber-500" />
                        )}
                      </div>

                      {/* Lesson info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{lesson.title}</h3>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {lesson.description}
                          </p>
                        )}
                        {lesson.duration_minutes && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {lesson.duration_minutes} min
                          </div>
                        )}
                      </div>

                      {/* Action button */}
                      <div className="flex-shrink-0">
                        {lesson.is_locked ? (
                          <Button disabled variant="ghost" size="sm">
                            <Lock className="h-4 w-4 mr-2" />
                            Locked
                          </Button>
                        ) : lesson.is_completed ? (
                          <Link href={`/lesson/${lesson.id}`}>
                            <Button variant="outline" size="sm">
                              <Play className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/lesson/${lesson.id}`}>
                            <Button size="sm">
                              <Play className="h-4 w-4 mr-2" />
                              Start
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Progress bar for in-progress lessons */}
                    {!lesson.is_completed && !lesson.is_locked && lesson.progress_percent && lesson.progress_percent > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{Math.round(lesson.progress_percent)}%</span>
                        </div>
                        <Progress value={lesson.progress_percent} className="h-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Completion badge */}
          {course.progress_percent === 100 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <span className="font-semibold text-green-600 dark:text-green-400">
                  Course Completed! 🎉
                </span>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Course not found or you're not enrolled.</p>
          <Link href="/courses">
            <Button variant="outline" className="mt-4">
              Go to My Courses
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
