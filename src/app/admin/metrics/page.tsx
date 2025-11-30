'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, BookOpen, Brain, Activity, TrendingUp, Clock, Target, Zap } from 'lucide-react'

interface AdminMetrics {
  total_users: number
  total_courses: number
  total_lessons: number
  total_concepts: number
  total_tasks: number
  total_attempts: number
  pass_rate: number
  avg_time_to_pass_ms: number
  active_users_last_7d: number
}

export default function MetricsPage() {
  const { data: metrics, isLoading } = useQuery<AdminMetrics>({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      const response = await api.get('/admin/metrics')
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Metrics & Analytics</h1>
          <p className="text-muted-foreground mt-2">Detailed system statistics</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Users',
      value: metrics?.total_users || 0,
      icon: <Users className="h-6 w-6 text-blue-500" />,
      description: 'Registered accounts',
    },
    {
      title: 'Active Users (7d)',
      value: metrics?.active_users_last_7d || 0,
      icon: <Zap className="h-6 w-6 text-amber-500" />,
      description: 'Active in last week',
    },
    {
      title: 'Courses',
      value: metrics?.total_courses || 0,
      icon: <BookOpen className="h-6 w-6 text-green-500" />,
      description: 'Total courses',
    },
    {
      title: 'Lessons',
      value: metrics?.total_lessons || 0,
      icon: <Target className="h-6 w-6 text-cyan-500" />,
      description: 'Total lessons',
    },
    {
      title: 'Concepts',
      value: metrics?.total_concepts || 0,
      icon: <Brain className="h-6 w-6 text-purple-500" />,
      description: 'Learning concepts',
    },
    {
      title: 'Tasks Generated',
      value: metrics?.total_tasks || 0,
      icon: <Activity className="h-6 w-6 text-orange-500" />,
      description: 'Total tasks created',
    },
    {
      title: 'Total Attempts',
      value: metrics?.total_attempts || 0,
      icon: <Activity className="h-6 w-6 text-red-500" />,
      description: 'All submissions',
    },
    {
      title: 'Pass Rate',
      value: `${metrics?.pass_rate || 0}%`,
      icon: <TrendingUp className="h-6 w-6 text-emerald-500" />,
      description: 'Overall success rate',
    },
    {
      title: 'Avg Time to Pass',
      value: `${Math.round((metrics?.avg_time_to_pass_ms || 0) / 1000)}s`,
      icon: <Clock className="h-6 w-6 text-indigo-500" />,
      description: 'Average for passing attempts',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Metrics & Analytics</h1>
        <p className="text-muted-foreground mt-2">Detailed system statistics and performance data</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">User Engagement</span>
              <span className="text-sm text-muted-foreground">
                {metrics ? Math.round((metrics.active_users_last_7d / metrics.total_users) * 100) : 0}% active
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${metrics ? Math.round((metrics.active_users_last_7d / metrics.total_users) * 100) : 0}%`
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Content Completion</span>
              <span className="text-sm text-muted-foreground">
                {metrics?.pass_rate || 0}% pass rate
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{
                  width: `${metrics?.pass_rate || 0}%`
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Task Generation</span>
              <span className="text-sm text-muted-foreground">
                {metrics?.total_tasks || 0} tasks created
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg {metrics ? Math.round(metrics.total_tasks / (metrics.total_users || 1)) : 0} tasks per user
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

