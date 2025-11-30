'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from './useAuth'

interface BookmarkedLesson {
  id: string
  title: string
  courseId: string
  position: number
  bookmarkedAt: string
}

interface BookmarkStatus {
  bookmarked: boolean
}

export function useBookmarks() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const { data: bookmarks = [], isLoading } = useQuery<BookmarkedLesson[]>({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const { data } = await api.get('/lessons/bookmarks')
      return data
    },
    enabled: isAuthenticated,
  })

  return {
    bookmarks,
    isLoading,
    invalidateBookmarks: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  }
}

export function useBookmarkStatus(lessonId: string | undefined) {
  const { isAuthenticated } = useAuth()

  const { data, isLoading } = useQuery<BookmarkStatus>({
    queryKey: ['bookmark', lessonId],
    queryFn: async () => {
      const { data } = await api.get(`/lessons/${lessonId}/bookmark`)
      return data
    },
    enabled: isAuthenticated && !!lessonId,
  })

  return {
    isBookmarked: data?.bookmarked ?? false,
    isLoading,
  }
}

export function useToggleBookmark() {
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { data } = await api.post(`/lessons/${lessonId}/bookmark`)
      return data
    },
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', lessonId] })
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { data } = await api.delete(`/lessons/${lessonId}/bookmark`)
      return data
    },
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', lessonId] })
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })

  const toggleBookmark = async (lessonId: string, currentlyBookmarked: boolean) => {
    if (currentlyBookmarked) {
      return removeMutation.mutateAsync(lessonId)
    } else {
      return addMutation.mutateAsync(lessonId)
    }
  }

  return {
    toggleBookmark,
    isToggling: addMutation.isPending || removeMutation.isPending,
  }
}
