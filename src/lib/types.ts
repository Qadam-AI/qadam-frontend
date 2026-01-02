// API response types matching backend SPEC.txt

export type User = {
  id: string
  email: string
  name: string | null
  role: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  user: User
}

export type Course = {
  id: string
  title: string
  description: string | null
  language: string
  createdAt: string
  updatedAt: string
}

export type LessonSummary = {
  id: string
  title: string
  position: number
}

export type ConceptSummary = {
  id: string
  name: string
  slug: string | null
}

export type CourseDetail = Course & {
  lessons: LessonSummary[]
  concepts: ConceptSummary[]
}

export type Lesson = {
  id: string
  courseId: string
  title: string
  videoUrl: string | null
  position: number
  durationSeconds: number | null
  createdAt: string
  updatedAt: string
  concepts: ConceptSummary[]
}

export type LessonCompleteRequest = {
  watchSeconds: number
  completed: boolean
}

export type LessonCompleteResponse = {
  suggestedConceptId: string | null
  reason: string
}

export type MasteryItem = {
  conceptId: string
  conceptName: string
  mastery: number
}

export type NextTask = {
  conceptId: string
  conceptName: string
  difficulty: number
  reason: string
}

export type TestCase = {
  name: string
  input?: string
  expected?: string
}

// Task types from dynamic orchestrator
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

export type GeneratedTask = {
  taskId: string
  taskType: TaskType  // NEW: dynamic task type
  prompt: string
  starterCode: string | null
  tests: TestCase[]
  hint: string | null
  // Additional task-specific data
  options?: string[] | null  // For multiple choice
  pairs?: { left: string; right: string }[] | null  // For matching
  items?: string[] | null  // For ordering
  statements?: { statement: string; answer?: boolean }[] | null  // For true/false
}

export type TaskGenerateRequest = {
  userId: string
  conceptId: string
  difficulty: number
  errorTags?: string[]
}

export type TestFailure = {
  name: string
  expected?: string
  received?: string
}

export type GradeResult = {
  passed: boolean
  failures: TestFailure[]
  aiFeedback: string | null
  timeMs: number
  xpEarned: number
}

export type TaskGradeRequest = {
  taskId: string
  code: string
}

export type AttemptSummary = {
  id: string
  taskId: string
  conceptId: string
  passed: boolean
  createdAt: string
  timeMs: number | null
}

