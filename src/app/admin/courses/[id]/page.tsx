'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  BookOpen,
  Clock,
  FileText,
  GraduationCap,
  GripVertical,
  Link as LinkIcon,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Trash2,
  Upload,
  UserPlus,
  Users,
  Video,
  X,
  Eye,
  EyeOff,
  Loader2,
  File,
} from 'lucide-react'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'

interface Course {
  id: string
  title: string
  description: string | null
  instructor_id: string | null
  instructor_name: string | null
  is_published: boolean
  lesson_count: number
}

interface Lesson {
  id: string
  title: string
  description: string | null
  content: string | null
  video_url: string | null
  course_id: string
  order_num: number
  duration_seconds: number | null
  attachments: Array<{ name: string; url: string; type: string }>
  resources: Array<{ title: string; url: string; type: string }>
  concept_ids: string[]
}

interface Student {
  user_id: string
  name: string
  email: string
  status: string
  enrolled_at: string
  progress_percent: number
  lessons_completed: number
  total_lessons: number
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

const emptyLessonForm = {
  title: '',
  description: '',
  content: '',
  video_url: '',
  order_num: 0,
  duration_seconds: 0,
  resources: [] as Array<{ title: string; url: string; type: string }>,
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const courseId = params.id as string

  // Dialog states
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false)
  const [isEnrollOpen, setIsEnrollOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  // Form states
  const [lessonForm, setLessonForm] = useState(emptyLessonForm)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [newResource, setNewResource] = useState({ title: '', url: '', type: 'link' })

  // Upload states
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [videoUploadProgress, setVideoUploadProgress] = useState(0)
  const [isUploadingResource, setIsUploadingResource] = useState(false)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const resourceInputRef = useRef<HTMLInputElement>(null)

  // Fetch course
  const { data: courses } = useQuery<Course[]>({
    queryKey: ['admin-courses'],
    queryFn: async () => (await api.get('/admin/courses')).data,
  })
  const course = courses?.find((c) => c.id === courseId)

  // Fetch lessons for this course
  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ['course-lessons', courseId],
    queryFn: async () => (await api.get(`/admin/courses/${courseId}/lessons`)).data,
    enabled: !!courseId,
  })

  // Fetch students
  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['course-students', courseId],
    queryFn: async () => (await api.get(`/enrollments/course/${courseId}/students`)).data,
    enabled: !!courseId,
  })

  // Fetch all learners for enrollment
  const { data: allUsers } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users')
      return res.data.filter((u: User) => u.role === 'learner')
    },
  })

  // Mutations
  const createLessonMutation = useMutation({
    mutationFn: async (data: typeof lessonForm) => {
      await api.post('/admin/lessons', { ...data, course_id: courseId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] })
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
      setIsLessonDialogOpen(false)
      setLessonForm(emptyLessonForm)
      toast.success('Lesson created successfully')
    },
    onError: () => toast.error('Failed to create lesson'),
  })

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof lessonForm }) => {
      await api.patch(`/admin/lessons/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] })
      setIsLessonDialogOpen(false)
      setEditingLesson(null)
      setLessonForm(emptyLessonForm)
      toast.success('Lesson updated successfully')
    },
    onError: () => toast.error('Failed to update lesson'),
  })

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/lessons/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] })
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
      toast.success('Lesson deleted')
    },
    onError: () => toast.error('Failed to delete lesson'),
  })

  const enrollMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/enrollments/course/${courseId}/enroll/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-students', courseId] })
      setIsEnrollOpen(false)
      setSelectedUserId('')
      toast.success('Student enrolled')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to enroll'),
  })

  const removeStudentMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/enrollments/course/${courseId}/student/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-students', courseId] })
      toast.success('Student removed')
    },
  })

  // Handlers
  const openCreateLesson = () => {
    setEditingLesson(null)
    setLessonForm({
      ...emptyLessonForm,
      order_num: (lessons?.length || 0) + 1,
    })
    setIsLessonDialogOpen(true)
  }

  const openEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      order_num: lesson.order_num,
      duration_seconds: lesson.duration_seconds || 0,
      resources: lesson.resources || [],
    })
    setIsLessonDialogOpen(true)
  }

  const handleSaveLesson = () => {
    if (!lessonForm.title) {
      toast.error('Title is required')
      return
    }
    if (editingLesson) {
      updateLessonMutation.mutate({ id: editingLesson.id, data: lessonForm })
    } else {
      createLessonMutation.mutate(lessonForm)
    }
  }

  const addResource = () => {
    if (!newResource.title || !newResource.url) return
    setLessonForm({
      ...lessonForm,
      resources: [...lessonForm.resources, { ...newResource }],
    })
    setNewResource({ title: '', url: '', type: 'link' })
  }

  const removeResource = (index: number) => {
    setLessonForm({
      ...lessonForm,
      resources: lessonForm.resources.filter((_, i) => i !== index),
    })
  }

  // Video upload handler
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file')
      return
    }

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast.error('Video file must be less than 500MB')
      return
    }

    setIsUploadingVideo(true)
    setVideoUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/admin/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setVideoUploadProgress(progress)
        },
      })

      // Use the returned URL
      const videoUrl = response.data.url || response.data.object_name
      setLessonForm({ ...lessonForm, video_url: videoUrl })
      toast.success('Video uploaded successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload video')
    } finally {
      setIsUploadingVideo(false)
      setVideoUploadProgress(0)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  // Resource file upload handler
  const handleResourceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File must be less than 50MB')
      return
    }

    setIsUploadingResource(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/admin/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Determine file type from extension
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      let fileType = 'file'
      if (['pdf'].includes(ext)) fileType = 'pdf'
      else if (['doc', 'docx'].includes(ext)) fileType = 'doc'
      else if (['mp4', 'webm', 'mov'].includes(ext)) fileType = 'video'
      else if (['zip', 'rar', '7z'].includes(ext)) fileType = 'archive'

      const resourceUrl = response.data.url || response.data.object_name
      setLessonForm({
        ...lessonForm,
        resources: [...lessonForm.resources, { title: file.name, url: resourceUrl, type: fileType }],
      })
      toast.success('File uploaded successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload file')
    } finally {
      setIsUploadingResource(false)
      if (resourceInputRef.current) resourceInputRef.current.value = ''
    }
  }

  const availableUsers = allUsers?.filter((u) => !students?.some((s) => s.user_id === u.id))

  if (!course) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/courses')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <Badge variant={course.is_published ? 'default' : 'secondary'}>
              {course.is_published ? <><Eye className="h-3 w-3 mr-1" />Published</> : <><EyeOff className="h-3 w-3 mr-1" />Draft</>}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{course.description || 'No description'}</p>
          {course.instructor_name && (
            <p className="text-sm text-muted-foreground mt-1">Instructor: {course.instructor_name}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lessons?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              Total Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((lessons?.reduce((acc, l) => acc + (l.duration_seconds || 0), 0) || 0) / 60)} min
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lessons" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lessons">
            <BookOpen className="h-4 w-4 mr-2" />
            Lessons
          </TabsTrigger>
          <TabsTrigger value="students">
            <GraduationCap className="h-4 w-4 mr-2" />
            Students
          </TabsTrigger>
        </TabsList>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Course Lessons</h2>
            <Button onClick={openCreateLesson}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lesson
            </Button>
          </div>

          {lessonsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : lessons?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No lessons yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start building your course by adding the first lesson
                </p>
                <Button onClick={openCreateLesson}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Lesson
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {lessons?.map((lesson, index) => (
                <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-lg">{lesson.title}</h3>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditLesson(lesson)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteLessonMutation.mutate(lesson.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          {lesson.video_url && (
                            <span className="flex items-center gap-1">
                              <Video className="h-4 w-4" />
                              Video
                            </span>
                          )}
                          {lesson.content && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              Content
                            </span>
                          )}
                          {lesson.resources?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <LinkIcon className="h-4 w-4" />
                              {lesson.resources.length} resources
                            </span>
                          )}
                          {lesson.duration_seconds && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {Math.round(lesson.duration_seconds / 60)} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Enrolled Students</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEnrollOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Enroll
              </Button>
            </div>
          </div>

          {studentsLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : students?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No students yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Enroll students to this course
                </p>
                <Button onClick={() => setIsEnrollOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enroll Students
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {students?.map((student) => (
                <Card key={student.user_id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{student.lessons_completed}/{student.total_lessons} lessons</div>
                        <div className="w-20 bg-secondary rounded-full h-1.5 mt-1">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${student.progress_percent}%` }} />
                        </div>
                      </div>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {student.status}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => removeStudentMutation.mutate(student.user_id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</DialogTitle>
            <DialogDescription>
              {editingLesson ? 'Update lesson content and settings' : 'Add a new lesson to this course'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="title">Lesson Title *</Label>
                <Input
                  id="title"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="e.g., Introduction to Variables"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={lessonForm.order_num}
                  onChange={(e) => setLessonForm({ ...lessonForm, order_num: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={Math.round(lessonForm.duration_seconds / 60)}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration_seconds: (parseInt(e.target.value) || 0) * 60 })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Short Description</Label>
              <Textarea
                id="description"
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                placeholder="Brief summary of what students will learn..."
                rows={2}
                className="mt-1"
              />
            </div>

            <Separator />

            {/* Video */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video
              </Label>
              
              {/* Video upload only */}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
              
              {/* Current video or upload button */}
              {lessonForm.video_url && !isUploadingVideo ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Video className="h-5 w-5 text-green-500" />
                  <span className="text-sm truncate flex-1">{lessonForm.video_url.split('/').pop() || 'Uploaded video'}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    Replace
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLessonForm({ ...lessonForm, video_url: '' })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isUploadingVideo}
                  className="w-full h-24 border-dashed flex-col gap-2"
                >
                  {isUploadingVideo ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Uploading... {videoUploadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6" />
                      <span>Click to upload video</span>
                    </>
                  )}
                </Button>
              )}
              
              {/* Upload progress */}
              {isUploadingVideo && (
                <Progress value={videoUploadProgress} className="h-2" />
              )}

              <p className="text-xs text-muted-foreground">
                Upload video file (MP4, WebM, MOV - max 500MB)
              </p>
            </div>

            <Separator />

            {/* Content */}
            <div>
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Lesson Content (Markdown)
              </Label>
              <Textarea
                value={lessonForm.content}
                onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                placeholder="# Lesson Content&#10;&#10;Write your lesson content here using Markdown...&#10;&#10;## Key Points&#10;- Point 1&#10;- Point 2&#10;&#10;```python&#10;# Code examples&#10;print('Hello')&#10;```"
                rows={10}
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supports Markdown formatting, code blocks, lists, headers, etc.
              </p>
            </div>

            <Separator />

            {/* Resources */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <LinkIcon className="h-4 w-4" />
                Additional Resources
              </Label>

              {lessonForm.resources.length > 0 && (
                <div className="space-y-2 mb-4">
                  {lessonForm.resources.map((res, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <Badge variant="outline">{res.type}</Badge>
                      <span className="font-medium flex-1 truncate">{res.title}</span>
                      <a href={res.url} target="_blank" className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {res.url}
                      </a>
                      <Button variant="ghost" size="icon" onClick={() => removeResource(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload file button */}
              <div className="mb-3">
                <input
                  ref={resourceInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.mp4,.webm,.mov"
                  onChange={handleResourceUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resourceInputRef.current?.click()}
                  disabled={isUploadingResource}
                  className="w-full border-dashed"
                >
                  {isUploadingResource ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading file...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File (PDF, DOC, Video, etc.)
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 border-t" />
                <span className="text-xs text-muted-foreground">or add link</span>
                <div className="flex-1 border-t" />
              </div>

              {/* Manual link input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Resource title"
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  className="flex-1"
                />
                <Input
                  placeholder="URL"
                  value={newResource.url}
                  onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                  className="flex-1"
                />
                <Select value={newResource.type} onValueChange={(v) => setNewResource({ ...newResource, type: v })}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="doc">Doc</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={addResource}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveLesson}
              disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
            >
              {(createLessonMutation.isPending || updateLessonMutation.isPending) ? 'Saving...' : 'Save Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll Student</DialogTitle>
            <DialogDescription>Select an existing user to enroll</DialogDescription>
          </DialogHeader>
          <div>
            <Label>Select Student</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a student..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollOpen(false)}>Cancel</Button>
            <Button onClick={() => enrollMutation.mutate(selectedUserId)} disabled={enrollMutation.isPending || !selectedUserId}>
              {enrollMutation.isPending ? 'Enrolling...' : 'Enroll'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
