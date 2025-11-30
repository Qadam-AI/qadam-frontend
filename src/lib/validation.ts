import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
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

export const lessonSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  videoUrl: z.string().nullable(),
  position: z.number(),
  durationSeconds: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
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

export const generatedTaskSchema = z.object({
  taskId: z.string(),
  prompt: z.string(),
  starterCode: z.string().nullable(),
  tests: z.array(testCaseSchema),
  hint: z.string().nullable(),
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

