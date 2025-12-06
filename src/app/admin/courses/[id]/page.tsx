'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft, 
  BookOpen, 
  GraduationCap, 
  Mail, 
  MoreVertical, 
  Plus, 
  Send, 
  Trash2, 
  UserPlus,
  Users,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Course {
  id: string
  title: string
  description: string | null
  instructor_id: string | null
  instructor_name: string | null
  is_published: boolean
  lesson_count: number
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

interface Invitation {
  id: string
  email: string
  status: string
  created_at: string
  expires_at: string | null
  inviter_name: string | null
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const courseId = params.id as string

  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isEnrollOpen, setIsEnrollOpen] = useState(false)
  const [inviteEmails, setInviteEmails] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')

  // Fetch course details
  const { data: courses } = useQuery<Course[]>({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const response = await api.get('/admin/courses')
      return response.data
    },
  })
  const course = courses?.find(c => c.id === courseId)

  // Fetch enrolled students
  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['course-students', courseId],
    queryFn: async () => {
      const response = await api.get(`/enrollments/course/${courseId}/students`)
      return response.data
    },
    enabled: !!courseId,
  })

  // Fetch invitations
  const { data: invitations, isLoading: invitationsLoading } = useQuery<Invitation[]>({
    queryKey: ['course-invitations', courseId],
    queryFn: async () => {
      const response = await api.get(`/enrollments/course/${courseId}/invitations`)
      return response.data
    },
    enabled: !!courseId,
  })

  // Fetch all users for manual enrollment
  const { data: allUsers } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/admin/users')
      return response.data.filter((u: User) => u.role === 'learner')
    },
  })

  // Send invitations mutation
  const sendInvitesMutation = useMutation({
    mutationFn: async (emails: string[]) => {
      await api.post('/enrollments/invitations/bulk', {
        course_id: courseId,
        emails,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-invitations', courseId] })
      setIsInviteOpen(false)
      setInviteEmails('')
      toast.success('Invitations sent successfully')
    },
    onError: () => {
      toast.error('Failed to send invitations')
    },
  })

  // Enroll user mutation
  const enrollMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/enrollments/course/${courseId}/enroll/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-students', courseId] })
      setIsEnrollOpen(false)
      setSelectedUserId('')
      toast.success('Student enrolled successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to enroll student')
    },
  })

  // Remove student mutation
  const removeStudentMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/enrollments/course/${courseId}/student/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-students', courseId] })
      toast.success('Student removed from course')
    },
    onError: () => {
      toast.error('Failed to remove student')
    },
  })

  // Cancel invitation mutation
  const cancelInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await api.delete(`/enrollments/invitations/${invitationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-invitations', courseId] })
      toast.success('Invitation cancelled')
    },
    onError: () => {
      toast.error('Failed to cancel invitation')
    },
  })

  const handleSendInvites = () => {
    const emails = inviteEmails
      .split(/[,\n]/)
      .map(e => e.trim())
      .filter(e => e && e.includes('@'))
    
    if (emails.length === 0) {
      toast.error('Please enter valid email addresses')
      return
    }
    sendInvitesMutation.mutate(emails)
  }

  const handleEnroll = () => {
    if (!selectedUserId) {
      toast.error('Please select a student')
      return
    }
    enrollMutation.mutate(selectedUserId)
  }

  // Get students not already enrolled
  const availableUsers = allUsers?.filter(
    u => !students?.some(s => s.user_id === u.id)
  )

  if (!course) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">{course.description || 'No description'}</p>
        </div>
        <Badge variant={course.is_published ? 'default' : 'secondary'}>
          {course.is_published ? 'Published' : 'Draft'}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students?.length || 0}</div>
            <p className="text-xs text-muted-foreground">enrolled students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lessons</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.lesson_count}</div>
            <p className="text-xs text-muted-foreground">total lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invitations?.filter(i => i.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">awaiting response</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">
            <GraduationCap className="h-4 w-4 mr-2" />
            Students
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Mail className="h-4 w-4 mr-2" />
            Invitations
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>Manage students in this course</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEnrollOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enroll Student
                </Button>
                <Button onClick={() => setIsInviteOpen(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Invite Students
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : students?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No students enrolled yet</p>
                  <p className="text-sm">Invite students or enroll them manually</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students?.map((student) => (
                      <TableRow key={student.user_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            student.status === 'active' ? 'default' :
                            student.status === 'completed' ? 'secondary' : 'destructive'
                          }>
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-secondary rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${student.progress_percent}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {student.lessons_completed}/{student.total_lessons}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(student.enrolled_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => removeStudentMutation.mutate(student.user_id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove from course
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Course Invitations</CardTitle>
                <CardDescription>Pending and sent invitations</CardDescription>
              </div>
              <Button onClick={() => setIsInviteOpen(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send Invitations
              </Button>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : invitations?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invitations sent yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations?.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.email}</TableCell>
                        <TableCell>
                          <Badge variant={
                            invite.status === 'pending' ? 'outline' :
                            invite.status === 'accepted' ? 'default' : 'destructive'
                          }>
                            {invite.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {invite.status === 'accepted' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {invite.status === 'expired' && <XCircle className="h-3 w-3 mr-1" />}
                            {invite.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(invite.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {invite.expires_at 
                            ? new Date(invite.expires_at).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          {invite.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => cancelInviteMutation.mutate(invite.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Students</DialogTitle>
            <DialogDescription>
              Enter email addresses to invite students to this course.
              They will receive an invitation link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="emails">Email Addresses</Label>
              <Textarea
                id="emails"
                placeholder="student1@email.com&#10;student2@email.com&#10;student3@email.com"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter one email per line or separate with commas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendInvites} disabled={sendInvitesMutation.isPending}>
              {sendInvitesMutation.isPending ? 'Sending...' : 'Send Invitations'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll Student</DialogTitle>
            <DialogDescription>
              Select an existing user to enroll in this course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user">Select Student</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnroll} disabled={enrollMutation.isPending}>
              {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
