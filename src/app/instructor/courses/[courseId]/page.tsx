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
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Plus,
  Video,
  FileText,
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
  Send,
  BarChart3,
  UserPlus,
  BookOpen,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Course {
  id: string
  title: string
  description?: string
  language: string
  is_published: boolean
  student_count: number
  lesson_count: number
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

interface CourseAnalytics {
  total_students: number
  active_students: number
  completed_students: number
  completion_rate: number
  average_progress: number
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const courseId = params.courseId as string

  const [addLessonOpen, setAddLessonOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDescription, setLessonDescription] = useState('')
  const [lessonVideoUrl, setLessonVideoUrl] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [emails, setEmails] = useState<string[]>([])

  // Fetch course details
  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['instructor-course', courseId],
    queryFn: async () => {
      const res = await api.get<Course>(`/instructor/courses/${courseId}`)
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

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['course-analytics', courseId],
    queryFn: async () => {
      const res = await api.get<CourseAnalytics>(`/instructor/courses/${courseId}/analytics`)
      return res.data
    }
  })

  // Add lesson mutation
  const addLessonMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/instructor/courses/${courseId}/lessons`, {
        title: lessonTitle,
        description: lessonDescription || undefined,
        video_url: lessonVideoUrl || undefined,
        position: (lessons?.length || 0) + 1
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] })
      toast.success('Lesson added! 🎉')
      setAddLessonOpen(false)
      setLessonTitle('')
      setLessonDescription('')
      setLessonVideoUrl('')
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

  // Invite students mutation
  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/instructor/courses/${courseId}/invite`, {
        emails
      })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-students', courseId] })
      toast.success(`${data.sent} invitation(s) sent! 📧`)
      setInviteOpen(false)
      setEmails([])
      setEmailInput('')
    },
    onError: () => {
      toast.error('Failed to send invitations')
    }
  })

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase()
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !emails.includes(email)) {
      setEmails([...emails, email])
      setEmailInput('')
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/instructor/courses">
            <Button variant="ghost" size="icon" className="rounded-full mt-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            {loadingCourse ? (
              <>
                <Skeleton className="h-9 w-64 mb-2" />
                <Skeleton className="h-5 w-48" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight">{course?.title}</h1>
                <p className="text-muted-foreground mt-1">
                  {course?.description || 'No description'}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setInviteOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Students
          </Button>
          <Button onClick={() => setAddLessonOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Lesson
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-200 dark:bg-blue-800">
                <Video className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {lessons?.length || 0}
                </p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Lessons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-200 dark:bg-green-800">
                <Users className="h-4 w-4 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {analytics?.total_students || 0}
                </p>
                <p className="text-xs text-green-600/70 dark:text-green-400/70">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-200 dark:bg-purple-800">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {Math.round(analytics?.average_progress || 0)}%
                </p>
                <p className="text-xs text-purple-600/70 dark:text-purple-400/70">Avg Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-200 dark:bg-orange-800">
                <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {analytics?.completed_students || 0}
                </p>
                <p className="text-xs text-orange-600/70 dark:text-orange-400/70">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lessons" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="lessons" className="gap-2">
            <Video className="h-4 w-4" />
            Lessons
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="space-y-4">
          {loadingLessons ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : lessons?.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Video className="h-8 w-8 text-primary" />
                  </div>
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your course by adding your first lesson
                </p>
                <Button onClick={() => setAddLessonOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Lesson
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {lessons?.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-md hover:border-primary/30 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <GripVertical className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                        </div>
                        
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-semibold">
                          {lesson.position}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{lesson.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {lesson.video_url ? (
                              <span className="flex items-center gap-1">
                                <Video className="h-3.5 w-3.5" />
                                Video
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5" />
                                Text
                              </span>
                            )}
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
                              onClick={() => deleteLessonMutation.mutate(lesson.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              {/* Add more button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (lessons?.length || 0) * 0.05 }}
              >
                <Card 
                  className="border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                  onClick={() => setAddLessonOpen(true)}
                >
                  <CardContent className="py-6 text-center">
                    <Plus className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Add another lesson</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          {students?.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-green-500" />
                  </div>
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">No students yet</h3>
                <p className="text-muted-foreground mb-4">
                  Invite students to start learning from your course
                </p>
                <Button onClick={() => setInviteOpen(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Students
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {students?.map((student, index) => (
                <motion.div
                  key={student.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-sm transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold uppercase">
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
                        
                        <div className="text-right">
                          <p className="font-semibold">{Math.round(student.progress_percent)}%</p>
                          <p className="text-xs text-muted-foreground">
                            {student.lessons_completed}/{student.total_lessons} lessons
                          </p>
                        </div>
                        
                        <div className="w-24">
                          <Progress value={student.progress_percent} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="relative inline-flex">
                    <svg className="w-32 h-32">
                      <circle
                        className="text-muted stroke-current"
                        strokeWidth="8"
                        fill="transparent"
                        r="56"
                        cx="64"
                        cy="64"
                      />
                      <circle
                        className="text-primary stroke-current"
                        strokeWidth="8"
                        strokeLinecap="round"
                        fill="transparent"
                        r="56"
                        cx="64"
                        cy="64"
                        strokeDasharray={`${(analytics?.completion_rate || 0) * 3.52} 352`}
                        transform="rotate(-90 64 64)"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
                      {Math.round(analytics?.completion_rate || 0)}%
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-4">
                    {analytics?.completed_students || 0} of {analytics?.total_students || 0} students completed
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Active Students</span>
                  </div>
                  <span className="font-bold text-lg">{analytics?.active_students || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Average Progress</span>
                  </div>
                  <span className="font-bold text-lg">{Math.round(analytics?.average_progress || 0)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Lesson Dialog */}
      <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Add New Lesson
            </DialogTitle>
            <DialogDescription>
              Add a new lesson to your course
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lessonTitle">Lesson Title *</Label>
              <Input
                id="lessonTitle"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="e.g., Introduction to Variables"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessonDesc">Description</Label>
              <Textarea
                id="lessonDesc"
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder="What will students learn in this lesson?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                value={lessonVideoUrl}
                onChange={(e) => setLessonVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
              <p className="text-xs text-muted-foreground">
                YouTube, Vimeo, or direct video links
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLessonOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => addLessonMutation.mutate()}
              disabled={!lessonTitle.trim() || addLessonMutation.isPending}
              className="gap-2"
            >
              {addLessonMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Students Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Invite Students
            </DialogTitle>
            <DialogDescription>
              Send email invitations to students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addEmail()
                  }
                }}
                placeholder="student@example.com"
                type="email"
              />
              <Button variant="outline" onClick={addEmail}>
                Add
              </Button>
            </div>
            
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1 py-1.5">
                    {email}
                    <button onClick={() => setEmails(emails.filter(e => e !== email))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              Students will receive an email with a link to join your course.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => inviteMutation.mutate()}
              disabled={emails.length === 0 || inviteMutation.isPending}
              className="gap-2"
            >
              {inviteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Send className="h-4 w-4" />
              Send {emails.length} Invitation{emails.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
