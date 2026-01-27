import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'
import type { ConceptMapNode } from '@/lib/api'

interface PerformanceConceptNodeProps {
  data: {
    concept: ConceptMapNode
    lessonTitle: string
    performance: {
      status: 'not-started' | 'weak' | 'ok' | 'strong'
      total_attempts: number
      passed_attempts: number
      pass_rate: number
    }
  }
  selected?: boolean
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'strong':
      return {
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
        border: 'border-green-300 dark:border-green-700',
        icon: TrendingUp,
        label: 'Mastered',
        barColor: 'bg-green-500',
      }
    case 'ok':
      return {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
        border: 'border-yellow-300 dark:border-yellow-700',
        icon: Minus,
        label: 'Learning',
        barColor: 'bg-yellow-500',
      }
    case 'weak':
      return {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
        border: 'border-red-300 dark:border-red-700',
        icon: TrendingDown,
        label: 'Struggling',
        barColor: 'bg-red-500',
      }
    default:
      return {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
        border: 'border-gray-300 dark:border-gray-700',
        icon: AlertCircle,
        label: 'Not Started',
        barColor: 'bg-gray-400',
      }
  }
}

export const PerformanceConceptNode = memo(({ data, selected }: PerformanceConceptNodeProps) => {
  const { concept, lessonTitle, performance } = data
  const statusConfig = getStatusConfig(performance.status)
  const StatusIcon = statusConfig.icon

  return (
    <>
      <Handle type="target" position={Position.Left} />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        className={`
          w-72 rounded-lg border-2 bg-white dark:bg-gray-950 shadow-sm
          transition-all duration-200 cursor-pointer
          ${
            selected
              ? 'border-primary shadow-lg ring-2 ring-primary/20'
              : `${statusConfig.border} hover:shadow-md`
          }
        `}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1">
              {concept.name}
            </h3>
            <Badge
              variant="outline"
              className={`text-xs shrink-0 ${statusConfig.color}`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
          
          {/* Lesson tag */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            <span className="truncate">{lessonTitle}</span>
          </div>
        </div>

        {/* Body - Performance Stats */}
        <div className="px-4 py-3 space-y-3">
          {/* Pass rate progress bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Pass Rate</span>
              <span className="font-semibold">{Math.round(performance.pass_rate)}%</span>
            </div>
            <Progress 
              value={performance.pass_rate} 
              className={`h-2 ${statusConfig.barColor}`}
            />
          </div>

          {/* Attempt stats */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
            <div>
              <span className="text-muted-foreground">Attempts: </span>
              <span className="font-medium">{performance.total_attempts}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Passed: </span>
              <span className="font-medium text-green-600">{performance.passed_attempts}</span>
            </div>
          </div>
        </div>

        {/* Selection indicator */}
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
        )}
      </motion.div>

      <Handle type="source" position={Position.Right} />
    </>
  )
})

PerformanceConceptNode.displayName = 'PerformanceConceptNode'
