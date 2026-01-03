'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Bookmark, BookmarkCheck, Search, Trash2, ExternalLink,
  BookOpen, Clock, FolderOpen, X
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface BookmarkedLesson {
  id: string
  lesson_id: string
  lesson_title: string
  course_id: string
  course_title: string
  note?: string
  created_at: string
}

export default function BookmarksPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteBookmark, setDeleteBookmark] = useState<BookmarkedLesson | null>(null)

  // Fetch bookmarks
  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const res = await api.get<BookmarkedLesson[]>('/api/v1/lessons/bookmarks')
      return res.data
    },
  })

  // Delete bookmark mutation
  const deleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      await api.delete(`/api/v1/lessons/${lessonId}/bookmark`)
    },
    onSuccess: () => {
      toast.success('Bookmark removed')
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      setDeleteBookmark(null)
    },
    onError: () => {
      toast.error('Failed to remove bookmark')
    },
  })

  // Filter bookmarks by search
  const filteredBookmarks = bookmarks?.filter(b => 
    b.lesson_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.course_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.note?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group bookmarks by course
  const groupedByCourse = filteredBookmarks?.reduce((acc, bookmark) => {
    if (!acc[bookmark.course_id]) {
      acc[bookmark.course_id] = {
        course_title: bookmark.course_title,
        bookmarks: [],
      }
    }
    acc[bookmark.course_id].bookmarks.push(bookmark)
    return acc
  }, {} as Record<string, { course_title: string; bookmarks: BookmarkedLesson[] }>)

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header - Clean style */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold tracking-tight">Bookmarked Lessons</h1>
        <p className="text-muted-foreground mt-2">
          Quick access to lessons you've saved for later.
        </p>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/30">
                <BookmarkCheck className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{bookmarks?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Bookmarks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Object.keys(groupedByCourse || {}).length}</p>
                <p className="text-sm text-muted-foreground">Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {bookmarks?.length ? formatDistanceToNow(new Date(bookmarks[0].created_at), { addSuffix: true }) : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">Last Added</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookmarks List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({filteredBookmarks?.length || 0})</TabsTrigger>
          <TabsTrigger value="by-course">By Course</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredBookmarks?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No Bookmarks Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start bookmarking lessons to access them quickly later.
                </p>
                <Button asChild>
                  <Link href="/lessons">Browse Lessons</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredBookmarks?.map((bookmark, index) => (
                  <motion.div
                    key={bookmark.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                              <BookOpen className="h-5 w-5 text-rose-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{bookmark.lesson_title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {bookmark.course_title}
                              </p>
                              {bookmark.note && (
                                <p className="text-sm text-muted-foreground mt-1 italic">
                                  "{bookmark.note}"
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
                            </span>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/lessons/${bookmark.lesson_id}`}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setDeleteBookmark(bookmark)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="by-course" className="mt-6 space-y-6">
          {Object.entries(groupedByCourse || {}).map(([courseId, { course_title, bookmarks }]) => (
            <div key={courseId}>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-500" />
                {course_title}
                <Badge variant="secondary">{bookmarks.length}</Badge>
              </h3>
              <div className="space-y-2 ml-7">
                {bookmarks.map((bookmark) => (
                  <Card key={bookmark.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{bookmark.lesson_title}</p>
                          {bookmark.note && (
                            <p className="text-xs text-muted-foreground italic">"{bookmark.note}"</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/lessons/${bookmark.lesson_id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => setDeleteBookmark(bookmark)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBookmark} onOpenChange={() => setDeleteBookmark(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Bookmark?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "{deleteBookmark?.lesson_title}" from your bookmarks?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteBookmark && deleteMutation.mutate(deleteBookmark.lesson_id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
