'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslations } from '@/lib/i18n'
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Activity,
  BarChart3,
  Clock
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface PlatformStats {
  total_users: number
  total_students: number
  total_instructors: number
  total_courses: number
  total_lessons: number
  total_attempts: number
  active_users_today: number
  active_users_week: number
  active_users_month: number
  average_mastery_score: number
  completion_rate: number
}

interface LearningTrends {
  period: string
  attempts_trend: { date: string; value: number }[]
  total_attempts: number
  attempts_change: number
  mastery_trend: { date: string; value: number }[]
  average_mastery: number
  completions_trend: { date: string; value: number }[]
  total_completions: number
  popular_courses: { course_id: string; title: string; enrollments: number }[]
  challenging_lessons: { lesson_id: string; title: string; pass_rate: number }[]
}

interface RealTimeMetrics {
  timestamp: string
  active_users: number
  attempts_last_hour: number
  completions_last_hour: number
  new_enrollments_last_hour: number
}

export default function AnalyticsPage() {
  const t = useTranslations('admin')
  const tCommon = useTranslations('common')
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const res = await api.get<PlatformStats>('/analytics/platform/stats')
      return res.data
    }
  })
  
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['learning-trends'],
    queryFn: async () => {
      const res = await api.get<LearningTrends>('/analytics/platform/trends?days=30')
      return res.data
    }
  })
  
  const { data: realtime, isLoading: realtimeLoading } = useQuery({
    queryKey: ['realtime-metrics'],
    queryFn: async () => {
      const res = await api.get<RealTimeMetrics>('/analytics/platform/realtime')
      return res.data
    },
    refetchInterval: 60000 // Refresh every minute
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('analyticsSection.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('subtitle')}
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="trends">{t('analyticsSection.learningTrends')}</TabsTrigger>
          <TabsTrigger value="realtime">{t('analyticsSection.realtime')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('stats.totalUsers')}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.total_students || 0} students, {stats?.total_instructors || 0} instructors
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('stats.totalCourses')}
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.total_courses || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.total_lessons || 0} {t('lessons').toLowerCase()}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('stats.totalAttempts')}
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.total_attempts || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.average_mastery_score?.toFixed(1) || 0}% {t('stats.avgMastery').toLowerCase()}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('stats.activeToday')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.active_users_today || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.active_users_week || 0} this week
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Completion Rate */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('stats.completionRate')}</CardTitle>
                <CardDescription>Course completion percentage</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-primary">
                      {stats?.completion_rate?.toFixed(1) || 0}%
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${stats?.completion_rate || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('stats.avgMastery')}</CardTitle>
                <CardDescription>Average mastery score across all students</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-primary">
                      {stats?.average_mastery_score?.toFixed(1) || 0}%
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${stats?.average_mastery_score || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Popular Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Popular Courses
                </CardTitle>
                <CardDescription>Most enrolled courses this month</CardDescription>
              </CardHeader>
              <CardContent>
                {trendsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trends?.popular_courses?.map((course: { course_id: string; title: string; enrollments: number }, index: number) => (
                      <div key={course.course_id} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{course.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {course.enrollments} enrollments
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground">No data available</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Challenging Lessons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Challenging Content
                </CardTitle>
                <CardDescription>Lessons with lowest pass rates</CardDescription>
              </CardHeader>
              <CardContent>
                {trendsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trends?.challenging_lessons?.map((lesson: { lesson_id: string; title: string; pass_rate: number }) => (
                      <div key={lesson.lesson_id} className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate flex-1">{lesson.title}</p>
                        <span className={`text-sm font-medium ${lesson.pass_rate < 50 ? 'text-red-500' : 'text-yellow-500'}`}>
                          {lesson.pass_rate.toFixed(0)}% pass
                        </span>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground">No data available</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Trend Summary */}
          <Card>
            <CardHeader>
              <CardTitle>30-Day Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold">{trends?.total_attempts || 0}</div>
                    <p className="text-sm text-muted-foreground">Total Attempts</p>
                    <p className={`text-xs ${(trends?.attempts_change || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {(trends?.attempts_change || 0) >= 0 ? '+' : ''}{trends?.attempts_change?.toFixed(1)}% from last period
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold">{trends?.average_mastery?.toFixed(1) || 0}%</div>
                    <p className="text-sm text-muted-foreground">Average Mastery</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold">{trends?.total_completions || 0}</div>
                    <p className="text-sm text-muted-foreground">Completions</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="realtime" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </CardHeader>
              <CardContent>
                {realtimeLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{realtime?.active_users || 0}</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Attempts (1h)</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {realtimeLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{realtime?.attempts_last_hour || 0}</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completions (1h)</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {realtimeLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{realtime?.completions_last_hour || 0}</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Enrollments (1h)</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {realtimeLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{realtime?.new_enrollments_last_hour || 0}</div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Real-time Activity</CardTitle>
              <CardDescription>
                Last updated: {realtime?.timestamp ? new Date(realtime.timestamp).toLocaleTimeString() : 'Loading...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Live activity feed coming soon. WebSocket integration enables real-time updates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
