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
  Send,
  TrendingUp,
  AlertCircle
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
      const res = await api.get<StudentProgress[]>(`/instructor/courses/${courseId}/students`)
      return res.data
    }
  })

  const { data: invitations, isLoading: loadingInvitations } = useQuery({
    queryKey: ['course-invitations', courseId],
    queryFn: async () => {
      const res = await api.get<Invitation[]>(`/instructor/courses/${courseId}/invitations`)
      return res.data
    }
  })

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['course-analytics', courseId],
    queryFn: async () => {
      const res = await api.get<CourseAnalytics>(`/instructor/courses/${courseId}/analytics`)
      return res.data
    }
  })

  const inviteMutation = useMutation({
    mutationFn: async (emailList: string[]) => {
      const res = await api.post(`/instructor/courses/${courseId}/invite`, {
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
      await api.delete(`/instructor/invitations/${invitationId}`)
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
            <h1 className="text-3xl font-bold tracking-tight">Class Overview</h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Track student progress and understanding
            </p>
          </div>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Students
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-8 md:grid-cols-3 pt-4 pb-8 border-b">
        {loadingAnalytics ? (
          [1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : (
          <>
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span>Active Students</span>
              </div>
              <div className="text-4xl font-serif font-medium tracking-tight text-foreground">
                {analytics?.active_students || 0}
                <span className="text-lg text-muted-foreground ml-2 font-sans font-normal">
                  / {analytics?.total_students || 0}
                </span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span>Completion Rate</span>
              </div>
              <div className="text-4xl font-serif font-medium tracking-tight text-foreground">
                {Math.round(analytics?.average_progress || 0)}%
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <AlertCircle className="h-4 w-4" />
                <span>Needs Support</span>
              </div>
              <div className="text-4xl font-serif font-medium tracking-tight text-foreground">
                 {students?.filter(s => (s.progress_percent || 0) < 30 && (new Date(s.last_activity || '').getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000)).length || 0}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="enrolled" className="space-y-8">
        <TabsList className="bg-transparent p-0 gap-6 h-auto border-b w-full justify-start rounded-none">
          <TabsTrigger 
            value="enrolled"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 font-medium"
          >
            Enrolled Students ({students?.length || 0})
          </TabsTrigger>
          <TabsTrigger 
            value="invitations"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 font-medium"
          >
            Pending Invitations ({invitations?.filter(i => i.status === 'pending').length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="mt-0">
            {loadingStudents ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : students?.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-serif">No students enrolled yet</p>
                <p className="text-sm mt-1">Invite students to get started with this course.</p>
              </div>
            ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border">
                      <TableHead className="font-medium text-muted-foreground pl-0 w-[300px]">Student</TableHead>
                      <TableHead className="font-medium text-muted-foreground">Progress</TableHead>
                      <TableHead className="font-medium text-muted-foreground">Last Active</TableHead>
                      <TableHead className="font-medium text-muted-foreground text-right pr-0">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students?.map((student) => {
                       const isStruggling = (student.progress_percent || 0) < 30 && 
                         (new Date(student.last_activity || '').getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000);
                         const isCompleted = (student.progress_percent || 0) === 100;

                         return (
                        <TableRow key={student.user_id} className="hover:bg-muted/30 border-b border-border/40">
                          <TableCell className="pl-0">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                                {(student.user_name || student.user_email).substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{student.user_name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{student.user_email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="w-[180px] space-y-2">
                              <Progress value={student.progress_percent} className="h-1.5 bg-muted" />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{student.lessons_completed} / {student.total_lessons} lessons</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {student.last_activity 
                              ? formatDate(student.last_activity)
                              : 'Never'}
                          </TableCell>
                          <TableCell className="text-right pr-0">
                            {isCompleted ? (
                               <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 hover:bg-green-100">
                                 Completed
                               </Badge>
                            ) : isStruggling ? (
                               <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100">
                                 Needs Attention
                               </Badge>
                            ) : (
                               <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100">
                                 On Track
                               </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )})}
                    </TableBody>
                  </Table>
              )}
        </TabsContent>

        <TabsContent value="invitations" className="mt-0">
              {loadingInvitations ? (
                <div className="space-y-4 py-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : invitations?.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-serif">No invitations sent yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border">
                      <TableHead className="font-medium text-muted-foreground pl-0">Email</TableHead>
                      <TableHead className="font-medium text-muted-foreground">Sent</TableHead>
                      <TableHead className="font-medium text-muted-foreground">Expires</TableHead>
                      <TableHead className="font-medium text-muted-foreground">Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations?.map((invitation) => (
                      <TableRow key={invitation.id} className="hover:bg-muted/30 border-b border-border/40">
                        <TableCell className="pl-0 text-foreground font-medium">{invitation.email}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(invitation.created_at)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {invitation.expires_at ? formatDate(invitation.expires_at) : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full border ${
                            invitation.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                            invitation.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                            'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                            {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {invitation.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive h-8 px-2"
                              onClick={() => cancelInviteMutation.mutate(invitation.id)}
                            >
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
