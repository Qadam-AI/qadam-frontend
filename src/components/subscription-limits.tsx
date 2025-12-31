'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, CheckCircle2, BookOpen, Users, 
  HardDrive, Brain, Zap, Crown
} from 'lucide-react'
import Link from 'next/link'

interface LimitCheck {
  allowed: boolean
  current: number
  limit: number
  remaining: number
  message?: string
}

interface SubscriptionLimitsProps {
  showUpgrade?: boolean
}

export function SubscriptionLimits({ showUpgrade = true }: SubscriptionLimitsProps) {
  // Fetch limits
  const { data: coursesLimit } = useQuery({
    queryKey: ['limit-courses'],
    queryFn: async () => {
      const res = await api.get<LimitCheck>('/api/v1/subscriptions/my/limits/courses')
      return res.data
    },
  })

  const { data: tasksLimit } = useQuery({
    queryKey: ['limit-tasks'],
    queryFn: async () => {
      const res = await api.get<LimitCheck>('/api/v1/subscriptions/my/limits/tasks')
      return res.data
    },
  })

  const { data: storageLimit } = useQuery({
    queryKey: ['limit-storage'],
    queryFn: async () => {
      const res = await api.get<LimitCheck>('/api/v1/subscriptions/my/limits/storage')
      return res.data
    },
  })

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
    return `${Math.round(bytes / 1024)} KB`
  }

  const getUsagePercent = (current: number, limit: number) => {
    if (limit === 0) return 0
    return Math.min(Math.round((current / limit) * 100), 100)
  }

  const getStatusColor = (percent: number) => {
    if (percent >= 90) return 'text-red-500'
    if (percent >= 70) return 'text-yellow-500'
    return 'text-green-500'
  }

  const limits = [
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Courses',
      data: coursesLimit,
      formatValue: (v: number) => v.toString(),
    },
    {
      icon: <Brain className="h-5 w-5" />,
      label: 'AI Tasks (Monthly)',
      data: tasksLimit,
      formatValue: (v: number) => v.toString(),
    },
    {
      icon: <HardDrive className="h-5 w-5" />,
      label: 'Storage',
      data: storageLimit,
      formatValue: formatBytes,
    },
  ]

  const hasWarning = limits.some(l => l.data && getUsagePercent(l.data.current, l.data.limit) >= 70)

  return (
    <Card className={hasWarning ? 'border-yellow-500/50' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Usage Limits
          {hasWarning && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Approaching Limit
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {limits.map((limit) => {
          const percent = limit.data ? getUsagePercent(limit.data.current, limit.data.limit) : 0
          const isUnlimited = limit.data?.limit === 0 || limit.data?.limit === -1

          return (
            <div key={limit.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  {limit.icon}
                  {limit.label}
                </span>
                <span className={`font-medium ${isUnlimited ? 'text-green-500' : getStatusColor(percent)}`}>
                  {limit.data ? (
                    isUnlimited ? (
                      <>∞ Unlimited</>
                    ) : (
                      <>
                        {limit.formatValue(limit.data.current)} / {limit.formatValue(limit.data.limit)}
                      </>
                    )
                  ) : (
                    'Loading...'
                  )}
                </span>
              </div>
              {!isUnlimited && limit.data && (
                <Progress 
                  value={percent} 
                  className={`h-2 ${percent >= 90 ? '[&>div]:bg-red-500' : percent >= 70 ? '[&>div]:bg-yellow-500' : ''}`}
                />
              )}
              {limit.data && percent >= 90 && !isUnlimited && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {limit.data.remaining} remaining. Upgrade for more.
                </p>
              )}
            </div>
          )
        })}

        {showUpgrade && hasWarning && (
          <div className="pt-4 border-t">
            <Button className="w-full gap-2" asChild>
              <Link href="/pricing">
                <Crown className="h-4 w-4" />
                Upgrade Plan
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact inline version for headers/banners
export function SubscriptionLimitBanner() {
  const { data: tasksLimit } = useQuery({
    queryKey: ['limit-tasks'],
    queryFn: async () => {
      const res = await api.get<LimitCheck>('/api/v1/subscriptions/my/limits/tasks')
      return res.data
    },
  })

  if (!tasksLimit || tasksLimit.remaining > 10) return null

  const isExhausted = tasksLimit.remaining <= 0

  return (
    <div className={`px-4 py-2 rounded-lg flex items-center justify-between text-sm ${
      isExhausted 
        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
    }`}>
      <span className="flex items-center gap-2">
        {isExhausted ? (
          <>
            <AlertTriangle className="h-4 w-4" />
            AI task limit reached for this month
          </>
        ) : (
          <>
            <Brain className="h-4 w-4" />
            {tasksLimit.remaining} AI tasks remaining this month
          </>
        )}
      </span>
      <Button size="sm" variant="outline" asChild className="text-inherit border-inherit">
        <Link href="/pricing">Upgrade</Link>
      </Button>
    </div>
  )
}

export default SubscriptionLimits
