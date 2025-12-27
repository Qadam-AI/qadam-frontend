'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Trophy, Star, Flame, Target, Award, 
  Zap, Crown, Medal, Shield, Rocket,
  Code, BookOpen, Clock, TrendingUp
} from 'lucide-react'
import api from '@/lib/api'

// Types
interface BadgeData {
  id: string
  name: string
  description: string
  icon: string
  earned: boolean
  earnedAt?: string
  progress?: number
  requirement?: number
}

interface GamificationStats {
  xp: number
  level: number
  xpToNextLevel: number
  xpProgress: number
  rank?: number
  totalUsers?: number
  currentStreak: number
  longestStreak: number
  tasksCompleted: number
  perfectScores: number
}

interface LeaderboardEntry {
  userId: string
  userName: string
  xp: number
  level: number
  rank: number
  isCurrentUser?: boolean
}

// Badge icon mapping
const BADGE_ICONS: Record<string, React.ReactNode> = {
  first_step: <Star className="h-5 w-5" />,
  task_master: <Trophy className="h-5 w-5" />,
  on_fire: <Flame className="h-5 w-5" />,
  perfectionist: <Target className="h-5 w-5" />,
  speed_demon: <Zap className="h-5 w-5" />,
  week_warrior: <Shield className="h-5 w-5" />,
  month_master: <Crown className="h-5 w-5" />,
  early_bird: <Clock className="h-5 w-5" />,
  night_owl: <Clock className="h-5 w-5" />,
  helper: <Award className="h-5 w-5" />,
  polyglot: <Code className="h-5 w-5" />,
  scholar: <BookOpen className="h-5 w-5" />,
  rocket: <Rocket className="h-5 w-5" />,
}

// Get badge icon by name
function getBadgeIcon(icon: string): React.ReactNode {
  return BADGE_ICONS[icon] || <Medal className="h-5 w-5" />
}

// XP Progress Card
export function XPProgressCard({ 
  stats, 
  isLoading 
}: { 
  stats?: GamificationStats
  isLoading?: boolean 
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    )
  }

  const level = stats?.level ?? 1
  const xp = stats?.xp ?? 0
  const xpToNext = stats?.xpToNextLevel ?? 100
  const progress = stats?.xpProgress ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-950/40 dark:to-indigo-900/30 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Crown className="h-5 w-5" />
            Level {level}
          </CardTitle>
          <CardDescription className="text-purple-600/80 dark:text-purple-400/80">
            {xp.toLocaleString()} XP total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-purple-600 dark:text-purple-400">Progress to Level {level + 1}</span>
              <span className="font-medium text-purple-700 dark:text-purple-300">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress 
              value={progress} 
              className="h-3 bg-purple-200 dark:bg-purple-800"
            />
            <p className="text-xs text-purple-500 dark:text-purple-400">
              {xpToNext.toLocaleString()} XP to next level
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Rank Card
export function RankCard({ 
  stats, 
  isLoading 
}: { 
  stats?: GamificationStats
  isLoading?: boolean 
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2" />
          <Skeleton className="h-6 w-16 mx-auto" />
        </CardContent>
      </Card>
    )
  }

  const rank = stats?.rank ?? 0
  const total = stats?.totalUsers ?? 0

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500'
    if (rank === 2) return 'text-gray-400'
    if (rank === 3) return 'text-amber-600'
    if (rank <= 10) return 'text-purple-500'
    return 'text-blue-500'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-8 w-8" />
    if (rank === 2) return <Medal className="h-8 w-8" />
    if (rank === 3) return <Award className="h-8 w-8" />
    return <Trophy className="h-8 w-8" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950/30 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800">
        <CardContent className="pt-6 text-center">
          <div className={`inline-flex p-3 rounded-full bg-yellow-200/50 dark:bg-yellow-800/30 ${getRankColor(rank)}`}>
            {getRankIcon(rank)}
          </div>
          <p className="text-3xl font-bold mt-2 text-yellow-700 dark:text-yellow-300">
            #{rank}
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            of {total.toLocaleString()} learners
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Badges Display
export function BadgesDisplay({ 
  badges, 
  isLoading,
  maxDisplay = 8
}: { 
  badges?: BadgeData[]
  isLoading?: boolean
  maxDisplay?: number
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const earnedBadges = badges?.filter(b => b.earned) ?? []
  const displayBadges = earnedBadges.slice(0, maxDisplay)
  const remainingCount = earnedBadges.length - maxDisplay

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Badges Earned
          <Badge variant="secondary" className="ml-auto">
            {earnedBadges.length}/{badges?.length ?? 0}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {displayBadges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                {getBadgeIcon(badge.icon)}
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <p className="font-semibold">{badge.name}</p>
                <p className="text-gray-300">{badge.description}</p>
              </div>
            </motion.div>
          ))}
          {remainingCount > 0 && (
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-medium">
              +{remainingCount}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Leaderboard Component
export function Leaderboard({ 
  entries, 
  isLoading,
  title = "Leaderboard"
}: { 
  entries?: LeaderboardEntry[]
  isLoading?: boolean
  title?: string
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const getRankStyle = (rank: number, isCurrentUser: boolean) => {
    const base = isCurrentUser ? 'bg-primary/10 dark:bg-primary/20' : ''
    if (rank === 1) return `${base} text-yellow-600 dark:text-yellow-400`
    if (rank === 2) return `${base} text-gray-500 dark:text-gray-400`
    if (rank === 3) return `${base} text-amber-600 dark:text-amber-400`
    return base
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y dark:divide-gray-800">
          {entries?.slice(0, 10).map((entry, index) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex items-center gap-3 px-6 py-3 ${getRankStyle(entry.rank, entry.isCurrentUser ?? false)}`}
            >
              <div className="w-8 text-center font-bold">
                {entry.rank <= 3 ? (
                  entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'
                ) : (
                  `#${entry.rank}`
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {entry.userName}
                  {entry.isCurrentUser && (
                    <span className="text-xs text-primary ml-2">(you)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Level {entry.level}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{entry.xp.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">XP</p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Stats Overview
export function StatsOverview({ 
  stats, 
  isLoading 
}: { 
  stats?: GamificationStats
  isLoading?: boolean 
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statItems = [
    {
      label: 'Tasks Completed',
      value: stats?.tasksCompleted ?? 0,
      icon: <Target className="h-5 w-5" />,
      color: 'text-green-500',
    },
    {
      label: 'Perfect Scores',
      value: stats?.perfectScores ?? 0,
      icon: <Star className="h-5 w-5" />,
      color: 'text-yellow-500',
    },
    {
      label: 'Current Streak',
      value: `${stats?.currentStreak ?? 0} days`,
      icon: <Flame className="h-5 w-5" />,
      color: 'text-orange-500',
    },
    {
      label: 'Longest Streak',
      value: `${stats?.longestStreak ?? 0} days`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-purple-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <span className={item.color}>{item.icon}</span>
              </div>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// Hooks for fetching gamification data
export function useGamificationStats(userId?: string) {
  return useQuery<GamificationStats>({
    queryKey: ['gamification-stats', userId],
    queryFn: async () => {
      const response = await api.get(`/gamification/stats/${userId}`)
      return response.data
    },
    enabled: !!userId,
  })
}

export function useUserBadges(userId?: string) {
  return useQuery<BadgeData[]>({
    queryKey: ['user-badges', userId],
    queryFn: async () => {
      const response = await api.get(`/gamification/badges/${userId}`)
      return response.data
    },
    enabled: !!userId,
  })
}

export function useLeaderboard(period: 'daily' | 'weekly' | 'all-time' = 'weekly') {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const response = await api.get(`/gamification/leaderboard?period=${period}`)
      return response.data
    },
  })
}
