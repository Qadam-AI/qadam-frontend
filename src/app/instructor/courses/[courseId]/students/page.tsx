'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  UserPlus, 
  Users,
  Mail,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  Send
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface StudentProgress {
  user_id: string
  user_name: string | null
  user_email: string
  enrolled_at: string
  status: string
  lessons_completed: number
  total_lessons: number
  progress_percent: number
  total_watch_time_seconds: number
  last_activity: string | null
}

interface Invitation {
  id: string
  email: string
  status: string
  created_at: string
  expires_at: string | null
}

interface CourseAnalytics {
  course_id: string
  total_students: number
  active_students: number
  completed_students: number
  average_progress: number
  total_lessons: number
  completion_rate: number
}

export default function CourseStudentsPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const courseId = params.courseId as string

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [emails, setEmails] = useState<string[]>([])

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['course-students', courseId],
    queryFn: async () => {
      const res = await api.get<StudentProgress[]>(`/api/v1/instructor/courses/${courseId}/students`)
      return res.data
    }
  })

  const { data: invitations, isLoading: loadingInvitations } = useQuery({
    queryKey: ['course-invitations', courseId],
    queryFn: async () => {
      const res = await api.get<Invitation[]>(`/api/v1/instructor/courses/${courseId}/invitations`)
      return res.data
    }
  })

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['course-analytics', courseId],
    queryFn: async () => {
      const res = await api.get<CourseAnalytics>(`/api/v1/instructor/courses/${courseId}/analytics`)
      return res.data
    }
  })

  const inviteMutation = useMutation({
    mutationFn: async (emailList: string[]) => {
      const res = await api.post(`/api/v1/instructor/courses/${courseId}/invite`, {
        emails: emailList
      })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-invitations', courseId] })
      toast.success(`${data.sent} invitation(s) sent!`)
      if (data.already_enrolled.length > 0) {
        toast.info(`${data.already_enrolled.length} already enrolled`)
      }
      setInviteDialogOpen(false)
      setEmails([])
      setEmailInput('')
    },
    onError: () => {
      toast.error('Failed to send invitations')
    }
  })

  const cancelInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      await api.delete(`/api/v1/instructor/invitations/${invitationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-invitations', courseId] })
      toast.success('Invitation cancelled')
    },
    onError: () => {
      toast.error('Failed to cancel invitation')
    }
  })

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase()
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !emails.includes(email)) {
      setEmails([...emails, email])
      setEmailInput('')
    }
  }

  const removeEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addEmail()
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
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
            <h1 className="text-3xl font-bold tracking-tight">Students</h1>
            <p className="text-muted-foreground mt-1">
              Manage enrolled students and invitations
            </p>
          </div>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Students
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {loadingAnalytics ? (
          [1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.total_students || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.active_students || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.completed_students || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(analytics?.completion_rate || 0)}%</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="enrolled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="enrolled">
            Enrolled ({students?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations ({invitations?.filter(i => i.status === 'pending').length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled">
          <Card>
            <CardContent className="pt-6">
              {loadingStudents ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : students?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No students enrolled yet</p>
                  <p className="text-sm">Invite students to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Watch Time</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students?.map((student) => (
                      <TableRow key={student.user_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.user_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{student.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-32">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>{student.lessons_completed}/{student.total_lessons}</span>
                              <span>{Math.round(student.progress_percent)}%</span>
                            </div>
                            <Progress value={student.progress_percent} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDuration(student.total_watch_time_seconds)}
                        </TableCell>
                        <TableCell>
                          {student.last_activity 
                            ? formatDate(student.last_activity)
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            student.status === 'completed' ? 'default' :
                            student.status === 'active' ? 'secondary' : 'outline'
                          }>
                            {student.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardContent className="pt-6">
              {loadingInvitations ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : invitations?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invitations sent yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations?.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>{formatDate(invitation.created_at)}</TableCell>
                        <TableCell>
                          {invitation.expires_at ? formatDate(invitation.expires_at) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            invitation.status === 'accepted' ? 'default' :
                            invitation.status === 'pending' ? 'secondary' : 'outline'
                          }>
                            {invitation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invitation.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => cancelInviteMutation.mutate(invitation.id)}
                            >
                              Cancel
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
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Students</DialogTitle>
            <DialogDescription>
              Enter email addresses to invite students to this course
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleKeyDown}
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
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <button onClick={() => removeEmail(email)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              Students will receive an email with a link to join the course.
              They need to register or login with the same email address.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => inviteMutation.mutate(emails)}
              disabled={emails.length === 0 || inviteMutation.isPending}
            >
              {inviteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Send className="h-4 w-4 mr-2" />
              Send {emails.length} Invitation{emails.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
