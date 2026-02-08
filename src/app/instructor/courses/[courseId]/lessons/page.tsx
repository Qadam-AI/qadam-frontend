'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft, 
  Plus, 
  Video, 
  FileText, 
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  X,
  File
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, Reorder } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ModalLayout, ConfirmModal } from '@/design-system/patterns/modal-layout'
import { Stack } from '@/design-system/layout'
import { LabelText, HelperText } from '@/design-system/typography'

interface LessonAttachment {
  name: string
  url: string
  type: string
  size_bytes?: number
}

interface Lesson {
  id: string
  title: string
  description: string | null
  video_url: string | null
  content: string | null
  position: number
  duration_seconds: number | null
  attachments?: LessonAttachment[]
}

interface Course {
  id: string
  title: string
}

export default function CourseLessonsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const courseId = params.courseId as string

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    content: '',
    duration_minutes: 0
  })

  // File upload states
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [materialFiles, setMaterialFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [uploading, setUploading] = useState(false)
  const [uploadedAttachments, setUploadedAttachments] = useState<LessonAttachment[]>([])
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await api.get<Course>(`/instructor/courses/${courseId}`)
      return res.data
    }
  })

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['course-lessons', courseId],
    queryFn: async () => {
      const res = await api.get<Lesson[]>(`/instructor/courses/${courseId}/lessons`)
      return res.data
    }
  })

  // Upload file handler
  const uploadFile = async (file: File): Promise<{ url: string; name: string; type: string; size_bytes: number } | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await api.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for large files
      })
      
      return {
        url: res.data.file_key,
        name: file.name,
        type: file.type,
        size_bytes: file.size
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('File uploads require Pro+ plan')
      } else {
        toast.error(`Failed to upload ${file.name}`)
      }
      console.error('Upload error:', error)
      return null
    }
  }

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      setUploading(true)
      try {
        let finalVideoUrl = data.video_url
        const attachments: LessonAttachment[] = []

        // Upload video file if present
        if (videoFile) {
          const uploaded = await uploadFile(videoFile)
          if (uploaded) {
            finalVideoUrl = uploaded.url
            attachments.push(uploaded as LessonAttachment)
          }
        }

        // Upload material files
        for (const file of materialFiles) {
          const uploaded = await uploadFile(file)
          if (uploaded) {
            attachments.push(uploaded as LessonAttachment)
          }
        }

        const res = await api.post(`/instructor/courses/${courseId}/lessons`, {
          title: data.title,
          description: data.description || undefined,
          video_url: finalVideoUrl || undefined,
          content: data.content || undefined,
          position: (lessons?.length || 0) + 1,
          duration_seconds: data.duration_minutes ? data.duration_minutes * 60 : undefined,
          attachments
        })
        return res.data
      } finally {
        setUploading(false)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] })
      toast.success('Lesson created!')
      resetForm()
    },
    onError: () => {
      toast.error('Failed to create lesson')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      setUploading(true)
      try {
        let finalVideoUrl = data.video_url
        const attachments: LessonAttachment[] = [...uploadedAttachments]

        // Upload video file if present
        if (videoFile) {
          const uploaded = await uploadFile(videoFile)
          if (uploaded) {
            finalVideoUrl = uploaded.url
            attachments.push(uploaded as LessonAttachment)
          }
        }

        // Upload material files
        for (const file of materialFiles) {
          const uploaded = await uploadFile(file)
          if (uploaded) {
            attachments.push(uploaded as LessonAttachment)
          }
        }

        const res = await api.patch(`/instructor/lessons/${id}`, {
          title: data.title,
          description: data.description || undefined,
          video_url: finalVideoUrl || undefined,
          content: data.content || undefined,
          duration_seconds: data.duration_minutes ? data.duration_minutes * 60 : undefined,
          attachments
        })
        return res.data
      } finally {
        setUploading(false)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] })
      toast.success('Lesson updated!')
      resetForm()
    },
    onError: () => {
      toast.error('Failed to update lesson')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/instructor/lessons/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] })
      toast.success('Lesson deleted')
      setDeleteDialogOpen(false)
      setLessonToDelete(null)
    },
    onError: () => {
      toast.error('Failed to delete lesson')
    }
  })

  const reorderMutation = useMutation({
    mutationFn: async (lessonIds: string[]) => {
      await api.post(`/instructor/courses/${courseId}/lessons/reorder`, {
        lesson_ids: lessonIds
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] })
    }
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      content: '',
      duration_minutes: 0
    })
    setVideoFile(null)
    setMaterialFiles([])
    setUploadedAttachments([])
    setUploadedVideoUrl(null)
    setUploadProgress({})
    setEditingLesson(null)
    setDialogOpen(false)
  }

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      video_url: lesson.video_url || '',
      content: lesson.content || '',
      duration_minutes: lesson.duration_seconds ? Math.round(lesson.duration_seconds / 60) : 0
    })
    setUploadedAttachments(lesson.attachments || [])
    setUploadedVideoUrl(lesson.video_url || null)
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (editingLesson) {
      updateMutation.mutate({ id: editingLesson.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleReorder = (newOrder: Lesson[]) => {
    // Optimistic update handled by Reorder
    reorderMutation.mutate(newOrder.map(l => l.id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/instructor/courses/${courseId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lessons</h1>
            <p className="text-muted-foreground mt-1">
              {course?.title || 'Loading...'}
            </p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Lesson
        </Button>
      </div>

      {/* Lessons List */}
      <Card>
        <CardHeader>
          <CardTitle>Course Content</CardTitle>
          <CardDescription>
            Drag lessons to reorder them
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !lessons?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No lessons yet</p>
              <p className="text-sm">Add your first lesson to get started</p>
            </div>
          ) : (
            <Reorder.Group 
              axis="y" 
              values={lessons} 
              onReorder={handleReorder}
              className="space-y-2"
            >
              {lessons.map((lesson, index) => (
                <Reorder.Item
                  key={lesson.id}
                  value={lesson}
                  className="list-none"
                >
                  <motion.div
                    layout
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm flex-shrink-0">
                      {index + 1}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {lesson.video_url ? (
                        <Video className="h-4 w-4 text-blue-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-amber-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{lesson.title}</h3>
                      {lesson.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {lesson.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {lesson.duration_seconds && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(lesson.duration_seconds / 60)} min
                        </Badge>
                      )}
                      {lesson.attachments && lesson.attachments.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <File className="h-3 w-3 mr-1" />
                          {lesson.attachments.length}
                        </Badge>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(lesson)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            setLessonToDelete(lesson)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <ModalLayout
        open={dialogOpen}
        onClose={resetForm}
        title={editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
        description={editingLesson ? 'Update the lesson details below' : 'Create a new lesson for this course'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={resetForm} disabled={uploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.title || createMutation.isPending || updateMutation.isPending || uploading}
              className="gap-2"
            >
              {(createMutation.isPending || updateMutation.isPending || uploading) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {uploading ? 'Uploading...' : editingLesson ? 'Update Lesson' : 'Create Lesson'}
            </Button>
          </>
        }
      >
        <Stack gap="md">
          {/* Title */}
          <div className="space-y-2">
            <LabelText required>Lesson Title</LabelText>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Introduction to Variables"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <LabelText>Description</LabelText>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What will students learn in this lesson?"
              rows={2}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <LabelText>Content</LabelText>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Lesson text content (supports Markdown)..."
              rows={4}
              className="font-mono text-sm"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <LabelText>Duration (minutes)</LabelText>
            <Input
              type="number"
              min="0"
              value={formData.duration_minutes || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                duration_minutes: parseInt(e.target.value) || 0 
              })}
              placeholder="10"
            />
          </div>

          {/* Video upload */}
          <div className="space-y-2">
            <LabelText>Video (Optional)</LabelText>
            {!videoFile && !uploadedVideoUrl ? (
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (file.size > 50 * 1024 * 1024) {
                        toast.error('Video must be under 50 MB')
                        return
                      }
                      setVideoFile(file)
                    }
                  }}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <Video className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload video</p>
                  <p className="text-xs text-muted-foreground">MP4, WebM — max 50 MB</p>
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                <Video className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {videoFile?.name || 'Uploaded video'}
                  </p>
                  {videoFile && (
                    <p className="text-xs text-muted-foreground">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setVideoFile(null)
                    setUploadedVideoUrl(null)
                    setFormData({ ...formData, video_url: '' })
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Materials upload */}
          <div className="space-y-2">
            <LabelText>Materials (Optional)</LabelText>
            <HelperText>PDFs, presentations, images, or other course materials</HelperText>
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
              <Input
                type="file"
                multiple
                accept=".pdf,.pptx,.ppt,.doc,.docx,image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  const validFiles = files.filter(file => {
                    if (file.size > 50 * 1024 * 1024) {
                      toast.error(`${file.name} exceeds 50 MB limit`)
                      return false
                    }
                    return true
                  })
                  setMaterialFiles(prev => [...prev, ...validFiles])
                  e.target.value = ''
                }}
                className="hidden"
                id="materials-upload"
              />
              <label htmlFor="materials-upload" className="cursor-pointer">
                <File className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload materials</p>
              </label>
            </div>

            {/* Existing attachments (when editing) */}
            {uploadedAttachments.length > 0 && (
              <div className="space-y-2 mt-2">
                {uploadedAttachments.map((attachment, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                    <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{attachment.name}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setUploadedAttachments(prev => prev.filter((_, i) => i !== idx))
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* New material files */}
            {materialFiles.length > 0 && (
              <div className="space-y-2 mt-2">
                {materialFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                    <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setMaterialFiles(prev => prev.filter((_, i) => i !== idx))
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Stack>
      </ModalLayout>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => lessonToDelete && deleteMutation.mutate(lessonToDelete.id)}
        title="Delete Lesson"
        description={`Are you sure you want to delete "${lessonToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
