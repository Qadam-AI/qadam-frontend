'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Brain, TrendingUp, Target, BookOpen, 
  Clock, Flame, Lightbulb, AlertTriangle,
  CheckCircle2, Sparkles, ThumbsUp, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '../_components/navbar'
import { Sidebar } from '../_components/sidebar'
import { AuthGuard } from '../_components/auth-guard'

// Design System
import { PageShell, PageHeader, Section, Grid, Stack } from '@/design-system/layout'
import { MetricCard, SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'

interface UserAnalytics {
  user_id: string
  courses_enrolled: number
  courses_completed: number
  total_lessons_completed: number
  total_attempts: number
  average_mastery_score: number
  activity_streak: number
}

interface AIInsights {
  generated_at: string
  strengths: string[]
  improvement_areas: string[]
  recommendations: Array<{
    type: string
    message?: string
    concept?: string
  }>
  weekly_summary?: string
  motivation_message?: string
}

function AnalyticsContent() {
  const { user } = useAuth()

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['my-analytics'],
    queryFn: async () => {
      const res = await api.get<UserAnalytics>('/analytics/me')
      return res.data
    }
  })

  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ['my-ai-insights'],
    queryFn: async () => {
      try {
        const res = await api.get<AIInsights>('/analytics/me/ai-insights')
        return res.data
      } catch {
        return null
      }
    }
  })

  if (loadingAnalytics) {
    return (
      <PageShell maxWidth="2xl">
        <LoadingState message="Loading your progress..." />
      </PageShell>
    )
  }

  if (!analytics) {
    return (
      <PageShell maxWidth="lg">
        <div className="py-12">
          <EmptyState
            icon={TrendingUp}
            title="No analytics yet"
            description="Start learning to see your progress here."
            action={{
              label: 'Browse Lessons',
              onClick: () => window.location.href = '/lessons'
            }}
          />
        </div>
      </PageShell>
    )
  }

  const masteryLevel = analytics.average_mastery_score || 0
  const getMasteryLabel = (score: number) => {
    if (score >= 90) return { label: 'Expert', color: 'text-green-600', variant: 'success' as const }
    if (score >= 70) return { label: 'Proficient', color: 'text-blue-600', variant: 'info' as const }
    if (score >= 50) return { label: 'Intermediate', color: 'text-yellow-600', variant: 'warning' as const }
    return { label: 'Developing', color: 'text-orange-600', variant: 'default' as const }
  }

  const mastery = getMasteryLabel(masteryLevel)

  return (
    <PageShell maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <PageHeader
          title="Progress"
          description="Track your learning journey and insights"
        />

        {/* Key Stats */}
        <Section>
          <Grid cols={4} gap="md">
            <MetricCard
              label="Courses Enrolled"
              value={analytics.courses_enrolled}
              icon={BookOpen}
              variant="info"
            />
            <MetricCard
              label="Lessons Completed"
              value={analytics.total_lessons_completed}
              icon={CheckCircle2}
              variant="success"
            />
            <MetricCard
              label="Current Streak"
              value={analytics.activity_streak}
              icon={Flame}
              variant="warning"
            />
            <MetricCard
              label="Understanding"
              value={`${Math.round(masteryLevel)}%`}
              icon={Brain}
              variant={mastery.variant}
            />
          </Grid>
        </Section>

        {/* Mastery Level */}
        <SurfaceCard variant="elevated" className="bg-gradient-to-br from-primary/5 to-indigo-500/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <LabelText className="uppercase tracking-wide text-xs mb-1 text-primary">
                Your Level
              </LabelText>
              <Heading level={2} className={mastery.color}>
                {mastery.label}
              </Heading>
              <Text variant="muted" className="mt-2">
                Average understanding score across all concepts
              </Text>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${mastery.color}`}>
                {Math.round(masteryLevel)}%
              </div>
            </div>
          </div>
        </SurfaceCard>

        {/* AI Insights */}
        {insights && (
          <>
            {/* Motivation Message */}
            {insights.motivation_message && (
              <InfoPanel icon={Sparkles} title="Keep Going!" variant="info">
                <Text size="sm">{insights.motivation_message}</Text>
              </InfoPanel>
            )}

            {/* Weekly Summary */}
            {insights.weekly_summary && (
              <Section title="This Week" description="Summary of your progress">
                <SurfaceCard>
                  <Text>{insights.weekly_summary}</Text>
                </SurfaceCard>
              </Section>
            )}

            {/* Strengths & Areas for Improvement */}
            <Grid cols={2} gap="md">
              {/* Strengths */}
              {insights.strengths && insights.strengths.length > 0 && (
                <SurfaceCard>
                  <Stack gap="md">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5 text-green-600" />
                      <LabelText className="text-green-600">Strengths</LabelText>
                    </div>
                    <Stack gap="sm">
                      {insights.strengths.map((strength, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          <Text size="sm">{strength}</Text>
                        </div>
                      ))}
                    </Stack>
                  </Stack>
                </SurfaceCard>
              )}

              {/* Areas to Improve */}
              {insights.improvement_areas && insights.improvement_areas.length > 0 && (
                <SurfaceCard>
                  <Stack gap="md">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-yellow-600" />
                      <LabelText className="text-yellow-600">Focus Areas</LabelText>
                    </div>
                    <Stack gap="sm">
                      {insights.improvement_areas.map((area, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                          <Text size="sm">{area}</Text>
                        </div>
                      ))}
                    </Stack>
                  </Stack>
                </SurfaceCard>
              )}
            </Grid>

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <Section title="Recommendations" description="Personalized suggestions to improve">
                <Stack gap="sm">
                  {insights.recommendations.map((rec, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <SurfaceCard>
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                            <Lightbulb className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            {rec.concept && (
                              <Badge variant="secondary" className="mb-2">
                                {rec.concept}
                              </Badge>
                            )}
                            <Text>{rec.message || `Practice ${rec.concept}`}</Text>
                          </div>
                        </div>
                      </SurfaceCard>
                    </motion.div>
                  ))}
                </Stack>
              </Section>
            )}
          </>
        )}

        {/* No AI Insights */}
        {!loadingInsights && !insights && (
          <InfoPanel icon={Brain} title="AI Insights Coming Soon" variant="default">
            <Text size="sm">
              Keep practicing! We'll generate personalized insights once you've completed more lessons.
            </Text>
          </InfoPanel>
        )}

        {/* Quick Actions */}
        <Section title="Take Action">
          <Grid cols={3} gap="md">
            <Link href="/practice">
              <SurfaceCard className="cursor-pointer hover:shadow-md transition-all group">
                <Stack gap="sm">
                  <div className="p-3 rounded-lg bg-primary/10 w-fit">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <Text className="font-semibold group-hover:text-primary transition-colors">
                    Practice Now
                  </Text>
                  <Text size="sm" variant="muted">
                    Continue improving your skills
                  </Text>
                </Stack>
              </SurfaceCard>
            </Link>

            <Link href="/lessons">
              <SurfaceCard className="cursor-pointer hover:shadow-md transition-all group">
                <Stack gap="sm">
                  <div className="p-3 rounded-lg bg-primary/10 w-fit">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <Text className="font-semibold group-hover:text-primary transition-colors">
                    Learn Something New
                  </Text>
                  <Text size="sm" variant="muted">
                    Explore more lessons
                  </Text>
                </Stack>
              </SurfaceCard>
            </Link>

            <Link href="/profile">
              <SurfaceCard className="cursor-pointer hover:shadow-md transition-all group">
                <Stack gap="sm">
                  <div className="p-3 rounded-lg bg-primary/10 w-fit">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <Text className="font-semibold group-hover:text-primary transition-colors">
                    View Full Profile
                  </Text>
                  <Text size="sm" variant="muted">
                    See all your stats
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

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <AnalyticsContent />
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
