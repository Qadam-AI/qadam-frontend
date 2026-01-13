'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
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
  Users,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { IconPicker } from '@/components/icon-picker'

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
  display_name: string
  description: string
  icon: string
  category: string
  rarity: string
  requirement_type: string
  requirement_value: number
  xp_reward: number
  color: string
  is_secret: boolean
  earned_count?: number
}

export default function AdminGamification() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    icon: '🏆',
    category: 'progress',
    rarity: 'common',
    requirement_type: 'tasks_completed',
    requirement_value: 1,
    xp_reward: 50,
    color: '#4F46E5',
    is_secret: false,
  })

  const { data: leaderboard, isLoading: lbLoading } = useQuery<{ entries: LeaderboardEntry[] }>({
    queryKey: ['admin-leaderboard'],
    queryFn: async () => {
      try {
        const res = await api.get('/gamification/leaderboard?limit=10')
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
        const res = await api.get('/admin/gamification/badges')
        // Handle array response directly if that's what the backend returns
        if (Array.isArray(res.data)) {
          return { badges: res.data }
        }
        return { badges: res.data }
      } catch {
        // Fallback to public endpoint
        const res = await api.get('/gamification/badges/all?include_secret=true')
        return res.data
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await api.post('/admin/gamification/badges', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] })
      setIsCreateOpen(false)
      resetForm()
      toast.success('Badge created successfully')
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create badge')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BadgeInfo> }) => {
      await api.patch(`/admin/gamification/badges/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] })
      setIsEditOpen(false)
      setSelectedBadge(null)
      toast.success('Badge updated successfully')
    },
    onError: () => {
      toast.error('Failed to update badge')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/gamification/badges/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] })
      setIsDeleteOpen(false)
      setSelectedBadge(null)
      toast.success('Badge deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete badge')
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      icon: '🏆',
      category: 'progress',
      rarity: 'common',
      requirement_type: 'tasks_completed',
      requirement_value: 1,
      xp_reward: 50,
      color: '#4F46E5',
      is_secret: false,
    })
  }

  const handleCreate = () => {
    if (!formData.name || !formData.display_name) {
      toast.error('Please fill all required fields')
      return
    }
    createMutation.mutate(formData)
  }

  const handleEdit = () => {
    if (!selectedBadge) return
    updateMutation.mutate({
      id: selectedBadge.id,
      data: {
        display_name: formData.display_name,
        description: formData.description,
        icon: formData.icon,
        category: formData.category,
        rarity: formData.rarity,
        requirement_type: formData.requirement_type,
        requirement_value: formData.requirement_value,
        xp_reward: formData.xp_reward,
        color: formData.color,
        is_secret: formData.is_secret,
      },
    })
  }

  const handleDelete = () => {
    if (!selectedBadge) return
    deleteMutation.mutate(selectedBadge.id)
  }

  const openEditDialog = (badge: BadgeInfo) => {
    setSelectedBadge(badge)
    setFormData({
      name: badge.name,
      display_name: badge.display_name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      rarity: badge.rarity,
      requirement_type: badge.requirement_type,
      requirement_value: badge.requirement_value,
      xp_reward: badge.xp_reward,
      color: badge.color,
      is_secret: badge.is_secret,
    })
    setIsEditOpen(true)
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gamification</h1>
          <p className="text-muted-foreground">Manage XP, badges, and leaderboards</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Badge
        </Button>
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

      {/* Leaderboard and Badges */}
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
              <div className="grid grid-cols-1 gap-3">
                {allBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card group"
                  >
                    <div className="w-10 h-10 flex items-center justify-center text-primary">
                      {badge.icon?.startsWith('<svg') ? (
                        <div dangerouslySetInnerHTML={{ __html: badge.icon }} className="w-8 h-8 [&>svg]:w-full [&>svg]:h-full" />
                      ) : (
                        <span className="text-2xl">{badge.icon || '🏆'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{badge.display_name || badge.name}</span>
                        {badge.is_secret && <Badge variant="secondary" className="text-[10px]">Secret</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {badge.description}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] capitalize ${
                            badge.rarity === 'legendary' ? 'text-yellow-500 border-yellow-500' :
                            badge.rarity === 'epic' ? 'text-purple-500 border-purple-500' :
                            badge.rarity === 'rare' ? 'text-blue-500 border-blue-500' :
                            ''
                          }`}
                        >
                          {badge.rarity}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          +{badge.xp_reward} XP
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(badge)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive" 
                        onClick={() => { setSelectedBadge(badge); setIsDeleteOpen(true) }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false)
          setIsEditOpen(false)
          setSelectedBadge(null)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isCreateOpen ? 'Create Badge' : 'Edit Badge'}</DialogTitle>
            <DialogDescription>
              {isCreateOpen ? 'Add a new achievement badge to the system.' : 'Update badge details.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Internal Name (ID)</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="first_step"
                  disabled={isEditOpen}
                />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input 
                  value={formData.display_name} 
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="First Step"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Complete your first task"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <IconPicker
                  value={formData.icon}
                  onChange={(svgContent, iconName) => setFormData({ ...formData, icon: svgContent })}
                  placeholder="Select an icon"
                />
              </div>
              <div className="space-y-2">
                <Label>XP Reward</Label>
                <Input 
                  type="number"
                  value={formData.xp_reward} 
                  onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="streak">Streak</SelectItem>
                    <SelectItem value="mastery">Mastery</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                    <SelectItem value="challenge">Challenge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rarity</Label>
                <Select 
                  value={formData.rarity} 
                  onValueChange={(val) => setFormData({ ...formData, rarity: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">Common</SelectItem>
                    <SelectItem value="uncommon">Uncommon</SelectItem>
                    <SelectItem value="rare">Rare</SelectItem>
                    <SelectItem value="epic">Epic</SelectItem>
                    <SelectItem value="legendary">Legendary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Requirement Type</Label>
                <Select 
                  value={formData.requirement_type} 
                  onValueChange={(val) => setFormData({ ...formData, requirement_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tasks_completed">Tasks Completed</SelectItem>
                    <SelectItem value="streak_days">Streak Days</SelectItem>
                    <SelectItem value="xp_earned">XP Earned</SelectItem>
                    <SelectItem value="courses_completed">Courses Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Requirement Value</Label>
                <Input 
                  type="number"
                  value={formData.requirement_value} 
                  onChange={(e) => setFormData({ ...formData, requirement_value: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Secret Badge</Label>
                <p className="text-sm text-muted-foreground">Hidden until earned</p>
              </div>
              <Switch 
                checked={formData.is_secret}
                onCheckedChange={(checked) => setFormData({ ...formData, is_secret: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false) }}>
              Cancel
            </Button>
            <Button onClick={isCreateOpen ? handleCreate : handleEdit}>
              {isCreateOpen ? 'Create Badge' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Badge</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedBadge?.display_name || selectedBadge?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
