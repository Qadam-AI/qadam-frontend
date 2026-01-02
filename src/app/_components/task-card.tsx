'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Challenge</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Icon className="h-3 w-3" />
              {typeLabel}
            </Badge>
            {difficulty && (
              <Badge variant="secondary">
                Difficulty {difficulty}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-base leading-relaxed whitespace-pre-wrap">{prompt}</p>
        </div>

        {tests.length > 0 && taskType === 'coding' && (
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TestTube2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Tests ({tests.length})</p>
            </div>
            <ul className="space-y-1">
              {tests.map((test, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start">
                  <span className="mr-2">•</span>
                  <span>{test.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hint && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary mb-1">Hint</p>
                <p className="text-sm text-muted-foreground">{hint}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

