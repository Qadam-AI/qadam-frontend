import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { generatedTaskSchema, gradeResultSchema } from '@/lib/validation'
import type { TaskGenerateRequest, TaskGradeRequest } from '@/lib/types'

export function useTasks() {
  const generateTaskMutation = useMutation({
    mutationFn: async (request: TaskGenerateRequest) => {
      const response = await api.post('/task/generate', request)
      return generatedTaskSchema.parse(response.data)
    },
  })

  const gradeTaskMutation = useMutation({
    mutationFn: async (request: TaskGradeRequest) => {
      const response = await api.post('/task/grade', request)
      return gradeResultSchema.parse(response.data)
    },
  })

  return {
    generateTask: generateTaskMutation.mutate,
    generateTaskAsync: generateTaskMutation.mutateAsync,
    isGenerating: generateTaskMutation.isPending,
    generatedTask: generateTaskMutation.data,
    
    gradeTask: gradeTaskMutation.mutate,
    gradeTaskAsync: gradeTaskMutation.mutateAsync,
    isGrading: gradeTaskMutation.isPending,
    gradeResult: gradeTaskMutation.data,
  }
}

