'use client'

import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { formatPercent } from '@/lib/utils'

interface MasteryBarProps {
  value: number // 0..1
  animated?: boolean
  showLabel?: boolean
  className?: string
}

export function MasteryBar({ value, animated = true, showLabel = true, className }: MasteryBarProps) {
  const percentage = value * 100

  // Color based on mastery level
  const getColor = () => {
    if (value < 0.3) return 'bg-amber-500'
    if (value < 0.7) return 'bg-blue-500'
    return 'bg-emerald-500'
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        {showLabel && (
          <span className="text-sm font-medium text-muted-foreground">Mastery</span>
        )}
        <motion.span
          initial={animated ? { opacity: 0, scale: 0.5 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-sm font-semibold"
        >
          {formatPercent(value)}
        </motion.span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${getColor()} transition-colors`}
        />
      </div>
    </div>
  )
}

