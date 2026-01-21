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
import ReactMarkdown from 'react-markdown'
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
        <h1 className="text-3xl font-serif font-medium tracking-tight">Your Learning Journey</h1>
        <p className="text-muted-foreground mt-2">
          Track your progress, discover your strengths, and get personalized recommendations.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loadingAnalytics ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="p-6 border rounded-lg bg-background">
              <Skeleton className="h-10 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="p-6 border rounded-lg bg-background">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <BookOpen className="h-4 w-4" />
                </div>
                <p className="text-3xl font-serif font-medium tracking-tight text-foreground">{analytics?.courses_enrolled || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Courses Enrolled</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="p-6 border rounded-lg bg-background">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="text-3xl font-serif font-medium tracking-tight text-foreground">{analytics?.total_lessons_completed || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Lessons Completed</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="p-6 border rounded-lg bg-background">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                </div>
                <p className="text-3xl font-serif font-medium tracking-tight text-foreground">{analytics?.activity_streak || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Active Days in Row</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="p-6 border rounded-lg bg-background">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                </div>
                <p className="text-3xl font-serif font-medium tracking-tight text-foreground">{Math.round(analytics?.total_time_spent || 0)}h</p>
                <p className="text-sm text-muted-foreground mt-1">Time Learning</p>
              </div>
            </motion.div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Weekly Summary */}
          <div className="rounded-lg border bg-background p-6">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-serif font-medium text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Weekly Summary
               </h3>
               <span className="text-xs text-muted-foreground border px-2 py-1 rounded">
                  AI Generated
               </span>
            </div>
            
              {loadingWeekly ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : weeklySummary ? (
                <div className="space-y-6">
                  <div className="text-muted-foreground leading-relaxed prose prose-neutral dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown>{weeklySummary.summary}</ReactMarkdown>
                  </div>
                  {weeklySummary.stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t">
                      {Object.entries(weeklySummary.stats).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-2xl font-serif font-medium">{value}</p>
                          <p className="text-xs text-muted-foreground capitalize mt-1">
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
          </div>

          {/* Strengths & Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg bg-background p-6">
              <h3 className="text-lg font-serif font-medium mb-4 flex items-center gap-2">
                 <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                 Your Strengths
              </h3>
                {loadingInsights ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : insights?.strengths?.length ? (
                  <div className="space-y-2">
                    {insights.strengths.map((strength, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded bg-muted/30 border">
                        <Star className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium">{strength}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Complete more tasks to discover your strengths.</p>
                )}
            </div>

            <div className="border rounded-lg bg-background p-6">
               <h3 className="text-lg font-serif font-medium mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  Areas to Improve
               </h3>
                {loadingInsights ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : insights?.improvement_areas?.length ? (
                  <div className="space-y-2">
                    {insights.improvement_areas.map((area, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded bg-muted/30 border">
                        <AlertTriangle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium">{area}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Keep practicing to identify areas for growth.</p>
                )}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="border rounded-lg bg-background p-6">
            <div className="mb-6">
              <h3 className="text-xl font-serif font-medium flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Personalized Recommendations
              </h3>
              <p className="text-sm text-muted-foreground mt-1">AI-powered suggestions to accelerate your learning</p>
            </div>
            
              {loadingInsights ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : insights?.recommendations?.length ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {insights.recommendations.map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex flex-col gap-2 p-4 rounded border bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                         <Badge variant="outline" className="capitalize font-normal text-xs">{rec.type}</Badge>
                         {rec.type === 'practice' ? <Target className="h-4 w-4 text-muted-foreground" /> :
                         rec.type === 'review' ? <BookOpen className="h-4 w-4 text-muted-foreground" /> :
                         rec.type === 'concept' ? <Lightbulb className="h-4 w-4 text-muted-foreground" /> :
                         <Zap className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      
                      <div>
                        {rec.concept && (
                          <p className="font-serif font-medium mb-1">{rec.concept}</p>
                        )}
                        <p className="text-sm text-muted-foreground leading-snug">
                          {rec.message || rec.reason || `Focus on ${rec.type}`}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/10 rounded border border-dashed">
                  <p className="text-muted-foreground">Complete more activities to get personalized recommendations.</p>
                </div>
              )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Overall Mastery */}
          <div className="rounded-lg border bg-background p-6">
            <h3 className="text-lg font-serif font-medium mb-4">Overall Mastery</h3>
              {loadingAnalytics ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-serif font-medium">{Math.round(masteryLevel)}%</span>
                        <span className={`text-sm font-medium ${mastery.color.replace('text-', 'text-')}`}>{mastery.label}</span>
                    </div>
                    <Progress value={masteryLevel} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Based on your performance across all courses
                  </p>
                </div>
              )}
          </div>

          {/* Motivation Message */}
          {insights?.motivation_message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-900/10 p-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-amber-900 dark:text-amber-200">Daily Insight</p>
                      <p className="text-sm text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                        {insights.motivation_message}
                      </p>
                    </div>
                  </div>
              </div>
            </motion.div>
          )}

          {/* Course Progress */}
          <div className="rounded-lg border bg-background p-6">
            <h3 className="text-lg font-serif font-medium mb-4 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                Course Progress
            </h3>
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
                  <div className="flex justify-between text-sm p-3 bg-muted/20 rounded">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium">{analytics?.courses_completed || 0} courses</span>
                  </div>
                  <div className="flex justify-between text-sm p-3 bg-muted/20 rounded">
                    <span className="text-muted-foreground">In Progress</span>
                    <span className="font-medium">{analytics?.courses_in_progress || 0} courses</span>
                  </div>
                  <div className="pt-2">
                    <Link href="/courses">
                      <Button variant="outline" className="w-full gap-2">
                        Browse Courses
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
          </div>

          {/* Quick Links */}
          <div className="rounded-lg border bg-background p-6">
            <h3 className="text-lg font-serif font-medium mb-2">Quick Actions</h3>
            <div className="space-y-1">
              <Link href="/review">
                <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-3 text-muted-foreground hover:text-foreground">
                  <Brain className="h-4 w-4" />
                  Spaced Repetition
                </Button>
              </Link>
              <Link href="/study-guides">
                <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-3 text-muted-foreground hover:text-foreground">
                  <BookOpen className="h-4 w-4" />
                  Study Guides
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
