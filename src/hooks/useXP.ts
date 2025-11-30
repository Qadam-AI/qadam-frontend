'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

interface XPData {
  xp: number
  level: number
  xpToNextLevel: number
  levelProgress: number
}

export function useXP() {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<XPData>({
    queryKey: ['user-xp'],
    queryFn: async () => {
      const response = await api.get('/users/xp')
      return response.data
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  })

  const invalidateXP = () => {
    queryClient.invalidateQueries({ queryKey: ['user-xp'] })
  }

  return {
    xp: data?.xp ?? 0,
    level: data?.level ?? 1,
    xpToNextLevel: data?.xpToNextLevel ?? 100,
    levelProgress: data?.levelProgress ?? 0,
    isLoading,
    error,
    refetch,
    invalidateXP,
  }
}
