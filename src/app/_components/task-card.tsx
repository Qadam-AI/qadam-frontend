'use client'

import { Info, TestTube2, Code, FileQuestion, Type, List, ArrowUpDown, CheckCircle, Image, BookOpen, Wrench, Brain, Calculator, GitCompare, BookText, Lightbulb } from 'lucide-react'
import type { TestCase, TaskType } from '@/lib/types'

// Icons for each task type
const TASK_ICONS: Record<TaskType, typeof Code> = {
  coding: Code,
  multiple_choice: FileQuestion,
  fill_blank: Type,
  short_answer: Type,
  matching: List,
  ordering: ArrowUpDown,
  true_false: CheckCircle,
  diagram_label: Image,
  case_study: BookOpen,
  practical: Wrench,
  reflection: Brain,
  calculation: Calculator,
  comparison: GitCompare,
  definition: BookText,
  example: Lightbulb,
}

// Labels for each task type
const TASK_LABELS: Record<TaskType, string> = {
  coding: 'Coding',
  multiple_choice: 'Multiple Choice',
  fill_blank: 'Fill Blank',
  short_answer: 'Short Answer',
  matching: 'Matching',
  ordering: 'Ordering',
  true_false: 'True/False',
  diagram_label: 'Diagram',
  case_study: 'Case Study',
  practical: 'Practical',
  reflection: 'Reflection',
  calculation: 'Calculation',
  comparison: 'Comparison',
  definition: 'Definition',
  example: 'Example',
}

interface TaskCardProps {
  prompt: string
  tests: TestCase[]
  hint?: string | null
  difficulty?: number
  taskType?: TaskType
}

export function TaskCard({ prompt, tests, hint, difficulty, taskType = 'short_answer' }: TaskCardProps) {
  const Icon = TASK_ICONS[taskType] || FileQuestion
  const typeLabel = TASK_LABELS[taskType] || 'Task'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-md text-foreground">
             <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-medium tracking-tight text-foreground">
              {typeLabel}
            </h2>
            <p className="text-sm text-muted-foreground">
              Read carefully and submit your answer below
            </p>
          </div>
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <div className="text-lg leading-relaxed whitespace-pre-wrap font-serif">
          {prompt}
        </div>
      </div>

      {tests.length > 0 && taskType === 'coding' && (
        <div className="mt-8 pt-6 border-t">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
            <TestTube2 className="h-4 w-4" />
            <p className="text-sm font-medium uppercase tracking-wider">Verification Tests</p>
          </div>
          <ul className="space-y-2">
            {tests.map((test, i) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start gap-2 font-mono bg-muted/30 p-2 rounded">
                 <span className="text-muted-foreground select-none">Expected:</span>
                 <span>{test.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hint && (
        <div className="mt-6 flex items-start gap-3 text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{hint}</p>
        </div>
      )}
    </div>
  )
}

