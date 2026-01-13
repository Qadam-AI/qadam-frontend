import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().optional().nullable(),
  name: z.string().nullable(),
  role: z.string(),
})

export const loginResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
})

export const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  language: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const conceptSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullable(),
})

export const lessonSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  position: z.number(),
})

export const courseDetailSchema = courseSchema.extend({
  lessons: z.array(lessonSummarySchema),
  concepts: z.array(conceptSummarySchema),
})

export const resourceItemSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  url: z.string(),
  type: z.string(),
})

export const lessonSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),  // Markdown content
  videoUrl: z.string().nullable(),
  position: z.number(),
  durationSeconds: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  resources: z.array(resourceItemSchema).optional().default([]),
  attachments: z.array(resourceItemSchema).optional().default([]),
  concepts: z.array(conceptSummarySchema),
})

export const masteryItemSchema = z.object({
  conceptId: z.string(),
  conceptName: z.string(),
  mastery: z.number(),
})

export const nextTaskSchema = z.object({
  conceptId: z.string(),
  conceptName: z.string(),
  difficulty: z.number(),
  reason: z.string(),
})

export const testCaseSchema = z.object({
  name: z.string(),
  input: z.string().optional(),
  expected: z.string().optional(),
})

// Task types from the dynamic orchestrator
export const taskTypeSchema = z.enum([
  'coding',
  'multiple_choice',
  'fill_blank',
  'short_answer',
  'matching',
  'ordering',
  'true_false',
  'diagram_label',
  'case_study',
  'practical',
  'reflection',
  'calculation',
  'comparison',
  'definition',
  'example',
])

export const generatedTaskSchema = z.object({
  taskId: z.string(),
  taskType: taskTypeSchema.optional().default('short_answer'), // NEW: dynamic task type
  prompt: z.string(),
  starterCode: z.string().nullable(),
  tests: z.array(testCaseSchema),
  hint: z.string().nullable(),
  // Additional task-specific data
  options: z.array(z.string()).nullable().optional(),  // For multiple choice
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).nullable().optional(),  // For matching
  items: z.array(z.string()).nullable().optional(),  // For ordering
  statements: z.array(z.object({ statement: z.string(), answer: z.boolean().optional() })).nullable().optional(),  // For true/false
})

export const testFailureSchema = z.object({
  name: z.string(),
  expected: z.string().optional(),
  received: z.string().optional(),
})

export const gradeResultSchema = z.object({
  passed: z.boolean(),
  failures: z.array(testFailureSchema),
  aiFeedback: z.string().nullable(),
  timeMs: z.number(),
  xpEarned: z.number().optional().default(0),
})

export const attemptSummarySchema = z.object({
  id: z.string(),
  taskId: z.string(),
  conceptId: z.string(),
  passed: z.boolean(),
  createdAt: z.string(),
  timeMs: z.number().nullable(),
})

