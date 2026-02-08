'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Plus,
  Video,
  Users,
  Mail,
  MoreVertical,
  Edit2,
  Trash2,
  GripVertical,
  Loader2,
  CheckCircle2,
  Clock,
  X,
  BarChart3,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  AlertTriangle,
  GitBranch,
  Upload,
  ImageIcon,
  UserPlus,
  Copy,
  AlertCircle,
  File
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Design System
import { PageShell, PageHeader, Section, Grid, Stack } from '@/design-system/layout'
import { MetricCard, SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { EmptyState, LoadingState } from '@/design-system/feedback'
import { ModalLayout } from '@/design-system/patterns/modal-layout'
import { LabelText, HelperText } from '@/design-system/typography'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

interface Course {
  id: string
  title: string
  description?: string
  language: string
  is_published: boolean
  student_count: number
  lesson_count: number
  cover_image_url?: string | null
}

interface Lesson {
  id: string
  title: string
  description?: string
  video_url?: string
  position: number
  duration_seconds?: number
}

interface StudentProgress {
  user_id: string
  user_name?: string
  user_email: string
  progress_percent: number
  lessons_completed: number
  total_lessons: number
  last_activity?: string
}

type ViewMode = 'lessons' | 'students' | 'overview' | 'settings'

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const courseId = params.courseId as string
  
  const [viewMode, setViewMode] = useState<ViewMode>('lessons')
  const [addLessonOpen, setAddLessonOpen] = useState(false)
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [editLessonId, setEditLessonId] = useState<string | null>(null)
  
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDescription, setLessonDescription] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonVideoFile, setLessonVideoFile] = useState<globalThis.File | null>(null)
  const [lessonMaterialFiles, setLessonMaterialFiles] = useState<globalThis.File[]>([])
  const [lessonUploading, setLessonUploading] = useState(false)
  
  // Student creation form
  const [studentFirstName, setStudentFirstName] = useState('')
  const [studentLastName, setStudentLastName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [studentPhone, setStudentPhone] = useState('')
  const [createdCredentials, setCreatedCredentials] = useState<{username: string, password: string} | null>(null)
  
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDescription, setCourseDescription] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  // Fetch course details
  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['instructor-course', courseId],
    queryFn: async () => {
      const res = await api.get<Course>(`/instructor/courses/${courseId}`)
      setCourseTitle(res.data.title)
      setCourseDescription(res.data.description || '')
      setIsPublished(res.data.is_published)
      setCoverImageUrl(res.data.cover_image_url || '')
      return res.data
    }
  })

  // Fetch lessons
  const { data: lessons, isLoading: loadingLessons } = useQuery({
    queryKey: ['course-lessons', courseId],
    queryFn: async () => {
      const res = await api.get<Lesson[]>(`/instructor/courses/${courseId}/lessons`)
      return res.data
    }
  })

  // Fetch students
  const { data: students } = useQuery({
    queryKey: ['course-students', courseId],
    queryFn: async () => {
      const res = await api.get<StudentProgress[]>(`/instructor/courses/${courseId}/students`)
      return res.data
    }
  })

  // Upload helper
  const uploadLessonFile = async (file: globalThis.File) => {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
      return { url: res.data.file_key, name: file.name, type: file.type, size_bytes: file.size }
    } catch {
      toast.error(`Failed to upload ${file.name}`)
      return null
    }
  }

  // Add lesson mutation
  const addLessonMutation = useMutation({
    mutationFn: async () => {
      setLessonUploading(true)
      try {
        let videoUrl: string | undefined
        const attachments: { url: string; name: string; type: string; size_bytes: number }[] = []

        if (lessonVideoFile) {
          const uploaded = await uploadLessonFile(lessonVideoFile)
          if (uploaded) {
            videoUrl = uploaded.url
            attachments.push(uploaded)
          }
        }

        for (const file of lessonMaterialFiles) {
          const uploaded = await uploadLessonFile(file)
          if (uploaded) attachments.push(uploaded)
        }

        const res = await api.post(`/instructor/courses/${courseId}/lessons`, {
          title: lessonTitle,
          description: lessonDescription || undefined,
          video_url: videoUrl,
          content: lessonContent || undefined,
          position: (lessons?.length || 0) + 1,
          attachments,
        })
        return res.data
      } finally {
        setLessonUploading(false)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] })
      toast.success('Lesson added!')
      setAddLessonOpen(false)
      setLessonTitle('')
      setLessonDescription('')
      setLessonContent('')
      setLessonVideoFile(null)
      setLessonMaterialFiles([])
    },
    onError: () => {
      toast.error('Failed to add lesson')
    }
  })

  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      await api.delete(`/instructor/lessons/${lessonId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] })
      toast.success('Lesson deleted')
    },
    onError: () => {
      toast.error('Failed to delete lesson')
    }
  })

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/instructor/courses/${courseId}`, {
        title: courseTitle,
        description: courseDescription,
        is_published: isPublished,
        cover_image_url: coverImageUrl || undefined
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-course', courseId] })
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      toast.success('Course updated')
    },
    onError: () => {
      toast.error('Failed to update course')
    }
  })

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/instructor/courses/${courseId}`)
    },
    onSuccess: () => {
      toast.success('Course deleted successfully')
      router.push('/instructor/courses')
    },
    onError: () => {
      toast.error('Failed to delete course')
    }
  })

  // Remove student from course mutation
  const removeStudentMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/instructor/courses/${courseId}/students/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-students', courseId] })
      queryClient.invalidateQueries({ queryKey: ['instructor-course', courseId] })
      toast.success('Student removed from course')
    },
    onError: () => {
      toast.error('Failed to remove student')
    }
  })

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/instructor/students', {
        firstName: studentFirstName,
        lastName: studentLastName,
        courseId: courseId,
        email: studentEmail || undefined,
        phoneNumber: studentPhone || undefined,
      })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-students', courseId] })
      queryClient.invalidateQueries({ queryKey: ['instructor-course', courseId] })
      setCreatedCredentials({
        username: data.username,
        password: data.password,
      })
      toast.success('Student created successfully!')
      // Reset form
      setStudentFirstName('')
      setStudentLastName('')
      setStudentEmail('')
      setStudentPhone('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create student')
    }
  })

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, WebP, or GIF)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to server
    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await api.post(`/instructor/courses/${courseId}/upload-cover`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setCoverImageUrl(res.data.cover_image_url)
      toast.success('Cover image uploaded successfully')
      queryClient.invalidateQueries({ queryKey: ['instructor-course', courseId] })
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload cover image')
      setCoverPreview(null)
    } finally {
      setUploadingCover(false)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  return (
    <PageShell maxWidth="2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/instructor/courses">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          {loadingCourse ? (
            <div className="space-y-2">
              <div className="h-8 w-64 bg-muted rounded animate-pulse" />
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight">{course?.title}</h1>
              <p className="text-muted-foreground mt-1">
                {course?.description || 'No description'}
              </p>
            </>
          )}
        </div>
        
        {/* Primary Action: Concept Map */}
        <Link href={`/instructor/courses/${courseId}/concept-map`}>
          <Button size="lg" className="gap-2">
            <GitBranch className="h-5 w-5" />
            View Concept Map
          </Button>
        </Link>
      </div>

      {/* KPI Metrics */}
      <Section>
        <Grid cols={4} gap="md">
          <MetricCard
            label="Lessons"
            value={lessons?.length || 0}
            icon={Video}
            variant="info"
          />
          <MetricCard
            label="Students"
            value={course?.student_count || 0}
            icon={Users}
            variant="success"
          />
          <MetricCard
            label="Avg Progress"
            value={`${Math.round((students?.reduce((sum, s) => sum + s.progress_percent, 0) || 0) / (students?.length || 1))}%`}
            icon={BarChart3}
            variant="default"
          />
          <MetricCard
            label="Completed"
            value={students?.filter(s => s.progress_percent === 100).length || 0}
            icon={CheckCircle2}
            variant="success"
          />
        </Grid>
      </Section>

      {/* Segmented Navigation */}
      <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg w-fit">
        <Button
          variant={viewMode === 'lessons' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('lessons')}
          className="gap-2"
        >
          <Video className="h-4 w-4" />
          Lessons ({lessons?.length || 0})
        </Button>
        <Button
          variant={viewMode === 'students' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('students')}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          Students ({course?.student_count || 0})
        </Button>
        <Button
          variant={viewMode === 'settings' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('settings')}
          className="gap-2"
        >
          <SettingsIcon className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Lessons View */}
      {viewMode === 'lessons' && (
        <Section
          title="Course Lessons"
          description="Organize and manage your lesson content"
          action={
            <Button onClick={() => setAddLessonOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Lesson
            </Button>
          }
        >
          {loadingLessons ? (
            <LoadingState message="Loading lessons..." />
          ) : lessons?.length === 0 ? (
            <SurfaceCard variant="muted" className="py-12">
              <EmptyState
                icon={Video}
                title="No lessons yet"
                description="Start building your course by adding your first lesson"
                action={{
                  label: 'Add First Lesson',
                  onClick: () => setAddLessonOpen(true)
                }}
              />
            </SurfaceCard>
          ) : (
            <Stack gap="md">
              {lessons?.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <SurfaceCard className="group hover:shadow-md hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary cursor-grab">
                        <GripVertical className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {lesson.position}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{lesson.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {lesson.video_url ? <Video className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                            {lesson.video_url ? 'Video' : 'Content'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDuration(lesson.duration_seconds)}
                          </span>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 text-destructive"
                            onClick={() => {
                              if (confirm('Delete this lesson?')) {
                                deleteLessonMutation.mutate(lesson.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </SurfaceCard>
                </motion.div>
              ))}
            </Stack>
          )}
        </Section>
      )}

      {/* Students View */}
      {viewMode === 'students' && (
        <Section
          title="Enrolled Students"
          description="Manage student enrollments and track progress"
          action={
            <Button onClick={() => setAddStudentOpen(true)} variant="outline" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Student
            </Button>
          }
        >
          {students?.length === 0 ? (
            <SurfaceCard variant="muted" className="py-12">
              <EmptyState
                icon={Users}
                title="No students yet"
                description="Students will appear here once they enroll in the course"
              />
            </SurfaceCard>
          ) : (
            <Stack gap="md">
              {students?.map((student, index) => (
                <motion.div
                  key={student.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <SurfaceCard 
                    className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                    onClick={() => router.push(`/instructor/students/${student.user_id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold uppercase shrink-0">
                        {(student.user_name || student.user_email)[0]}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {student.user_name || 'Unknown'}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {student.user_email}
                        </p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="font-semibold">{Math.round(student.progress_percent)}%</p>
                        <p className="text-xs text-muted-foreground">
                          {student.lessons_completed}/{student.total_lessons} lessons
                        </p>
                      </div>
                      
                      <div className="w-24 shrink-0">
                        <Progress value={student.progress_percent} className="h-2" />
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/instructor/students/${student.user_id}`)
                            }}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm(`Remove ${student.user_name || student.user_email} from this course?\n\nTheir progress will be deleted.`)) {
                                removeStudentMutation.mutate(student.user_id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove from Course
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </SurfaceCard>
                </motion.div>
              ))}
            </Stack>
          )}
        </Section>
      )}

      {/* Overview */}
      {viewMode === 'overview' && (
        <Section title="Class Overview" description="Summary of course performance">
          <Grid cols={2} gap="lg">
            <SurfaceCard>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <Stack gap="sm">
                <Link href="/instructor/students">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Users className="h-4 w-4" />
                    View All Students
                  </Button>
                </Link>
                <Link href="/instructor/mastery">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Understanding Overview
                  </Button>
                </Link>
                <Link href="/instructor/ai-tools">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Video className="h-4 w-4" />
                    Extract Concepts
                  </Button>
                </Link>
                <Link href={`/instructor/courses/${courseId}/concept-map`}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <GitBranch className="h-4 w-4" />
                    Concept Map
                  </Button>
                </Link>
              </Stack>
            </SurfaceCard>

            <SurfaceCard>
              <h3 className="font-semibold mb-4">Course Status</h3>
              <Stack gap="md">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total Lessons</div>
                  <div className="text-2xl font-bold">{lessons?.length || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Enrolled Students</div>
                  <div className="text-2xl font-bold">{students?.length || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Visibility</div>
                  <Badge variant={course?.is_published ? "default" : "secondary"}>
                    {course?.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </Stack>
            </SurfaceCard>
          </Grid>
        </Section>
      )}

      {/* Settings */}
      {viewMode === 'settings' && (
        <Section title="Course Settings" description="Manage course details and visibility">
          <SurfaceCard>
            <Stack gap="lg">
              <div className="space-y-2">
                <LabelText required>Course Title</LabelText>
                <Input
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="Enter course title"
                />
              </div>

              <div className="space-y-2">
                <LabelText>Description</LabelText>
                <Textarea
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Describe what students will learn"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <LabelText>Cover Image</LabelText>
                
                {/* Preview */}
                {(coverPreview || coverImageUrl) && (
                  <div className="relative w-full h-48 rounded-lg border border-border overflow-hidden bg-muted">
                    <img 
                      src={coverPreview || coverImageUrl} 
                      alt="Course cover preview" 
                      className="w-full h-full object-contain"
                    />
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingCover}
                    onClick={() => document.getElementById('cover-upload')?.click()}
                    className="gap-2"
                  >
                    {uploadingCover ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        {coverImageUrl ? 'Change Cover' : 'Upload Cover'}
                      </>
                    )}
                  </Button>
                  
                  {coverImageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCoverImageUrl('')
                        setCoverPreview(null)
                      }}
                      className="gap-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
                
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                
                <HelperText>Upload a cover image for your course (JPEG, PNG, WebP, or GIF, max 5MB)</HelperText>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <LabelText>Publish Course</LabelText>
                  <HelperText>Make this course visible to students</HelperText>
                </div>
                <Switch
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={() => updateCourseMutation.mutate()}
                  disabled={updateCourseMutation.isPending || !courseTitle.trim()}
                >
                  {updateCourseMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>

              <Separator />

              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-destructive mb-1">Danger Zone</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Deleting this course will permanently remove all lessons, concepts, student enrollments, and progress data.
                    </p>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Are you absolutely sure you want to delete "${course?.title}"?\n\nThis will:\n- Delete ${lessons?.length || 0} lessons\n- Remove ${course?.student_count || 0} student enrollments\n- Permanently erase all progress data\n\nThis action CANNOT be undone.`)) {
                          deleteCourseMutation.mutate()
                        }
                      }}
                      disabled={deleteCourseMutation.isPending}
                      className="gap-2"
                    >
                      {deleteCourseMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Delete Course Permanently
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Stack>
          </SurfaceCard>
        </Section>
      )}

      {/* Add Lesson Modal */}
      <ModalLayout
        open={addLessonOpen}
        onClose={() => setAddLessonOpen(false)}
        title="Add New Lesson"
        description="Create a new lesson for your course"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddLessonOpen(false)} disabled={lessonUploading}>
              Cancel
            </Button>
            <Button 
              onClick={() => addLessonMutation.mutate()}
              disabled={!lessonTitle.trim() || addLessonMutation.isPending || lessonUploading}
              className="gap-2"
            >
              {(addLessonMutation.isPending || lessonUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
              {lessonUploading ? 'Uploading...' : 'Add Lesson'}
            </Button>
          </>
        }
      >
        <Stack gap="md">
          <div className="space-y-2">
            <LabelText required>Lesson Title</LabelText>
            <Input
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder="e.g., Introduction to Variables"
            />
          </div>
          <div className="space-y-2">
            <LabelText>Description</LabelText>
            <Textarea
              value={lessonDescription}
              onChange={(e) => setLessonDescription(e.target.value)}
              placeholder="What will students learn in this lesson?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <LabelText>Content</LabelText>
            <Textarea
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              placeholder="Lesson text content (supports Markdown)..."
              rows={4}
              className="font-mono text-sm"
            />
          </div>

          {/* Video upload */}
          <div className="space-y-2">
            <LabelText>Video (Optional)</LabelText>
            {!lessonVideoFile ? (
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
                      setLessonVideoFile(file)
                    }
                  }}
                  className="hidden"
                  id="lesson-video-upload"
                />
                <label htmlFor="lesson-video-upload" className="cursor-pointer">
                  <Video className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload video</p>
                  <p className="text-xs text-muted-foreground">MP4, WebM — max 50 MB</p>
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                <Video className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{lessonVideoFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(lessonVideoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setLessonVideoFile(null)}>
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
                  const valid = files.filter(f => {
                    if (f.size > 50 * 1024 * 1024) {
                      toast.error(`${f.name} exceeds 50 MB limit`)
                      return false
                    }
                    return true
                  })
                  setLessonMaterialFiles(prev => [...prev, ...valid])
                  e.target.value = ''
                }}
                className="hidden"
                id="lesson-materials-upload"
              />
              <label htmlFor="lesson-materials-upload" className="cursor-pointer">
                <File className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload materials</p>
              </label>
            </div>
            {lessonMaterialFiles.length > 0 && (
              <div className="space-y-2 mt-2">
                {lessonMaterialFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                    <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setLessonMaterialFiles(prev => prev.filter((_, i) => i !== idx))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Stack>
      </ModalLayout>

      {/* Add Student Modal */}
      <ModalLayout
        open={addStudentOpen}
        onClose={() => {
          setAddStudentOpen(false)
          setCreatedCredentials(null)
        }}
        title={createdCredentials ? "Student Created Successfully" : "Add New Student"}
        description={createdCredentials ? "Share these credentials with the student" : "Create a new student account and enroll in this course"}
        size="lg"
        footer={
          createdCredentials ? (
            <>
              <Button variant="outline" onClick={() => {
                setAddStudentOpen(false)
                setCreatedCredentials(null)
              }}>
                Close
              </Button>
              <Button onClick={() => {
                navigator.clipboard.writeText(`Username: ${createdCredentials.username}\nPassword: ${createdCredentials.password}`)
                toast.success('Credentials copied to clipboard!')
              }} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy Credentials
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setAddStudentOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createStudentMutation.mutate()}
                disabled={!studentFirstName.trim() || !studentLastName.trim() || createStudentMutation.isPending}
                className="gap-2"
              >
                {createStudentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Student
              </Button>
            </>
          )
        }
      >
        {createdCredentials ? (
          <Stack gap="md">
            <InfoPanel
              icon={CheckCircle2}
              variant="success"
              title="Student Account Created"
              description="Save these credentials - they won't be shown again!"
            />
            <SurfaceCard className="bg-muted">
              <Stack gap="sm">
                <div>
                  <LabelText>Username (for login)</LabelText>
                  <div className="font-mono text-lg font-semibold">{createdCredentials.username}</div>
                </div>
                <div>
                  <LabelText>Password (temporary)</LabelText>
                  <div className="font-mono text-lg font-semibold">{createdCredentials.password}</div>
                </div>
              </Stack>
            </SurfaceCard>
            <InfoPanel
              icon={AlertTriangle}
              variant="warning"
              title="Important"
              description="Make sure to save these credentials. Students should change their password after first login."
            />
          </Stack>
        ) : (
          <Stack gap="md">
            <Grid cols={2} gap="md">
              <div className="space-y-2">
                <LabelText required>First Name</LabelText>
                <Input
                  value={studentFirstName}
                  onChange={(e) => setStudentFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <LabelText required>Last Name</LabelText>
                <Input
                  value={studentLastName}
                  onChange={(e) => setStudentLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </Grid>
            
            <div className="space-y-2">
              <LabelText>Email (Optional)</LabelText>
              <Input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="student@example.com"
              />
              <HelperText>If provided, student can use email for password recovery</HelperText>
            </div>

            <div className="space-y-2">
              <LabelText>Phone Number (Optional)</LabelText>
              <Input
                type="tel"
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
                placeholder="+1 234 567 8900"
              />
              <HelperText>For contact purposes only</HelperText>
            </div>

            <InfoPanel
              icon={AlertCircle}
              variant="info"
              title="Auto-Generated Credentials"
              description="Username and password will be automatically generated. Make sure to save them after creation!"
            />
          </Stack>
        )}
      </ModalLayout>

    </PageShell>
  )
}
