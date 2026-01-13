'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, Sparkles, TrendingUp, Target, BookOpen, 
  Clock, Flame, Award, Lightbulb, AlertTriangle,
  CheckCircle2, BarChart3, Calendar, Zap, Star,
  ThumbsUp, ArrowRight, GraduationCap
} from 'lucide-react'
import Link from 'next/link'

interface UserAnalytics {
  user_id: string
  user_name: string
  user_email: string
  courses_enrolled: number
  courses_completed: number
  courses_in_progress: number
  total_lessons_completed: number
  total_attempts: number
  average_mastery_score: number
  last_active?: string
  total_time_spent: number
  activity_streak: number
  most_active_hour?: number
  most_active_day?: string
  activity_heatmap: { day: string; hour: number; count: number }[]
}

interface Recommendation {
  type: string
  message?: string
  concept?: string
  reason?: string
  priority?: number
}

interface AIInsights {
  student_id?: string
  generated_at: string
  strengths: string[]
  improvement_areas: string[]
  recommendations: Recommendation[]
  weekly_summary?: string
  motivation_message?: string
  source: string
}

interface WeeklySummary {
  student_id?: string
  week_ending: string
  summary: string
  stats: Record<string, number>
  source: string
}

export default function MyAnalyticsPage() {
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
      const res = await api.get<AIInsights>('/analytics/me/ai-insights')
      return res.data
    }
  })

  const { data: weeklySummary, isLoading: loadingWeekly } = useQuery({
    queryKey: ['my-weekly-summary'],
    queryFn: async () => {
      const res = await api.get<WeeklySummary>('/analytics/me/weekly-summary')
      return res.data
    }
  })

  const masteryLevel = analytics?.average_mastery_score || 0
  const getMasteryLabel = (score: number) => {
    if (score >= 90) return { label: 'Expert', color: 'text-green-500' }
    if (score >= 70) return { label: 'Proficient', color: 'text-blue-500' }
    if (score >= 50) return { label: 'Intermediate', color: 'text-yellow-500' }
    if (score >= 25) return { label: 'Beginner', color: 'text-orange-500' }
    return { label: 'Novice', color: 'text-gray-500' }
  }
  const mastery = getMasteryLabel(masteryLevel)

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header - Clean style like Courses page */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold tracking-tight">Your Learning Journey</h1>
        <p className="text-muted-foreground mt-2">
          Track your progress, discover your strengths, and get personalized recommendations.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loadingAnalytics ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-10 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{analytics?.courses_enrolled || 0}</p>
                  <p className="text-sm text-blue-600/70 dark:text-blue-400/70">Courses Enrolled</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">{analytics?.total_lessons_completed || 0}</p>
                  <p className="text-sm text-green-600/70 dark:text-green-400/70">Lessons Completed</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                    <Flame className="h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{analytics?.activity_streak || 0}</p>
                  <p className="text-sm text-orange-600/70 dark:text-orange-400/70">Day Streak</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                    <Clock className="h-5 w-5" />
                  </div>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{Math.round(analytics?.total_time_spent || 0)}h</p>
                  <p className="text-sm text-purple-600/70 dark:text-purple-400/70">Time Learning</p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Weekly Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Weekly Summary
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  <Brain className="h-3 w-3 mr-1" />
                  AI Generated
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loadingWeekly ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : weeklySummary ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">{weeklySummary.summary}</p>
                  {weeklySummary.stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      {Object.entries(weeklySummary.stats).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <p className="text-2xl font-bold">{value}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No weekly summary available yet. Keep learning!</p>
              )}
            </CardContent>
          </Card>

          {/* Strengths & Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                  <ThumbsUp className="h-5 w-5" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingInsights ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : insights?.strengths?.length ? (
                  <div className="space-y-2">
                    {insights.strengths.map((strength, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <Star className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Complete more tasks to discover your strengths!</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
                  <Target className="h-5 w-5" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingInsights ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : insights?.improvement_areas?.length ? (
                  <div className="space-y-2">
                    {insights.improvement_areas.map((area, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                        <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <span className="text-sm">{area}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Keep practicing to identify areas for growth!</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>AI-powered suggestions to accelerate your learning</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInsights ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : insights?.recommendations?.length ? (
                <div className="space-y-3">
                  {insights.recommendations.map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className={`p-2 rounded-full ${
                        rec.type === 'practice' ? 'bg-blue-100 text-blue-600' :
                        rec.type === 'review' ? 'bg-purple-100 text-purple-600' :
                        rec.type === 'concept' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {rec.type === 'practice' ? <Target className="h-4 w-4" /> :
                         rec.type === 'review' ? <BookOpen className="h-4 w-4" /> :
                         rec.type === 'concept' ? <Lightbulb className="h-4 w-4" /> :
                         <Zap className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        {rec.concept && (
                          <p className="font-medium">{rec.concept}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {rec.message || rec.reason || `Focus on ${rec.type}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">{rec.type}</Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Lightbulb className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Complete more activities to get personalized recommendations!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Overall Mastery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overall Mastery</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAnalytics ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        className="text-muted"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="56"
                        cx="64"
                        cy="64"
                      />
                      <circle
                        className={mastery.color.replace('text-', 'text-')}
                        strokeWidth="8"
                        strokeDasharray={`${masteryLevel * 3.52} 352`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="56"
                        cx="64"
                        cy="64"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">{Math.round(masteryLevel)}%</span>
                      <span className={`text-sm ${mastery.color}`}>{mastery.label}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Based on your performance across all courses
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Motivation Message */}
          {insights?.motivation_message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950/30 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-yellow-200 dark:bg-yellow-800">
                      <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
                    </div>
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Daily Motivation</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        {insights.motivation_message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Course Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Course Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAnalytics ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium text-green-600">{analytics?.courses_completed || 0} courses</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">In Progress</span>
                    <span className="font-medium text-blue-600">{analytics?.courses_in_progress || 0} courses</span>
                  </div>
                  <div className="pt-4 border-t">
                    <Link href="/courses">
                      <Button variant="outline" className="w-full gap-2">
                        Browse Courses
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/leaderboard">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  View Leaderboard
                </Button>
              </Link>
              <Link href="/review">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  Spaced Repetition
                </Button>
              </Link>
              <Link href="/study-guides">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  Study Guides
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
