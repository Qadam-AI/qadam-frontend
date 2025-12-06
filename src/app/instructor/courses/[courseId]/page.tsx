'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft, 
  Loader2, 
  Plus, 
  GripVertical, 
  Pencil, 
  Trash2,
  Video,
  FileText,
  Users,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Lesson {
  id: string
  title: string
  description: string | null
  video_url: string | null
  position: number
  duration_seconds: number | null
  attachments: { name: string; url: string; type: string }[]
}

interface Course {
  id: string
  title: string
  description: string | null
  language: string
  is_published: boolean
  thumbnail_url: string | null
  lesson_count: number
  student_count: number
  lessons: Lesson[]
}

export default function EditCoursePage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const courseId = params.courseId as string

  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Lesson dialog state
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDescription, setLessonDescription] = useState('')
  const [lessonVideoUrl, setLessonVideoUrl] = useState('')

  const { data: course, isLoading } = useQuery({
    queryKey: ['instructor-course', courseId],
    queryFn: async () => {
      const res = await api.get<Course>(`/api/v1/instructor/courses/${courseId}`)
      return res.data
    },
    enabled: !!courseId
  })

  // Set form values when course loads
  useState(() => {
    if (course) {
      setTitle(course.title)
      setDescription(course.description || '')
    }
  })

  const updateCourseMutation = useMutation({
    mutationFn: async (data: { title?: string; description?: string; is_published?: boolean }) => {
      await api.patch(`/api/v1/instructor/courses/${courseId}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-course', courseId] })
      toast.success('Course updated')
      setIsEditing(false)
    },
    onError: () => {
      toast.error('Failed to update course')
    }
  })

  const createLessonMutation = useMutation({
    mutationFn: async () => {
      const position = (course?.lessons.length || 0) + 1
      await api.post(`/api/v1/instructor/courses/${courseId}/lessons`, {
        title: lessonTitle,
        description: lessonDescription || null,
        video_url: lessonVideoUrl || null,
        position,
        attachments: []
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-course', courseId] })
      toast.success('Lesson created')
      closeLessonDialog()
    },
    onError: () => {
      toast.error('Failed to create lesson')
    }
  })

  const updateLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      await api.patch(`/api/v1/instructor/lessons/${lessonId}`, {
        title: lessonTitle,
        description: lessonDescription || null,
        video_url: lessonVideoUrl || null
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-course', courseId] })
      toast.success('Lesson updated')
      closeLessonDialog()
    },
    onError: () => {
      toast.error('Failed to update lesson')
    }
  })

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      await api.delete(`/api/v1/instructor/lessons/${lessonId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-course', courseId] })
      toast.success('Lesson deleted')
    },
    onError: () => {
      toast.error('Failed to delete lesson')
    }
  })

  const openLessonDialog = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson)
      setLessonTitle(lesson.title)
      setLessonDescription(lesson.description || '')
      setLessonVideoUrl(lesson.video_url || '')
    } else {
      setEditingLesson(null)
      setLessonTitle('')
      setLessonDescription('')
      setLessonVideoUrl('')
    }
    setLessonDialogOpen(true)
  }

  const closeLessonDialog = () => {
    setLessonDialogOpen(false)
    setEditingLesson(null)
    setLessonTitle('')
    setLessonDescription('')
    setLessonVideoUrl('')
  }

  const handleSaveLesson = () => {
    if (!lessonTitle.trim()) {
      toast.error('Please enter a lesson title')
      return
    }
    if (editingLesson) {
      updateLessonMutation.mutate(editingLesson.id)
    } else {
      createLessonMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Course not found</p>
        <Link href="/instructor/courses">
          <Button className="mt-4">Back to Courses</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/instructor/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={course.is_published ? "default" : "secondary"}>
                {course.is_published ? 'Published' : 'Draft'}
              </Badge>
              <span className="text-muted-foreground">
                {course.student_count} students enrolled
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/instructor/courses/${courseId}/students`}>
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Students
            </Button>
          </Link>
          <Button
            variant={course.is_published ? "outline" : "default"}
            className="gap-2"
            onClick={() => updateCourseMutation.mutate({ is_published: !course.is_published })}
          >
            {course.is_published ? (
              <>
                <EyeOff className="h-4 w-4" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Course Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>Basic information about your course</CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => {
              setTitle(course.title)
              setDescription(course.description || '')
              setIsEditing(true)
            }}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => updateCourseMutation.mutate({ title, description })}
                  disabled={updateCourseMutation.isPending}
                >
                  {updateCourseMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-muted-foreground">
                {course.description || 'No description'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lessons */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lessons ({course.lessons.length})</CardTitle>
            <CardDescription>Manage your course content</CardDescription>
          </div>
          <Button onClick={() => openLessonDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Lesson
          </Button>
        </CardHeader>
        <CardContent>
          {course.lessons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No lessons yet. Add your first lesson to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {course.lessons
                  .sort((a, b) => a.position - b.position)
                  .map((lesson, i) => (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {lesson.position}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lesson.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {lesson.video_url && (
                            <span className="flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              Video
                            </span>
                          )}
                          {lesson.attachments?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {lesson.attachments.length} files
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openLessonDialog(lesson)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteLessonMutation.mutate(lesson.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
            </DialogTitle>
            <DialogDescription>
              {editingLesson 
                ? 'Update the lesson details below' 
                : 'Fill in the details for your new lesson'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lesson Title *</Label>
              <Input
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="e.g., Introduction to Variables"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder="What will students learn in this lesson?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Video URL</Label>
              <Input
                value={lessonVideoUrl}
                onChange={(e) => setLessonVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
              <p className="text-xs text-muted-foreground">
                YouTube, Vimeo, or direct video URL
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeLessonDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveLesson}
              disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
            >
              {(createLessonMutation.isPending || updateLessonMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingLesson ? 'Update' : 'Create'} Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
