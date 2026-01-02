'use client'

/**
 * Dynamic Task Renderers
 * 
 * Renders different UI components based on task_type from the API.
 * Supports ALL task types from the orchestrator:
 * - coding, multiple_choice, fill_blank, short_answer, matching, ordering,
 * - true_false, diagram_label, case_study, practical, reflection, 
 * - calculation, comparison, definition, example
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Code, FileQuestion, List, Type, ArrowUpDown, 
  CheckCircle, XCircle, Image, BookOpen, Wrench,
  Brain, Calculator, GitCompare, BookText, Lightbulb
} from 'lucide-react'
import { CodeEditor } from '@/app/_components/code-editor'

// Task type definitions
export type TaskType = 
  | 'coding'
  | 'multiple_choice'
  | 'fill_blank'
  | 'short_answer'
  | 'matching'
  | 'ordering'
  | 'true_false'
  | 'diagram_label'
  | 'case_study'
  | 'practical'
  | 'reflection'
  | 'calculation'
  | 'comparison'
  | 'definition'
  | 'example'

interface TaskRendererProps {
  taskType: TaskType
  prompt: string
  starterCode?: string | null
  options?: string[] | null
  pairs?: { left: string; right: string }[] | null
  items?: string[] | null
  statements?: { statement: string; answer?: boolean }[] | null
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

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
  coding: 'Coding Challenge',
  multiple_choice: 'Multiple Choice',
  fill_blank: 'Fill in the Blanks',
  short_answer: 'Short Answer',
  matching: 'Matching',
  ordering: 'Put in Order',
  true_false: 'True or False',
  diagram_label: 'Label the Diagram',
  case_study: 'Case Study',
  practical: 'Practical Application',
  reflection: 'Reflection',
  calculation: 'Calculation',
  comparison: 'Compare & Contrast',
  definition: 'Definition',
  example: 'Give Examples',
}

/**
 * Main component that renders the appropriate UI based on task type
 */
export function TaskRenderer({
  taskType,
  prompt,
  starterCode,
  options,
  pairs,
  items,
  statements,
  value,
  onChange,
  disabled = false,
}: TaskRendererProps) {
  const Icon = TASK_ICONS[taskType] || FileQuestion
  const label = TASK_LABELS[taskType] || 'Task'

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Render appropriate input based on task type */}
        {taskType === 'coding' && (
          <CodingRenderer
            starterCode={starterCode || ''}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )}
        
        {taskType === 'multiple_choice' && (
          <MultipleChoiceRenderer
            options={options || []}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )}
        
        {taskType === 'true_false' && (
          <TrueFalseRenderer
            statements={statements || []}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )}
        
        {taskType === 'matching' && (
          <MatchingRenderer
            pairs={pairs || []}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )}
        
        {taskType === 'ordering' && (
          <OrderingRenderer
            items={items || []}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        )}
        
        {(taskType === 'fill_blank' || 
          taskType === 'short_answer' ||
          taskType === 'case_study' ||
          taskType === 'practical' ||
          taskType === 'reflection' ||
          taskType === 'calculation' ||
          taskType === 'comparison' ||
          taskType === 'definition' ||
          taskType === 'example' ||
          taskType === 'diagram_label') && (
          <TextInputRenderer
            starterCode={starterCode || ''}
            value={value}
            onChange={onChange}
            disabled={disabled}
            isLongForm={['case_study', 'practical', 'reflection', 'comparison'].includes(taskType)}
          />
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Code editor for programming tasks
 */
function CodingRenderer({
  starterCode,
  value,
  onChange,
  disabled,
}: {
  starterCode: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  return (
    <div className="space-y-2">
      <Label>Your Code</Label>
      <CodeEditor
        initialCode={value || starterCode}
        onChange={onChange}
      />
    </div>
  )
}

/**
 * Multiple choice with radio buttons
 */
function MultipleChoiceRenderer({
  options,
  value,
  onChange,
  disabled,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  // Parse current selection
  const selected = value || ''

  return (
    <div className="space-y-3">
      <Label>Select your answer:</Label>
      <RadioGroup value={selected} onValueChange={onChange} disabled={disabled}>
        {options.length > 0 ? (
          options.map((option, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={String.fromCharCode(65 + index)} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Label>
            </div>
          ))
        ) : (
          // Default options if none provided (template mode)
          ['A', 'B', 'C', 'D'].map((letter) => (
            <div key={letter} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={letter} id={`option-${letter}`} />
              <Label htmlFor={`option-${letter}`} className="flex-1 cursor-pointer">
                <span className="font-semibold mr-2">{letter}.</span>
                [Option {letter}]
              </Label>
            </div>
          ))
        )}
      </RadioGroup>
    </div>
  )
}

/**
 * True/False statements
 */
function TrueFalseRenderer({
  statements,
  value,
  onChange,
  disabled,
}: {
  statements: { statement: string; answer?: boolean }[]
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  // Parse value as JSON object: { "0": true, "1": false, ... }
  let answers: Record<string, boolean> = {}
  try {
    if (value) answers = JSON.parse(value)
  } catch { }

  const updateAnswer = (index: number, ans: boolean) => {
    const newAnswers = { ...answers, [index]: ans }
    onChange(JSON.stringify(newAnswers))
  }

  const statementList = statements.length > 0 
    ? statements 
    : [{ statement: 'Statement 1' }, { statement: 'Statement 2' }]

  return (
    <div className="space-y-4">
      <Label>Mark each statement as True or False:</Label>
      {statementList.map((item, index) => (
        <div key={index} className="p-4 rounded-lg border space-y-3">
          <p className="font-medium">{index + 1}. {item.statement}</p>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={answers[index] === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateAnswer(index, true)}
              disabled={disabled}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              True
            </Button>
            <Button
              type="button"
              variant={answers[index] === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateAnswer(index, false)}
              disabled={disabled}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              False
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Matching pairs
 */
function MatchingRenderer({
  pairs,
  value,
  onChange,
  disabled,
}: {
  pairs: { left: string; right: string }[]
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  // Value format: "1-A, 2-C, 3-B"
  const [matches, setMatches] = useState<Record<number, string>>({})

  useEffect(() => {
    // Parse value
    if (value) {
      const parsed: Record<number, string> = {}
      value.split(',').forEach(pair => {
        const [left, right] = pair.trim().split('-')
        if (left && right) {
          parsed[parseInt(left) - 1] = right.trim()
        }
      })
      setMatches(parsed)
    }
  }, [])

  const updateMatch = (leftIndex: number, rightLetter: string) => {
    const newMatches = { ...matches, [leftIndex]: rightLetter }
    setMatches(newMatches)
    
    // Format as "1-A, 2-B, 3-C"
    const formatted = Object.entries(newMatches)
      .map(([idx, letter]) => `${parseInt(idx) + 1}-${letter}`)
      .join(', ')
    onChange(formatted)
  }

  const pairList = pairs.length > 0 
    ? pairs 
    : [{ left: 'Item 1', right: 'Match A' }, { left: 'Item 2', right: 'Match B' }]
  
  const rightItems = pairList.map((p, i) => ({
    letter: String.fromCharCode(65 + i),
    text: p.right
  }))

  return (
    <div className="space-y-4">
      <Label>Match items from left to right:</Label>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Column A</p>
          {pairList.map((pair, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
              <Badge variant="outline">{index + 1}</Badge>
              <span className="flex-1">{pair.left}</span>
              <select
                value={matches[index] || ''}
                onChange={(e) => updateMatch(index, e.target.value)}
                disabled={disabled}
                className="px-3 py-1 rounded border bg-background"
              >
                <option value="">Select...</option>
                {rightItems.map((item) => (
                  <option key={item.letter} value={item.letter}>
                    {item.letter}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Column B</p>
          {rightItems.map((item) => (
            <div key={item.letter} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <Badge>{item.letter}</Badge>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Ordering/sequencing items
 */
function OrderingRenderer({
  items,
  value,
  onChange,
  disabled,
}: {
  items: string[]
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  const [order, setOrder] = useState<string[]>([])
  
  const itemList = items.length > 0 
    ? items 
    : ['Step 1', 'Step 2', 'Step 3', 'Step 4']

  useEffect(() => {
    if (value) {
      try {
        setOrder(JSON.parse(value))
      } catch {
        setOrder([])
      }
    }
  }, [])

  const addToOrder = (item: string) => {
    if (!order.includes(item)) {
      const newOrder = [...order, item]
      setOrder(newOrder)
      onChange(JSON.stringify(newOrder))
    }
  }

  const removeFromOrder = (index: number) => {
    const newOrder = order.filter((_, i) => i !== index)
    setOrder(newOrder)
    onChange(JSON.stringify(newOrder))
  }

  const clearOrder = () => {
    setOrder([])
    onChange('')
  }

  const availableItems = itemList.filter(item => !order.includes(item))

  return (
    <div className="space-y-4">
      <Label>Arrange items in the correct order (click to add):</Label>
      
      {/* Available items */}
      <div className="flex flex-wrap gap-2 p-4 rounded-lg border border-dashed min-h-[60px]">
        {availableItems.length > 0 ? (
          availableItems.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => addToOrder(item)}
              disabled={disabled}
            >
              {item}
            </Button>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">All items placed</span>
        )}
      </div>

      {/* Current order */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Your order:</p>
          {order.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearOrder} disabled={disabled}>
              Clear all
            </Button>
          )}
        </div>
        <div className="space-y-2 min-h-[100px]">
          {order.length > 0 ? (
            order.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Badge variant="default">{index + 1}</Badge>
                <span className="flex-1">{item}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromOrder(index)}
                  disabled={disabled}
                >
                  ×
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Click items above to add them in order
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Text input for fill-blank, short answer, and other text-based tasks
 */
function TextInputRenderer({
  starterCode,
  value,
  onChange,
  disabled,
  isLongForm = false,
}: {
  starterCode: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
  isLongForm?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label>Your Answer</Label>
      <Textarea
        value={value || starterCode}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer here..."
        className={cn(
          "font-mono text-sm",
          isLongForm ? "min-h-[300px]" : "min-h-[150px]"
        )}
      />
    </div>
  )
}

/**
 * Get the icon component for a task type
 */
export function getTaskTypeIcon(taskType: TaskType) {
  return TASK_ICONS[taskType] || FileQuestion
}

/**
 * Get the label for a task type
 */
export function getTaskTypeLabel(taskType: TaskType) {
  return TASK_LABELS[taskType] || 'Task'
}

/**
 * Check if task type requires code editor
 */
export function isCodeTask(taskType: TaskType): boolean {
  return taskType === 'coding'
}

/**
 * Check if task type is text-based
 */
export function isTextTask(taskType: TaskType): boolean {
  return [
    'fill_blank',
    'short_answer',
    'case_study',
    'practical',
    'reflection',
    'calculation',
    'comparison',
    'definition',
    'example',
    'diagram_label',
  ].includes(taskType)
}
