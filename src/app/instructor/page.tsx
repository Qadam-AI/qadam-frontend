'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
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
  Clock,
  CheckCircle2,
  UserPlus,
  Crown,
  HardDrive,
  Zap,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PilotBanner } from '@/components/feature-gate'

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

  const { data: subscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['subscription-info'],
    queryFn: async () => {
      const res = await api.get<SubscriptionInfo>('/subscriptions/my')
      return res.data
    }
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
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
      {/* Pilot Banner */}
      <PilotBanner />

      {/* Welcome Header - Clean style */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Instructor'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Create courses, add lesson content, extract concepts, and track student mastery.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/instructor/courses/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Course
            </Button>
          </Link>
          <Link href="/instructor/courses">
            <Button variant="outline" className="gap-2">
              View All Courses
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid - Matching main dashboard style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Courses</p>
                  {loadingStats ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats?.total_courses || 0}</p>
                  )}
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Active courses</p>
                </div>
                <div className="p-3 rounded-full bg-blue-200 dark:bg-blue-800">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800 overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Students</p>
                  {loadingStats ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats?.total_students || 0}</p>
                  )}
                  <p className="text-xs text-green-600/70 dark:text-green-400/70">Enrolled learners</p>
                </div>
                <div className="p-3 rounded-full bg-green-200 dark:bg-green-800">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Lessons</p>
                  {loadingStats ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats?.total_lessons || 0}</p>
                  )}
                  <p className="text-xs text-purple-600/70 dark:text-purple-400/70">Content pieces</p>
                </div>
                <div className="p-3 rounded-full bg-purple-200 dark:bg-purple-800">
                  <Video className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className={`bg-gradient-to-br overflow-hidden ${
            (stats?.recent_enrollments || 0) > 0 
              ? 'from-orange-100 to-orange-200/50 dark:from-orange-900/40 dark:to-orange-800/30 border-orange-200 dark:border-orange-800'
              : 'from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">New This Week</p>
                  {loadingStats ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{stats?.recent_enrollments || 0}</p>
                  )}
                  <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
                    {(stats?.recent_enrollments || 0) > 0 ? '🔥 New enrollments!' : 'Recent enrollments'}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  (stats?.recent_enrollments || 0) > 0 
                    ? 'bg-orange-300 dark:bg-orange-700' 
                    : 'bg-orange-200 dark:bg-orange-800'
                }`}>
                  <TrendingUp className={`h-6 w-6 ${
                    (stats?.recent_enrollments || 0) > 0
                      ? 'text-orange-700 dark:text-orange-200'
                      : 'text-orange-600 dark:text-orange-300'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Subscription Usage */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">
                  {loadingSubscription ? (
                    <Skeleton className="h-6 w-32" />
                  ) : (
                    <>
                      {subscription?.plan?.display_name || 'Free'} Plan
                    </>
                  )}
                </CardTitle>
              </div>
              <Link href="/pricing">
                <Button variant="outline" size="sm" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Upgrade
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loadingSubscription ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            ) : subscription ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Courses Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      Courses
                    </span>
                    <span className="font-medium">
                      {subscription.usage.courses_created} / {subscription.limits.max_courses === 999999 ? '∞' : subscription.limits.max_courses}
                    </span>
                  </div>
                  <Progress 
                    value={subscription.limits.max_courses === 999999 ? 0 : subscription.courses_usage_percent} 
                    className={`h-2 ${subscription.courses_usage_percent >= 90 ? '[&>div]:bg-red-500' : subscription.courses_usage_percent >= 70 ? '[&>div]:bg-yellow-500' : ''}`}
                  />
                  {subscription.courses_usage_percent >= 80 && subscription.limits.max_courses !== 999999 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {subscription.courses_usage_percent >= 100 ? 'Limit reached' : 'Approaching limit'}
                    </p>
                  )}
                </div>

                {/* Storage Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <HardDrive className="h-4 w-4" />
                      Storage
                    </span>
                    <span className="font-medium">
                      {subscription.usage.storage_used_display} / {subscription.limits.max_storage_display}
                    </span>
                  </div>
                  <Progress 
                    value={subscription.storage_usage_percent} 
                    className={`h-2 ${subscription.storage_usage_percent >= 90 ? '[&>div]:bg-red-500' : subscription.storage_usage_percent >= 70 ? '[&>div]:bg-yellow-500' : ''}`}
                  />
                  {subscription.storage_usage_percent >= 80 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {subscription.storage_usage_percent >= 100 ? 'Storage full' : 'Running low on storage'}
                    </p>
                  )}
                </div>

                {/* Tasks Usage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      AI Tasks
                    </span>
                    <span className="font-medium">
                      {subscription.usage.tasks_generated_this_month} / {subscription.limits.max_tasks_per_month === 999999 ? '∞' : subscription.limits.max_tasks_per_month}
                    </span>
                  </div>
                  <Progress 
                    value={subscription.limits.max_tasks_per_month === 999999 ? 0 : subscription.tasks_usage_percent} 
                    className={`h-2 ${subscription.tasks_usage_percent >= 90 ? '[&>div]:bg-red-500' : subscription.tasks_usage_percent >= 70 ? '[&>div]:bg-yellow-500' : ''}`}
                  />
                  {subscription.tasks_usage_percent >= 80 && subscription.limits.max_tasks_per_month !== 999999 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {subscription.tasks_usage_percent >= 100 ? 'Monthly limit reached' : 'Approaching monthly limit'}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No subscription found</p>
                <Link href="/pricing">
                  <Button className="mt-2" size="sm">
                    View Plans
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Courses */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Your Courses</h2>
          <Link href="/instructor/courses">
            <Button variant="ghost" className="gap-2">
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loadingCourses ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses?.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
                  <GraduationCap className="h-10 w-10 text-primary" />
                </div>
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Create Your First Course</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start sharing your knowledge! Create a course with videos, lessons, 
                and invite students to begin their learning journey.
              </p>
              <Link href="/instructor/courses/new">
                <Button size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Create Course
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses?.slice(0, 6).map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/instructor/courses/${course.id}`}>
                  <Card className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300">
                    {/* Card Header Gradient */}
                    <div className="h-2 bg-gradient-to-r from-primary via-indigo-500 to-purple-500 rounded-t-lg" />
                    <CardContent className="pt-5">
                      <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Video className="h-4 w-4" />
                          <span>{course.lesson_count} lessons</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>{course.student_count} students</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                          <BarChart3 className="h-3.5 w-3.5" />
                          Analytics
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                          <UserPlus className="h-3.5 w-3.5" />
                          Invite
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
            
            {/* Add Course Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (courses?.length || 0) * 0.1 }}
            >
              <Link href="/instructor/courses/new">
                <Card className="h-full min-h-[180px] border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group flex items-center justify-center">
                  <CardContent className="text-center py-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      Add New Course
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group">
            <Link href="/instructor/courses/new">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white group-hover:scale-110 transition-transform">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Create Course</p>
                  <p className="text-sm text-muted-foreground">Start a new course</p>
                </div>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group">
            <Link href="/instructor/ai-tools">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white group-hover:scale-110 transition-transform">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Structure Content</p>
                  <p className="text-sm text-muted-foreground">Extract concepts</p>
                </div>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group">
            <Link href="/instructor/courses">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white group-hover:scale-110 transition-transform">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Invite Students</p>
                  <p className="text-sm text-muted-foreground">Send invitations</p>
                </div>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group">
            <Link href="/instructor/mastery">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">View Mastery</p>
                  <p className="text-sm text-muted-foreground">Track student progress</p>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  )
}
