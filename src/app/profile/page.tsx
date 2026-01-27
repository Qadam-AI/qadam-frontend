'use client'

import { useAuth } from '@/hooks/useAuth'
import { useMastery } from '@/hooks/useMastery'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Navbar } from '../_components/navbar'
import { Sidebar } from '../_components/sidebar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, Mail, Calendar, BookOpen, Code, Trophy, Target, 
  CheckCircle2, Flame, TrendingUp, Upload, Camera
} from 'lucide-react'
import { motion } from 'framer-motion'
import { AuthGuard } from '../_components/auth-guard'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRef } from 'react'

// Design System
import { PageShell, PageHeader, Section, Grid, Stack } from '@/design-system/layout'
import { MetricCard, SurfaceCard } from '@/design-system/surfaces'
import { LoadingState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'

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
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: masteryData, isLoading: masteryLoading } = useMastery(user?.id)

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/instructor/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    },
    onSuccess: (data) => {
      toast.success('Avatar uploaded successfully!')
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to upload avatar')
    }
  })

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.')
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB')
      return
    }

    uploadAvatarMutation.mutate(file)
  }

  const { data: stats, isLoading: statsLoading } = useQuery<ProfileStats>({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
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

  if (masteryLoading || statsLoading) {
    return (
      <PageShell maxWidth="2xl">
        <LoadingState message="Loading your profile..." />
      </PageShell>
    )
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  const successRate = stats?.totalAttempts ? Math.round((stats.passedAttempts / stats.totalAttempts) * 100) : 0

  return (
    <PageShell maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Profile Header */}
        <SurfaceCard variant="elevated">
          <div className="flex items-start gap-6">
            <div className="relative group">
              <Avatar className="h-20 w-20 text-2xl">
                {user?.avatarUrl && (
                  <AvatarImage src={user.avatarUrl} alt={user.name || 'User'} />
                )}
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatarMutation.isPending}
                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                title="Change avatar"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <Heading level={2} className="mb-2">{user?.name || 'Student'}</Heading>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user?.email || 'No email set'}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'Unknown'}
                </div>
              </div>
            </div>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </SurfaceCard>

        {/* Stats Overview */}
        <Section title="Learning Stats">
          <Grid cols={4} gap="md">
            <MetricCard
              label="Lessons Completed"
              value={stats?.completedLessons || 0}
              icon={CheckCircle2}
              variant="success"
              trend={stats?.totalLessons ? { value: `of ${stats.totalLessons}`, positive: true } : undefined}
            />
            <MetricCard
              label="Practice Attempts"
              value={stats?.totalAttempts || 0}
              icon={Code}
              variant="default"
            />
            <MetricCard
              label="Success Rate"
              value={`${successRate}%`}
              icon={Target}
              variant={successRate >= 70 ? 'success' : 'warning'}
            />
            <MetricCard
              label="Concepts Mastered"
              value={stats?.conceptsMastered || 0}
              icon={Trophy}
              variant="info"
              trend={stats?.totalConcepts ? { value: `of ${stats.totalConcepts}`, positive: true } : undefined}
            />
          </Grid>
        </Section>

        {/* Understanding Breakdown */}
        <Section title="Understanding Breakdown" description="Your mastery across concepts">
          {masteryData && masteryData.length > 0 ? (
            <Grid cols={1} gap="sm">
              {masteryData.slice(0, 10).map((item, index) => (
                <motion.div
                  key={item.conceptId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <SurfaceCard>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <Text className="font-medium">{item.conceptName}</Text>
                          <div className="flex items-center gap-2">
                            <Text size="sm" className="font-semibold text-primary">
                              {Math.round(item.mastery)}%
                            </Text>
                            {item.mastery >= 80 ? (
                              <Badge variant="default" className="bg-green-600">Strong</Badge>
                            ) : item.mastery >= 50 ? (
                              <Badge variant="default" className="bg-yellow-600">Developing</Badge>
                            ) : (
                              <Badge variant="secondary">Needs Practice</Badge>
                            )}
                          </div>
                        </div>
                        <Progress value={item.mastery} className="h-2" />
                      </div>
                    </div>
                  </SurfaceCard>
                </motion.div>
              ))}
              {masteryData.length > 10 && (
                <div className="flex justify-center pt-4">
                  <Link href="/analytics">
                    <Button variant="outline">View All Concepts</Button>
                  </Link>
                </div>
              )}
            </Grid>
          ) : (
            <SurfaceCard variant="muted" className="text-center py-12">
              <Text variant="muted">
                No understanding data yet. Start practicing to build your profile!
              </Text>
              <Link href="/practice">
                <Button className="mt-4">Start Practice</Button>
              </Link>
            </SurfaceCard>
          )}
        </Section>

        {/* Quick Actions */}
        <Section title="Quick Actions">
          <Grid cols={3} gap="md">
            <Link href="/practice">
              <SurfaceCard className="cursor-pointer hover:shadow-md transition-all group">
                <Stack gap="sm">
                  <div className="p-3 rounded-lg bg-primary/10 w-fit">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <Text className="font-semibold group-hover:text-primary transition-colors">
                    Practice What Needs Attention
                  </Text>
                </Stack>
              </SurfaceCard>
            </Link>

            <Link href="/attempts">
              <SurfaceCard className="cursor-pointer hover:shadow-md transition-all group">
                <Stack gap="sm">
                  <div className="p-3 rounded-lg bg-primary/10 w-fit">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <Text className="font-semibold group-hover:text-primary transition-colors">
                    View Practice History
                  </Text>
                </Stack>
              </SurfaceCard>
            </Link>

            <Link href="/analytics">
              <SurfaceCard className="cursor-pointer hover:shadow-md transition-all group">
                <Stack gap="sm">
                  <div className="p-3 rounded-lg bg-primary/10 w-fit">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <Text className="font-semibold group-hover:text-primary transition-colors">
                    View Full Progress
                  </Text>
                </Stack>
              </SurfaceCard>
            </Link>
          </Grid>
        </Section>
      </motion.div>
    </PageShell>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <ProfileContent />
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
