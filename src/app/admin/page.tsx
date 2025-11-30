'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, BookOpen, Brain, Activity, TrendingUp, Clock } from 'lucide-react'

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

export default function AdminDashboard() {
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
          <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">System overview and statistics</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
      icon: <Users className="h-5 w-5 text-blue-500" />,
      description: `${metrics?.active_users_last_7d || 0} active in last 7 days`,
    },
    {
      title: 'Courses',
      value: metrics?.total_courses || 0,
      icon: <BookOpen className="h-5 w-5 text-green-500" />,
      description: `${metrics?.total_lessons || 0} lessons`,
    },
    {
      title: 'Concepts',
      value: metrics?.total_concepts || 0,
      icon: <Brain className="h-5 w-5 text-purple-500" />,
      description: 'Total concepts',
    },
    {
      title: 'Total Attempts',
      value: metrics?.total_attempts || 0,
      icon: <Activity className="h-5 w-5 text-orange-500" />,
      description: `${metrics?.total_tasks || 0} tasks generated`,
    },
    {
      title: 'Pass Rate',
      value: `${metrics?.pass_rate || 0}%`,
      icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
      description: 'Overall success rate',
    },
    {
      title: 'Avg Time to Pass',
      value: `${Math.round((metrics?.avg_time_to_pass_ms || 0) / 1000)}s`,
      icon: <Clock className="h-5 w-5 text-indigo-500" />,
      description: 'Average time for passing attempts',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">System overview and statistics</p>
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
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <a
            href="/admin/users"
            className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
          >
            <Users className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">Manage Users</span>
          </a>
          <a
            href="/admin/courses"
            className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
          >
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">Manage Courses</span>
          </a>
          <a
            href="/admin/events"
            className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
          >
            <Activity className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">View Events</span>
          </a>
          <a
            href="/admin/llm"
            className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
          >
            <Brain className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">LLM Settings</span>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}

