'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, Crown, Medal, Award, Star, Flame, 
  TrendingUp, TrendingDown, Minus, Target,
  Sparkles, Users, Zap, Shield
} from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatarUrl?: string
  xp: number
  level: number
  badgeCount: number
  streakDays: number
  rankChange: number
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  myRank: number
  type: string
  timeframe: string
}

interface UserStats {
  userId: string
  totalXp: number
  level: number
  xpToNextLevel: number
  currentStreak: number
  longestStreak: number
  tasksCompleted: number
  coursesCompleted: number
  conceptsMastered: number
  perfectScores: number
  badgeCount: number
}

interface BadgeInfo {
  id: string
  name: string
  description: string
  icon: string
  category: string
  xpReward: number
  isSecret?: boolean
}

interface UserBadge extends BadgeInfo {
  earnedAt?: string
}

type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'all_time'
type LeaderboardType = 'xp' | 'streak' | 'tasks' | 'mastery'

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [timeframe, setTimeframe] = useState<TimeFrame>('weekly')
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('xp')

  const { data: leaderboardData, isLoading: loadingLeaderboard } = useQuery({
    queryKey: ['leaderboard', timeframe, leaderboardType],
    queryFn: async () => {
      const res = await api.get<LeaderboardData>(`/api/v1/gamification/leaderboard?timeframe=${timeframe}&type=${leaderboardType}&limit=50`)
      return res.data
    }
  })

  const { data: myStats, isLoading: loadingStats } = useQuery({
    queryKey: ['my-gamification-stats'],
    queryFn: async () => {
      const res = await api.get<UserStats>('/api/v1/gamification/stats')
      return res.data
    }
  })

  const { data: myBadges, isLoading: loadingBadges } = useQuery({
    queryKey: ['my-badges'],
    queryFn: async () => {
      const res = await api.get<{ badges: UserBadge[], count: number }>('/api/v1/gamification/badges')
      return res.data
    }
  })

  const { data: allBadges } = useQuery({
    queryKey: ['all-badges'],
    queryFn: async () => {
      const res = await api.get<{ badges: BadgeInfo[], count: number }>('/api/v1/gamification/badges/all')
      return res.data
    }
  })

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
  }

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getBadgeIcon = (icon: string) => {
    const icons: Record<string, React.ReactNode> = {
      star: <Star className="h-5 w-5" />,
      trophy: <Trophy className="h-5 w-5" />,
      flame: <Flame className="h-5 w-5" />,
      target: <Target className="h-5 w-5" />,
      zap: <Zap className="h-5 w-5" />,
      shield: <Shield className="h-5 w-5" />,
      crown: <Crown className="h-5 w-5" />,
      sparkles: <Sparkles className="h-5 w-5" />,
    }
    return icons[icon] || <Award className="h-5 w-5" />
  }

  const xpProgress = myStats ? ((myStats.totalXp % 100) / (myStats.xpToNextLevel || 100)) * 100 : 0

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header with User Stats */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 text-white"
      >
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-6 w-6" />
            <span className="text-lg font-medium text-white/80">Leaderboard</span>
          </div>
          
          {loadingStats ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-48 bg-white/20" />
              <Skeleton className="h-4 w-64 bg-white/20" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* XP & Level */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 rounded-full bg-white/20">
                    <Crown className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Level {myStats?.level || 1}</h1>
                    <p className="text-white/80">{myStats?.totalXp?.toLocaleString() || 0} XP total</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to Level {(myStats?.level || 1) + 1}</span>
                    <span>{Math.round(xpProgress)}%</span>
                  </div>
                  <Progress value={xpProgress} className="h-3 bg-white/20" />
                  <p className="text-xs text-white/60">{myStats?.xpToNextLevel || 100} XP to next level</p>
                </div>
              </div>

              {/* Rank */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-2">
                  <span className="text-3xl font-bold">#{leaderboardData?.myRank || '-'}</span>
                </div>
                <p className="text-white/80">Your Rank</p>
              </div>

              {/* Streak */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-500/30 mb-2">
                  <Flame className="h-10 w-10 text-orange-300" />
                </div>
                <p className="text-2xl font-bold">{myStats?.currentStreak || 0}</p>
                <p className="text-white/80">Day Streak</p>
              </div>
            </div>
          )}
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-purple-400/20 blur-3xl" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as TimeFrame)} className="flex-1">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="daily">Today</TabsTrigger>
                <TabsTrigger value="weekly">This Week</TabsTrigger>
                <TabsTrigger value="monthly">This Month</TabsTrigger>
                <TabsTrigger value="all_time">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex gap-2 flex-wrap">
            {(['xp', 'streak', 'tasks', 'mastery'] as LeaderboardType[]).map((type) => (
              <Button
                key={type}
                variant={leaderboardType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLeaderboardType(type)}
                className="capitalize"
              >
                {type === 'xp' && <Zap className="h-4 w-4 mr-1" />}
                {type === 'streak' && <Flame className="h-4 w-4 mr-1" />}
                {type === 'tasks' && <Target className="h-4 w-4 mr-1" />}
                {type === 'mastery' && <Star className="h-4 w-4 mr-1" />}
                {type}
              </Button>
            ))}
          </div>

          {/* Leaderboard List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top Learners
              </CardTitle>
              <CardDescription>
                {timeframe === 'daily' && 'Top performers today'}
                {timeframe === 'weekly' && 'Top performers this week'}
                {timeframe === 'monthly' && 'Top performers this month'}
                {timeframe === 'all_time' && 'All-time top performers'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingLeaderboard ? (
                <div className="divide-y">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : leaderboardData?.leaderboard?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No leaderboard data yet</p>
                  <p className="text-sm">Complete tasks to climb the ranks!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {leaderboardData?.leaderboard?.map((entry, index) => {
                    const isCurrentUser = entry.userId === user?.id
                    return (
                      <motion.div
                        key={entry.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${
                          isCurrentUser ? 'bg-primary/5 border-l-4 border-primary' : ''
                        } ${entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-900/10' : ''}`}
                      >
                        <div className="w-12 flex justify-center">
                          {getRankIcon(entry.rank)}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                          {entry.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate flex items-center gap-2">
                            {entry.username}
                            {isCurrentUser && <Badge variant="secondary" className="text-xs">You</Badge>}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Level {entry.level}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              {entry.badgeCount} badges
                            </span>
                            {entry.streakDays > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-orange-500">
                                  <Flame className="h-3 w-3" />
                                  {entry.streakDays}d
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.rankChange !== 0 && (
                            <div className="flex items-center gap-1 text-sm">
                              {getRankChangeIcon(entry.rankChange)}
                              <span className={entry.rankChange > 0 ? 'text-green-500' : 'text-red-500'}>
                                {Math.abs(entry.rankChange)}
                              </span>
                            </div>
                          )}
                          <div className="text-right">
                            <p className="font-bold text-lg">{entry.xp.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">XP</p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Badges & Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingStats ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Tasks Completed
                    </span>
                    <span className="font-bold">{myStats?.tasksCompleted || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Perfect Scores
                    </span>
                    <span className="font-bold">{myStats?.perfectScores || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Concepts Mastered
                    </span>
                    <span className="font-bold">{myStats?.conceptsMastered || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Flame className="h-4 w-4" />
                      Longest Streak
                    </span>
                    <span className="font-bold">{myStats?.longestStreak || 0} days</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* My Badges */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  My Badges
                </CardTitle>
                <Badge variant="secondary">
                  {myBadges?.count || 0}/{allBadges?.count || 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBadges ? (
                <div className="flex flex-wrap gap-2">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="w-12 h-12 rounded-full" />
                  ))}
                </div>
              ) : myBadges?.badges?.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Award className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No badges earned yet</p>
                  <p className="text-xs">Complete tasks to earn badges!</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {myBadges?.badges?.map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                        {getBadgeIcon(badge.icon)}
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-gray-300">{badge.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Badges Catalog */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Badge Catalog</CardTitle>
              <CardDescription>All available badges to earn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {allBadges?.badges?.filter(b => !b.isSecret).map((badge) => {
                  const earned = myBadges?.badges?.some(b => b.id === badge.id)
                  return (
                    <div
                      key={badge.id}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        earned ? 'bg-green-50 dark:bg-green-900/20' : 'opacity-60'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        earned 
                          ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      }`}>
                        {getBadgeIcon(badge.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{badge.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
                      </div>
                      {earned && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          Earned
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
