'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface BookmarkButtonProps {
  lessonId: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
}

export function BookmarkButton({ 
  lessonId, 
  variant = 'outline',
  size = 'sm',
  showLabel = false 
}: BookmarkButtonProps) {
  const queryClient = useQueryClient()

  // Check if lesson is bookmarked
  const { data: isBookmarked, isLoading: checkLoading } = useQuery({
    queryKey: ['bookmark-status', lessonId],
    queryFn: async () => {
      try {
        const res = await api.get<{ bookmarked: boolean }>(`/lessons/${lessonId}/bookmark/status`)
        return res.data.bookmarked
      } catch {
        return false
      }
    },
  })

  // Toggle bookmark mutation
  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await api.delete(`/lessons/${lessonId}/bookmark`)
      } else {
        await api.post(`/lessons/${lessonId}/bookmark`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark-status', lessonId] })
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      toast.success(isBookmarked ? 'Bookmark removed' : 'Lesson bookmarked!')
    },
    onError: () => {
      toast.error('Failed to update bookmark')
    },
  })

  const isLoading = checkLoading || toggleMutation.isPending

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={() => toggleMutation.mutate()}
            disabled={isLoading}
            className={isBookmarked ? 'text-rose-500 border-rose-500 hover:text-rose-600' : ''}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isBookmarked ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            {showLabel && (
              <span className="ml-2">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isBookmarked ? 'Remove bookmark' : 'Bookmark this lesson'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default BookmarkButton
