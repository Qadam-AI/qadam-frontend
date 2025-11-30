'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { TableSkeleton } from '@/app/_components/skeletons'
import { Plus, Pencil, Trash2, Upload, Video, X, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Lesson {
  id: string
  title: string
  description: string | null
  video_url: string | null
  course_id: string
  order_num: number
  concept_ids: string[]
}

interface Course {
  id: string
  title: string
}

interface VideoUploadResponse {
  object_name: string  // Storage path to save in DB
  video_url: string    // Presigned URL for preview
  size_bytes: number
  content_type: string
}

export default function LessonsManagement() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  
  // Video upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)  // For preview
  const [uploadedObjectName, setUploadedObjectName] = useState<string | null>(null)  // For DB storage
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',  // This stores the object_name (path), not the presigned URL
    course_id: '',
    order_num: 0,
  })

  const { data: lessons, isLoading } = useQuery<Lesson[]>({
    queryKey: ['admin-lessons'],
    queryFn: async () => {
      const response = await api.get('/admin/lessons')
      return response.data
    },
  })

  const { data: courses } = useQuery<Course[]>({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const response = await api.get('/admin/courses')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await api.post('/admin/lessons', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] })
      setIsCreateOpen(false)
      setFormData({ title: '', description: '', video_url: '', course_id: '', order_num: 0 })
      toast.success('Lesson created successfully')
    },
    onError: () => {
      toast.error('Failed to create lesson')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lesson> }) => {
      await api.patch(`/admin/lessons/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] })
      setIsEditOpen(false)
      setSelectedLesson(null)
      toast.success('Lesson updated successfully')
    },
    onError: () => {
      toast.error('Failed to update lesson')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/lessons/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] })
      setIsDeleteOpen(false)
      setSelectedLesson(null)
      toast.success('Lesson deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete lesson')
    },
  })

  const handleCreate = () => {
    if (!formData.title || !formData.course_id) {
      toast.error('Please fill all required fields')
      return
    }
    createMutation.mutate({
      ...formData,
      video_url: uploadedObjectName || formData.video_url,  // Use object_name for storage
    })
  }

  const handleEdit = () => {
    if (!selectedLesson) return
    updateMutation.mutate({
      id: selectedLesson.id,
      data: {
        title: formData.title || undefined,
        description: formData.description || undefined,
        video_url: uploadedObjectName || formData.video_url || undefined,  // Use object_name
        course_id: formData.course_id || undefined,
        order_num: formData.order_num,
      },
    })
  }

  const handleVideoUpload = async (file: File) => {
    if (!file) return

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload MP4, WebM, OGG, or MOV files.')
      return
    }

    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 500MB.')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const formDataUpload = new FormData()
    formDataUpload.append('file', file)
    if (selectedLesson?.id) {
      formDataUpload.append('lesson_id', selectedLesson.id)
    }

    try {
      // Simulated progress (actual progress would require XMLHttpRequest or axios progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await api.post<VideoUploadResponse>('/admin/videos/upload', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Store object_name for DB, video_url for preview
      setUploadedObjectName(response.data.object_name)
      setUploadedVideoUrl(response.data.video_url)
      setFormData((prev) => ({ ...prev, video_url: response.data.object_name }))
      toast.success('Video uploaded successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload video')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleVideoUpload(file)
    }
  }

  const clearUploadedVideo = () => {
    setUploadedVideoUrl(null)
    setUploadedObjectName(null)
    setFormData((prev) => ({ ...prev, video_url: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = () => {
    if (!selectedLesson) return
    deleteMutation.mutate(selectedLesson.id)
  }

  const openEditDialog = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      video_url: lesson.video_url || '',
      course_id: lesson.course_id,
      order_num: lesson.order_num,
    })
    // When editing, the lesson.video_url is already the presigned URL from the API
    setUploadedVideoUrl(lesson.video_url || null)
    setUploadedObjectName(null)  // Reset - will use formData.video_url if no new upload
    setIsEditOpen(true)
  }

  const openDeleteDialog = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setIsDeleteOpen(true)
  }

  const openCreateDialog = () => {
    setFormData({ title: '', description: '', video_url: '', course_id: '', order_num: 0 })
    setUploadedVideoUrl(null)
    setUploadedObjectName(null)
    setIsCreateOpen(true)
  }

  if (isLoading) {
    return <TableSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Lessons</h1>
          <p className="text-muted-foreground mt-2">Manage lessons, videos, and content</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Lesson
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Lessons ({lessons?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Video</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons?.map((lesson) => {
                const course = courses?.find((c) => c.id === lesson.course_id)
                return (
                  <TableRow key={lesson.id}>
                    <TableCell className="font-medium">{lesson.title}</TableCell>
                    <TableCell>{course?.title || '-'}</TableCell>
                    <TableCell>
                      {lesson.video_url ? (
                        <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                          View
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{lesson.order_num}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(lesson)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(lesson)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { setIsCreateOpen(open); setIsEditOpen(open); if (!open) { setUploadedVideoUrl(null); setUploadedObjectName(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Lesson' : 'Create New Lesson'}</DialogTitle>
            <DialogDescription>{isEditOpen ? 'Update lesson information' : 'Add a new lesson to the system'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            {/* Video Upload Section */}
            <div className="space-y-3">
              <Label>Video</Label>
              
              {/* Uploaded Video Preview */}
              {(uploadedVideoUrl || formData.video_url) && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Video className="h-5 w-5 text-primary" />
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium">Video attached</p>
                    <a 
                      href={uploadedVideoUrl || formData.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:underline truncate block"
                    >
                      {uploadedVideoUrl || formData.video_url}
                    </a>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearUploadedVideo}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
                </div>
              )}
              
              {/* Upload Button */}
              {!uploadedVideoUrl && !formData.video_url && !isUploading && (
                <div className="flex flex-col gap-3">
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click to upload video</p>
                    <p className="text-xs text-muted-foreground mt-1">MP4, WebM, OGG, MOV up to 500MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or enter URL</span>
                    </div>
                  </div>
                  
                  <Input
                    placeholder="https://example.com/video.mp4"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  />
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="course">Course *</Label>
              <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="order_num">Order Number</Label>
              <Input
                id="order_num"
                type="number"
                value={formData.order_num}
                onChange={(e) => setFormData({ ...formData, order_num: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={isEditOpen ? handleEdit : handleCreate} disabled={createMutation.isPending || updateMutation.isPending || isUploading}>
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lesson</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedLesson?.title}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

