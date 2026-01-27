import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { GitBranch, BookOpen } from 'lucide-react'
import type { ConceptMapNode } from '@/lib/api'

interface ConceptNodeProps {
  data: {
    concept: ConceptMapNode
    lessonTitle: string
    lessonId: string
  }
  selected?: boolean
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800'
    case 'hard':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800'
    default:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800'
  }
}

export const ConceptNode = memo(({ data, selected }: ConceptNodeProps) => {
  const { concept, lessonTitle } = data

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
              : 'border-gray-200 dark:border-gray-800 hover:border-primary/50 hover:shadow-md'
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
              className={`text-xs shrink-0 ${getDifficultyColor(concept.difficulty)}`}
            >
              {concept.difficulty}
            </Badge>
          </div>
          
          {/* Lesson tag */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            <span className="truncate">{lessonTitle}</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-2">
          {/* Description preview */}
          {concept.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {concept.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 pt-1">
            {concept.prereq_ids.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                <span>{concept.prereq_ids.length} prereq{concept.prereq_ids.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            {concept.lesson_ids.length > 1 && (
              <Badge variant="secondary" className="text-xs">
                {concept.lesson_ids.length} lessons
              </Badge>
            )}
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

ConceptNode.displayName = 'ConceptNode'
