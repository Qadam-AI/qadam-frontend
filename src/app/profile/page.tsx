'use client'

import { useAuth } from '@/hooks/useAuth'
import { useMastery } from '@/hooks/useMastery'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Navbar } from '../_components/navbar'
import { Sidebar } from '../_components/sidebar'
import { Footer } from '../_components/footer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  User, Mail, Calendar, BookOpen, Code, Trophy, Target, 
  CheckCircle2, Flame, GraduationCap, TrendingUp 
} from 'lucide-react'
import { motion } from 'framer-motion'
import { AuthGuard } from '../_components/auth-guard'
import { useTranslations } from '@/lib/i18n'

interface ProfileStats {
  totalLessons: number
  completedLessons: number
  totalAttempts: number
  passedAttempts: number
  conceptsMastered: number
  totalConcepts: number
  avgMastery: number
}

function ProfileContent() {
  const { user } = useAuth()
  const t = useTranslations('profile')
  const { data: masteryData, isLoading: masteryLoading } = useMastery(user?.id)

  // Fetch profile stats
  const { data: stats, isLoading: statsLoading } = useQuery<ProfileStats>({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      // Fetch all necessary data
      const [coursesRes, completedRes, attemptsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/lessons/progress'),
        api.get(`/users/${user!.id}/attempts`).catch(() => ({ data: [] })),
      ])
      
      const courseList = coursesRes.data || []
      const completedIds = new Set(completedRes.data || [])
      const attempts = attemptsRes.data || []
      
      let totalLessons = 0
      for (const course of courseList) {
        try {
          const courseDetail = await api.get(`/courses/${course.id}`)
          totalLessons += (courseDetail.data?.lessons || []).length
        } catch {}
      }
      
      const conceptsMastered = masteryData?.filter(m => m.mastery >= 80).length ?? 0
      const totalConcepts = masteryData?.length ?? 0
      const avgMastery = totalConcepts > 0 
        ? Math.round(masteryData!.reduce((sum, m) => sum + m.mastery, 0) / totalConcepts)
        : 0
      
      return {
        totalLessons,
        completedLessons: completedIds.size,
        totalAttempts: attempts.length,
        passedAttempts: attempts.filter((a: any) => a.passed).length,
        conceptsMastered,
        totalConcepts,
        avgMastery,
      }
    },
    enabled: !!user && !masteryLoading,
  })

  const isLoading = masteryLoading || statsLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    )
  }

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  const passRate = stats && stats.totalAttempts > 0 
    ? Math.round((stats.passedAttempts / stats.totalAttempts) * 100)
    : 0

  const lessonProgress = stats && stats.totalLessons > 0
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24 text-2xl">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold">{user?.name}</h1>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 text-muted-foreground">
                  <span className="flex items-center gap-1 justify-center sm:justify-start">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </span>
                  {user?.role && (
                    <Badge variant="secondary" className="w-fit mx-auto sm:mx-0">
                      {user.role}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">{t('statistics')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-3xl font-bold">{stats?.completedLessons ?? 0}</p>
                <p className="text-sm text-muted-foreground">{t('lessonsCompleted')}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-6 text-center">
                <Code className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-3xl font-bold">{stats?.totalAttempts ?? 0}</p>
                <p className="text-sm text-muted-foreground">{t('practiceAttempts')}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <Card>
              <CardContent className="pt-6 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-3xl font-bold">{stats?.conceptsMastered ?? 0}</p>
                <p className="text-sm text-muted-foreground">{t('conceptsMastered')}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardContent className="pt-6 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="text-3xl font-bold">{passRate}%</p>
                <p className="text-sm text-muted-foreground">{t('passRate')}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                {t('lessonProgress')}
              </CardTitle>
              <CardDescription>
                {t('lessonProgressDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>{t('lessonsCompleted')}</span>
                <span className="font-medium">
                  {stats?.completedLessons ?? 0} / {stats?.totalLessons ?? 0}
                </span>
              </div>
              <Progress value={lessonProgress} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {lessonProgress}%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {t('avgMastery')}
              </CardTitle>
              <CardDescription>
                {t('avgMasteryDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>{t('avgMastery')}</span>
                <span className="font-medium">
                  {stats?.avgMastery ?? 0}%
                </span>
              </div>
              <Progress value={stats?.avgMastery ?? 0} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {stats?.conceptsMastered ?? 0} / {stats?.totalConcepts ?? 0} at 80%+
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Mastery Breakdown */}
      {masteryData && masteryData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('masteryBreakdown')}</CardTitle>
              <CardDescription>
                {t('masteryBreakdownDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {masteryData
                  .sort((a, b) => b.mastery - a.mastery)
                  .map((item) => (
                    <div key={item.conceptId} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium capitalize">{item.conceptName}</span>
                        <div className="flex items-center gap-2">
                          {item.mastery >= 80 && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          <span className={item.mastery >= 80 ? 'text-green-600 font-medium' : ''}>
                            {Math.round(item.mastery)}%
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={item.mastery} 
                        className={`h-2 ${item.mastery >= 80 ? '[&>div]:bg-green-500' : ''}`}
                      />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-8 lg:ml-64">
            <div className="container max-w-4xl mx-auto">
              <ProfileContent />
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </AuthGuard>
  )
}
