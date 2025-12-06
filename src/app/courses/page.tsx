'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Play, 
  CheckCircle2,
  Clock,
  Trophy,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Mail
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '../_components/navbar'
import { Sidebar } from '../_components/sidebar'
import { Footer } from '../_components/footer'
import { AuthGuard } from '../_components/auth-guard'

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

interface PendingInvitation {
  id: string
  course_title: string
  instructor_name?: string
  invite_token: string
}

function MyCoursesContent() {
  const { user } = useAuth()

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
      const res = await api.get<PendingInvitation[]>('/api/v1/instructor/my-invitations')
      return res.data
    }
  })

  const completedCourses = courses?.filter(c => c.progress_percent === 100).length || 0
  const inProgressCourses = courses?.filter(c => c.progress_percent > 0 && c.progress_percent < 100).length || 0
  const totalProgress = courses?.length 
    ? Math.round(courses.reduce((sum, c) => sum + c.progress_percent, 0) / courses.length) 
    : 0

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-4xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground mt-2">
          Continue learning where you left off
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Enrolled</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {courses?.length || 0}
                  </p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Total courses</p>
                </div>
                <div className="p-3 rounded-full bg-blue-200 dark:bg-blue-800">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">In Progress</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                    {inProgressCourses}
                  </p>
                  <p className="text-xs text-orange-600/70 dark:text-orange-400/70">Active learning</p>
                </div>
                <div className="p-3 rounded-full bg-orange-200 dark:bg-orange-800">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Completed</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {completedCourses}
                  </p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70">
                    {completedCourses > 0 ? '🎉 Great job!' : 'Keep going!'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-200 dark:bg-green-800">
                  <Trophy className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Overall</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {totalProgress}%
                  </p>
                  <Progress value={totalProgress} className="h-1.5 mt-2 w-24" />
                </div>
                <div className="p-3 rounded-full bg-purple-200 dark:bg-purple-800">
                  <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-indigo-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Pending Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {invitations.map((inv, index) => (
                  <motion.div 
                    key={inv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-background border shadow-sm"
                  >
                    <div>
                      <p className="font-medium">{inv.course_title}</p>
                      {inv.instructor_name && (
                        <p className="text-sm text-muted-foreground">
                          From {inv.instructor_name}
                        </p>
                      )}
                    </div>
                    <Link href={`/courses/join/${inv.invite_token}`}>
                      <Button size="sm" className="gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        Accept
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Courses Grid */}
      <motion.div variants={itemVariants}>
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <div className="h-32 bg-muted" />
                <CardContent className="pt-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses?.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-20 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-indigo-500/10 flex items-center justify-center mb-6">
                  <GraduationCap className="h-12 w-12 text-primary" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold mb-3">Start Your Learning Journey</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You haven't enrolled in any courses yet. Ask your instructor 
                for an invitation link or explore our free lessons.
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/lessons">
                  <Button size="lg" className="gap-2">
                    <BookOpen className="h-5 w-5" />
                    Browse Free Lessons
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-4">Continue Learning</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses?.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/courses/${course.course_id}`}>
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer h-full">
                      {/* Thumbnail */}
                      <div className="relative h-36 bg-gradient-to-br from-primary/30 via-indigo-500/20 to-purple-500/30 overflow-hidden">
                        {course.thumbnail_url ? (
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.course_title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="h-14 w-14 text-primary/40" />
                          </div>
                        )}
                        {/* Progress overlay */}
                        {course.progress_percent === 100 && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-green-500 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </Badge>
                          </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
                      </div>

                      <CardContent className="p-5 space-y-4 -mt-4 relative">
                        <div>
                          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                            {course.course_title}
                          </h3>
                          {course.instructor_name && (
                            <p className="text-sm text-muted-foreground mt-1">
                              By {course.instructor_name}
                            </p>
                          )}
                        </div>

                        {/* Progress */}
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">
                              {course.lessons_completed} of {course.total_lessons} lessons
                            </span>
                            <span className="font-semibold text-primary">
                              {Math.round(course.progress_percent)}%
                            </span>
                          </div>
                          <Progress value={course.progress_percent} className="h-2" />
                        </div>

                        {/* Continue button */}
                        <Button className="w-full gap-2 group-hover:gap-3 transition-all" variant={
                          course.progress_percent > 0 ? 'default' : 'outline'
                        }>
                          {course.progress_percent === 100 ? (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Review Course
                            </>
                          ) : course.progress_percent > 0 ? (
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
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function MyCoursesPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <MyCoursesContent />
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </AuthGuard>
  )
}
