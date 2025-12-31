'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Trophy, 
  Star,
  Flame,
  Target,
  Award,
  Zap,
  TrendingUp,
  Users
} from 'lucide-react'

interface LeaderboardEntry {
  user_id: string
  display_name: string
  avatar_url?: string
  total_xp: number
  level: number
  rank: number
}

interface BadgeInfo {
  id: string
  name: string
  description: string
  icon: string
  rarity: string
  earned_count?: number
}

export default function AdminGamification() {
  const { data: leaderboard, isLoading: lbLoading } = useQuery<{ entries: LeaderboardEntry[] }>({
    queryKey: ['admin-leaderboard'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/gamification/leaderboard?limit=10')
        return res.data
      } catch {
        return { entries: [] }
      }
    },
  })

  const { data: badges, isLoading: badgesLoading } = useQuery<{ badges: BadgeInfo[] }>({
    queryKey: ['admin-badges'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/gamification/badges/all?include_secret=true')
        return res.data
      } catch {
        return { badges: [] }
      }
    },
  })

  if (lbLoading || badgesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gamification</h1>
          <p className="text-muted-foreground">Manage XP, badges, and leaderboards</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const entries = leaderboard?.entries || []
  const allBadges = badges?.badges || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gamification</h1>
        <p className="text-muted-foreground">Manage XP, badges, and leaderboards</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Total Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allBadges.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Total XP Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entries.reduce((sum, e) => sum + e.total_xp, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4 text-purple-500" />
              Highest Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entries.length > 0 ? Math.max(...entries.map(e => e.level)) : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              Active Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Players
            </CardTitle>
            <CardDescription>Current XP leaderboard</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">XP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No players yet
                  </TableCell>
                </TableRow>
              ) : (
                entries.slice(0, 10).map((entry, i) => (
                  <TableRow key={entry.user_id}>
                    <TableCell>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </TableCell>
                    <TableCell className="font-medium">{entry.display_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Lv.{entry.level}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.total_xp.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              Available Badges
            </CardTitle>
            <CardDescription>All achievement badges</CardDescription>
          </CardHeader>
          <div className="p-4">
            {allBadges.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No badges configured</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {allBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="text-2xl">{badge.icon || '🏆'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{badge.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {badge.description}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          badge.rarity === 'legendary' ? 'text-yellow-500 border-yellow-500' :
                          badge.rarity === 'epic' ? 'text-purple-500 border-purple-500' :
                          badge.rarity === 'rare' ? 'text-blue-500 border-blue-500' :
                          ''
                        }
                      >
                        {badge.rarity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* XP Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            XP Rewards
          </CardTitle>
          <CardDescription>Current XP reward configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span className="font-medium">Task Completion</span>
              </div>
              <div className="text-2xl font-bold text-green-600">+10-50 XP</div>
              <p className="text-sm text-muted-foreground">Based on difficulty</p>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Daily Streak</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">+5 XP/day</div>
              <p className="text-sm text-muted-foreground">Streak multiplier applies</p>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Perfect Score</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">+25 XP</div>
              <p className="text-sm text-muted-foreground">100% correct on first try</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
