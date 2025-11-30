'use client'

import { Button } from '@/components/ui/button'
import { Bookmark } from 'lucide-react'
import { useBookmarkStatus, useToggleBookmark } from '@/hooks/useBookmarks'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface BookmarkButtonProps {
  lessonId: string
  variant?: 'icon' | 'default'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  className?: string
}

export function BookmarkButton({
  lessonId,
  variant = 'icon',
  size = 'icon',
  className,
}: BookmarkButtonProps) {
  const { isBookmarked, isLoading } = useBookmarkStatus(lessonId)
  const { toggleBookmark, isToggling } = useToggleBookmark()

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await toggleBookmark(lessonId, isBookmarked)
      toast.success(isBookmarked ? 'Bookmark removed' : 'Lesson bookmarked')
    } catch (error) {
      toast.error('Failed to update bookmark')
    }
  }

  if (isLoading) {
    return (
      <Button
        variant="ghost"
        size={size}
        className={cn('text-muted-foreground', className)}
        disabled
      >
        <Bookmark className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn(
        isBookmarked
          ? 'text-primary hover:text-primary/80'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
      onClick={handleClick}
      disabled={isToggling}
      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Bookmark
        className={cn('h-4 w-4', isBookmarked && 'fill-current')}
      />
    </Button>
  )
}
