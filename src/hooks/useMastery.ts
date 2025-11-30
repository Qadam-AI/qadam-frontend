import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { masteryItemSchema, nextTaskSchema } from '@/lib/validation'
import { z } from 'zod'

export function useMastery(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['mastery', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required')
      const response = await api.get(`/users/${userId}/mastery`)
      return z.array(masteryItemSchema).parse(response.data)
    },
    enabled: !!userId,
  })
}

export function useNextTask(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['next-task', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required')
      const response = await api.get('/next', { params: { userId } })
      return nextTaskSchema.parse(response.data)
    },
    enabled: !!userId,
  })
}

