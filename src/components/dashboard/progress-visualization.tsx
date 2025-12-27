'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  CheckCircle, Circle, Lock, Star, TrendingUp, 
  BookOpen, Code, Zap, Target, ChevronRight
} from 'lucide-react'
import api from '@/lib/api'

// Types
interface SkillNode {
  id: string
  name: string
  description?: string
  mastery: number  // 0-100
  status: 'locked' | 'available' | 'in-progress' | 'completed'
  prerequisites: string[]
  children: string[]
  category: string
  xPosition?: number
  yPosition?: number
}

interface SkillTreeData {
  nodes: SkillNode[]
  categories: { id: string; name: string; color: string }[]
}

interface MasteryData {
  conceptId: string
  conceptName: string
  mastery: number
  lastPracticed?: string
  totalAttempts: number
  successRate: number
}

interface ProgressData {
  coursesEnrolled: number
  coursesCompleted: number
  lessonsCompleted: number
  totalLessons: number
  tasksCompleted: number
  averageMastery: number
  weeklyProgress: { date: string; value: number }[]
}

// Mastery Level Badge
function getMasteryLevel(mastery: number): { label: string; color: string; icon: React.ReactNode } {
  if (mastery >= 90) return { label: 'Master', color: 'bg-purple-500', icon: <Star className="h-3 w-3" /> }
  if (mastery >= 70) return { label: 'Advanced', color: 'bg-blue-500', icon: <Zap className="h-3 w-3" /> }
  if (mastery >= 50) return { label: 'Intermediate', color: 'bg-green-500', icon: <TrendingUp className="h-3 w-3" /> }
  if (mastery >= 20) return { label: 'Beginner', color: 'bg-yellow-500', icon: <Target className="h-3 w-3" /> }
  return { label: 'New', color: 'bg-gray-400', icon: <Circle className="h-3 w-3" /> }
}

// Skill Tree Node Component
function SkillTreeNode({ 
  node, 
  onSelect 
}: { 
  node: SkillNode
  onSelect?: (node: SkillNode) => void 
}) {
  const masteryLevel = getMasteryLevel(node.mastery)
  
  const statusStyles = {
    locked: 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed',
    available: 'bg-white dark:bg-gray-800 border-2 border-primary hover:shadow-lg cursor-pointer',
    'in-progress': 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/30 border-2 border-blue-400',
    completed: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/30 border-2 border-green-400',
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: node.status !== 'locked' ? 1.05 : 1 }}
            whileTap={{ scale: node.status !== 'locked' ? 0.95 : 1 }}
            className={`
              relative w-24 h-24 rounded-xl flex flex-col items-center justify-center 
              shadow-md transition-all ${statusStyles[node.status]}
            `}
            onClick={() => node.status !== 'locked' && onSelect?.(node)}
          >
            {/* Status Icon */}
            <div className="absolute -top-2 -right-2">
              {node.status === 'completed' && (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <CheckCircle className="h-4 w-4" />
                </div>
              )}
              {node.status === 'locked' && (
                <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white">
                  <Lock className="h-3 w-3" />
                </div>
              )}
            </div>

            {/* Node Content */}
            <div className="text-center p-2">
              <p className="text-sm font-medium truncate max-w-[80px]">{node.name}</p>
              {node.status !== 'locked' && (
                <div className="mt-1">
                  <Progress value={node.mastery} className="h-1.5 w-16" />
                  <p className="text-xs text-muted-foreground mt-1">{node.mastery}%</p>
                </div>
              )}
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{node.name}</p>
            {node.description && (
              <p className="text-xs text-muted-foreground max-w-[200px]">{node.description}</p>
            )}
            <div className="flex items-center gap-1">
              <Badge className={masteryLevel.color} variant="secondary">
                {masteryLevel.icon}
                <span className="ml-1">{masteryLevel.label}</span>
              </Badge>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Skill Tree View
export function SkillTree({ 
  data, 
  isLoading,
  onNodeSelect 
}: { 
  data?: SkillTreeData
  isLoading?: boolean
  onNodeSelect?: (node: SkillNode) => void
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-center">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="w-24 h-24 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group nodes by category
  const nodesByCategory = data?.nodes.reduce((acc, node) => {
    if (!acc[node.category]) acc[node.category] = []
    acc[node.category].push(node)
    return acc
  }, {} as Record<string, SkillNode[]>) ?? {}

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Skill Tree
        </CardTitle>
        <CardDescription>
          Your learning journey visualized
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {data?.categories.map((category) => (
            <div key={category.id}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </h3>
              <div className="flex flex-wrap gap-4">
                {nodesByCategory[category.id]?.map((node, index) => (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <SkillTreeNode 
                      node={node} 
                      onSelect={onNodeSelect}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Mastery Progress Card
export function MasteryProgressCard({
  masteryData,
  isLoading
}: {
  masteryData?: MasteryData[]
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // Sort by mastery descending
  const sorted = [...(masteryData ?? [])].sort((a, b) => b.mastery - a.mastery)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Concept Mastery
        </CardTitle>
        <CardDescription>
          Your understanding of key concepts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sorted.slice(0, 10).map((item, index) => {
            const level = getMasteryLevel(item.mastery)
            
            return (
              <motion.div
                key={item.conceptId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.conceptName}</span>
                  <div className="flex items-center gap-2">
                    <Badge className={level.color} variant="secondary">
                      {level.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {item.mastery}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={item.mastery} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{item.totalAttempts} attempts</span>
                  <span>{Math.round(item.successRate * 100)}% success rate</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Weekly Progress Chart (simplified bar chart)
export function WeeklyProgressChart({
  data,
  isLoading
}: {
  data?: { date: string; value: number }[]
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="flex-1" style={{ height: `${30 + Math.random() * 70}%` }} />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...(data?.map(d => d.value) ?? [1]), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Weekly Progress
        </CardTitle>
        <CardDescription>
          Your learning activity this week
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-40">
          {data?.map((item, index) => {
            const height = (item.value / maxValue) * 100
            const day = new Date(item.date).toLocaleDateString('en', { weekday: 'short' })
            
            return (
              <motion.div
                key={item.date}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div 
                  className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors cursor-pointer"
                  style={{ height: '100%', minHeight: item.value > 0 ? '8px' : '0' }}
                />
                <span className="text-xs text-muted-foreground">{day}</span>
              </motion.div>
            )
          })}
        </div>
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <span>Tasks completed this week</span>
          <span className="font-medium">
            {data?.reduce((sum, d) => sum + d.value, 0) ?? 0} total
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// Course Progress Overview
export function CourseProgressOverview({
  progress,
  isLoading
}: {
  progress?: ProgressData
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const stats = [
    {
      label: 'Courses',
      value: `${progress?.coursesCompleted ?? 0}/${progress?.coursesEnrolled ?? 0}`,
      description: 'Completed',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-blue-500',
    },
    {
      label: 'Lessons',
      value: `${progress?.lessonsCompleted ?? 0}/${progress?.totalLessons ?? 0}`,
      description: 'Completed',
      icon: <Code className="h-5 w-5" />,
      color: 'text-green-500',
    },
    {
      label: 'Tasks',
      value: progress?.tasksCompleted ?? 0,
      description: 'Solved',
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'text-purple-500',
    },
    {
      label: 'Avg Mastery',
      value: `${progress?.averageMastery ?? 0}%`,
      description: 'Overall',
      icon: <Star className="h-5 w-5" />,
      color: 'text-yellow-500',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="p-4 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={stat.color}>{stat.icon}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Hooks
export function useSkillTree() {
  return useQuery<SkillTreeData>({
    queryKey: ['skill-tree'],
    queryFn: async () => {
      const response = await api.get('/mastery/skill-tree')
      return response.data
    },
  })
}

export function useMasteryProgress(userId?: string) {
  return useQuery<MasteryData[]>({
    queryKey: ['mastery-progress', userId],
    queryFn: async () => {
      const response = await api.get(`/mastery/${userId}`)
      return response.data
    },
    enabled: !!userId,
  })
}

export function useProgressData(userId?: string) {
  return useQuery<ProgressData>({
    queryKey: ['progress-data', userId],
    queryFn: async () => {
      const response = await api.get(`/analytics/progress/${userId}`)
      return response.data
    },
    enabled: !!userId,
  })
}
