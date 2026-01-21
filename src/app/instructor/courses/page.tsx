'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Users, 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Eye,
  EyeOff,
  UserPlus
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
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
import { useState } from 'react'

interface Course {
  id: string
  title: string
  description: string | null
  language: string
  is_published: boolean
  thumbnail_url: string | null
  lesson_count: number
  student_count: number
  created_at: string
}

export default function InstructorCoursesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: courses, isLoading } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const res = await api.get<Course[]>('/instructor/courses')
      return res.data
    }
  })

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      await api.patch(`/instructor/courses/${id}`, { is_published })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      toast.success('Course updated')
    },
    onError: () => {
      toast.error('Failed to update course')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/instructor/courses/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      toast.success('Course deleted')
      setDeleteId(null)
    },
    onError: () => {
      toast.error('Failed to delete course. It may have active students.')
      setDeleteId(null)
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your courses
          </p>
        </div>
        <Link href="/instructor/courses/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-xl mb-2">No courses yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Start by creating your first course. Add lessons, upload videos, 
              and invite students to learn.
            </p>
            <Link href="/instructor/courses/new">
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Course
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Card 
                className="h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => router.push(`/instructor/courses/${course.id}`)}
              >
                {/* Course Image */}
                <div className="w-full aspect-video bg-muted relative overflow-hidden rounded-t-xl group">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground bg-secondary/30">
                      <BookOpen className="h-10 w-10 opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>

                <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/instructor/courses/${course.id}`}>
                          <DropdownMenuItem>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Course
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/instructor/courses/${course.id}/students`}>
                          <DropdownMenuItem>
                            <Users className="h-4 w-4 mr-2" />
                            View Students
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => togglePublishMutation.mutate({
                            id: course.id,
                            is_published: !course.is_published
                          })}
                        >
                          {course.is_published ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeleteId(course.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end pt-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    <Badge variant="outline">{course.language.toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {course.lesson_count} lessons
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.student_count} students
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course
              and all its lessons. Courses with active students cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
