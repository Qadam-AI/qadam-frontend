'use client'

import { useXP } from '@/hooks/useXP'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Zap, Star } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface XPBadgeProps {
  variant?: 'compact' | 'full'
  className?: string
}

export function XPBadge({ variant = 'compact', className }: XPBadgeProps) {
  const { xp, level, xpToNextLevel, levelProgress, isLoading } = useXP()

  if (isLoading) {
    return <Skeleton className={cn('h-8 w-20', className)} />
  }

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 cursor-default',
                className
              )}
            >
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                Lv.{level}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="font-semibold">{xp} XP</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {xpToNextLevel} XP to Level {level + 1}
              </div>
              <Progress value={levelProgress} className="h-1.5 w-32" />
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <div className="font-semibold">Level {level}</div>
            <div className="text-xs text-muted-foreground">{xp} XP total</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">{Math.round(levelProgress)}%</div>
          <div className="text-xs text-muted-foreground">
            {xpToNextLevel} to next
          </div>
        </div>
      </div>
      <Progress value={levelProgress} className="h-2" />
    </div>
  )
}
