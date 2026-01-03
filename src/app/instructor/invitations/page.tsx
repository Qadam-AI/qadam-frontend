'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Mail, 
  Plus,
  Copy,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface Invitation {
  id: string
  email: string
  course_id: string
  course_title: string
  status: 'pending' | 'accepted' | 'expired'
  sent_at?: string
  created_at?: string
  expires_at?: string | null
}

interface Course {
  id: string
  title: string
}

export default function InstructorInvitations() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const queryClient = useQueryClient()

  const { data: invitations, isLoading } = useQuery<Invitation[]>({
    queryKey: ['instructor-invitations'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/instructor/invitations')
        // Handle both wrapped and direct array responses
        return Array.isArray(res.data) ? res.data : (res.data?.invitations || [])
      } catch {
        return []
      }
    },
  })

  const { data: courses } = useQuery<Course[]>({
    queryKey: ['instructor-courses-simple'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/instructor/courses')
        // Handle both wrapped and direct array responses
        return Array.isArray(res.data) ? res.data : (res.data?.courses || [])
      } catch {
        return []
      }
    },
  })

  const sendInvitation = useMutation({
    mutationFn: async () => {
      await api.post('/api/v1/instructor/invitations', {
        email,
        course_id: selectedCourse,
      })
    },
    onSuccess: () => {
      toast.success('Invitation sent!')
      setIsDialogOpen(false)
      setEmail('')
      setSelectedCourse('')
      queryClient.invalidateQueries({ queryKey: ['instructor-invitations'] })
    },
    onError: () => {
      toast.error('Failed to send invitation')
    },
  })

  const resendInvitation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/api/v1/instructor/invitations/${id}/resend`)
    },
    onSuccess: () => {
      toast.success('Invitation resent!')
      queryClient.invalidateQueries({ queryKey: ['instructor-invitations'] })
    },
  })

  const deleteInvitation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/instructor/invitations/${id}`)
    },
    onSuccess: () => {
      toast.success('Invitation deleted')
      queryClient.invalidateQueries({ queryKey: ['instructor-invitations'] })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Course Invitations</h1>
          <p className="text-muted-foreground">Invite students to your courses via email</p>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const allInvitations = invitations || []
  const pendingCount = allInvitations.filter(i => i.status === 'pending').length
  const acceptedCount = allInvitations.filter(i => i.status === 'accepted').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Invitations</h1>
          <p className="text-muted-foreground">Invite students to your courses via email</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Invitation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Course Invitation</DialogTitle>
              <DialogDescription>
                Invite a student to enroll in one of your courses
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="course">Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {(courses || []).map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => sendInvitation.mutate()}
                disabled={!email || !selectedCourse || sendInvitation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allInvitations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{acceptedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invitations</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allInvitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No invitations sent yet
                </TableCell>
              </TableRow>
            ) : (
              allInvitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {invitation.email}
                    </div>
                  </TableCell>
                  <TableCell>{invitation.course_title}</TableCell>
                  <TableCell>
                    {invitation.status === 'pending' && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    )}
                    {invitation.status === 'accepted' && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" /> Accepted
                      </Badge>
                    )}
                    {invitation.status === 'expired' && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" /> Expired
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(invitation.sent_at || invitation.created_at || new Date()), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invitation.expires_at ? formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true }) : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {invitation.status === 'pending' && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => resendInvitation.mutate(invitation.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteInvitation.mutate(invitation.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
