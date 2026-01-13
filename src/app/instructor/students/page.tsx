'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  Search,
  TrendingUp,
  Clock,
  Award,
  BookOpen,
  MoreHorizontal,
  Mail,
  Plus,
  Copy,
  Check,
  UserPlus
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { toast } from 'sonner'

interface StudentEnrollment {
  user_id: string
  user_email: string
  user_name: string
  avatar_url?: string
  course_id: string
  course_title: string
  enrolled_at: string
  progress: number
  status: string
  last_activity?: string
}

interface Course {
  id: string
  title: string
}

export default function InstructorStudents() {
  const [search, setSearch] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false)
  const [newStudentName, setNewStudentName] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [generatedCredentials, setGeneratedCredentials] = useState<{ username: string; password: string } | null>(null)
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null)
  
  const queryClient = useQueryClient()

  const { data: students, isLoading } = useQuery<StudentEnrollment[]>({
    queryKey: ['instructor-students', search],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/instructor/students', {
          params: { search: search || undefined }
        })
        // Handle both wrapped and direct array responses
        return Array.isArray(res.data) ? res.data : (res.data?.students || [])
      } catch {
        return []
      }
    },
  })

  const { data: courses } = useQuery<Course[]>({
    queryKey: ['instructor-courses-list'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/instructor/courses')
        return Array.isArray(res.data) ? res.data : (res.data?.courses || [])
      } catch {
        return []
      }
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['instructor-student-stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/instructor/stats')
        return res.data
      } catch {
        return { total_students: 0, active_today: 0, avg_progress: 0 }
      }
    },
  })

  const createStudentMutation = useMutation({
    mutationFn: async (data: { full_name: string; course_id: string }) => {
      const res = await api.post('/api/v1/instructor/students', data)
      return res.data
    },
    onSuccess: (data) => {
      setGeneratedCredentials({ username: data.username, password: data.password })
      setAddDialogOpen(false)
      setCredentialsDialogOpen(true)
      setNewStudentName('')
      setSelectedCourseId('')
      queryClient.invalidateQueries({ queryKey: ['instructor-students'] })
      queryClient.invalidateQueries({ queryKey: ['instructor-student-stats'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create student')
    },
  })

  const handleAddStudent = () => {
    if (!newStudentName.trim()) {
      toast.error('Please enter student name')
      return
    }
    if (!selectedCourseId) {
      toast.error('Please select a course')
      return
    }
    createStudentMutation.mutate({ full_name: newStudentName.trim(), course_id: selectedCourseId })
  }

  const copyToClipboard = async (text: string, field: 'username' | 'password') => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success(`${field === 'username' ? 'Username' : 'Password'} copied!`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Students</h1>
          <p className="text-muted-foreground">View and manage students across your courses</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const allStudents = students || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Students</h1>
        <p className="text-muted-foreground">View and manage students across your courses</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_students || allStudents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              Active Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active_today || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Avg Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avg_progress || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" />
              Completions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_completions || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add Student */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Add Student Button */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Enter student&apos;s name and select a course. Login credentials will be generated automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="student-name">Full Name</Label>
                <Input
                  id="student-name"
                  placeholder="Enter student's full name"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStudent} disabled={createStudentMutation.isPending}>
                {createStudentMutation.isPending ? 'Creating...' : 'Create Student'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Credentials Dialog */}
        <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Student Created Successfully
              </DialogTitle>
              <DialogDescription>
                Share these credentials with the student. They can use them to log in.
              </DialogDescription>
            </DialogHeader>
            {generatedCredentials && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Username</Label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={generatedCredentials.username} className="font-mono" />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(generatedCredentials.username, 'username')}
                    >
                      {copiedField === 'username' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Password</Label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={generatedCredentials.password} className="font-mono" />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(generatedCredentials.password, 'password')}
                    >
                      {copiedField === 'password' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> Save these credentials now. The password cannot be retrieved later.
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => {
                setCredentialsDialogOpen(false)
                setGeneratedCredentials(null)
              }}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Students Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                    <p>No students enrolled yet.</p>
                    <p className="text-sm">Click &quot;Add Student&quot; to create student accounts, or share your course join links.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              allStudents.map((student, idx) => (
                <TableRow key={`${student.user_id}-${student.course_id}-${idx}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatar_url} />
                        <AvatarFallback>
                          {student.user_name?.charAt(0) || student.user_email?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{student.user_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{student.user_email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{student.course_title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{student.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        student.status === 'completed' ? 'default' :
                        student.status === 'active' ? 'secondary' :
                        'outline'
                      }
                      className={student.status === 'completed' ? 'bg-green-600' : ''}
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(student.enrolled_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.last_activity 
                      ? formatDistanceToNow(new Date(student.last_activity), { addSuffix: true })
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          View Progress
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
