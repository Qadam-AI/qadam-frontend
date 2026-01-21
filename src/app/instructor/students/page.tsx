'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  TrendingDown,
  Minus,
  Clock,
  BookOpen,
  Copy,
  Check,
  UserPlus,
  AlertTriangle,
  Activity,
  Target,
  ChevronRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState, useMemo } from 'react'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface StudentAnalytics {
  user_id: string
  guest_id?: string  // Present if is_guest is true
  user_email: string | null
  user_name: string
  avatar_url?: string
  course_id: string
  course_title: string
  courses_enrolled: number
  enrolled_at: string
  last_activity: string | null
  total_attempts: number
  passed_attempts: number
  pass_rate: number
  attempts_last_7_days: number
  status: 'active' | 'at-risk' | 'inactive'
  is_guest?: boolean  // True for guest students from practice links
  practice_link_code?: string  // Present if is_guest is true
  practice_link_title?: string  // Present if is_guest is true
}

interface StudentDetails {
  user_id: string
  user_name: string
  user_email: string
  avatar_url?: string
  recent_attempts: {
    id: string
    concept_id: string
    concept_name: string
    passed: boolean
    created_at: string
  }[]
  weak_concepts: {
    concept_id: string
    concept_name: string
    total_attempts: number
    passed_attempts: number
    pass_rate: number
  }[]
  performance_trend: 'improving' | 'stable' | 'declining'
}

interface Course {
  id: string
  title: string
}

function StatusBadge({ status }: { status: 'active' | 'at-risk' | 'inactive' }) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Active
        </Badge>
      )
    case 'at-risk':
      return (
        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          At Risk
        </Badge>
      )
    case 'inactive':
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Inactive
        </Badge>
      )
  }
}

function TrendIcon({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="h-4 w-4 text-green-500" />
    case 'declining':
      return <TrendingDown className="h-4 w-4 text-red-500" />
    default:
      return <Minus className="h-4 w-4 text-gray-400" />
  }
}

const safeFormatDistanceToNow = (date: string | Date | null | undefined) => {
  if (!date) return 'Never'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Unknown date'
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return 'Unknown date'
  }
}

export default function InstructorStudents() {
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false)
  const [newStudentName, setNewStudentName] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [generatedCredentials, setGeneratedCredentials] = useState<{ username: string; password: string } | null>(null)
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalytics | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  
  const queryClient = useQueryClient()

  const { data: students, isLoading } = useQuery<StudentAnalytics[]>({
    queryKey: ['instructor-student-analytics', courseFilter, statusFilter, search],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (courseFilter !== 'all') params.course_id = courseFilter
      if (statusFilter !== 'all') params.status_filter = statusFilter
      if (search) params.search = search
      
      const res = await api.get('/instructor/analytics/students', { params })
      return Array.isArray(res.data) ? res.data : []
    },
  })

  const { data: courses } = useQuery<Course[]>({
    queryKey: ['instructor-courses-list'],
    queryFn: async () => {
      const res = await api.get('/instructor/courses')
      return Array.isArray(res.data) ? res.data : (res.data?.courses || [])
    },
  })

  const { data: studentDetails, isLoading: loadingDetails } = useQuery<StudentDetails>({
    queryKey: ['student-details', selectedStudent?.user_id, selectedStudent?.is_guest],
    queryFn: async () => {
      if (!selectedStudent) return null
      const params: Record<string, string> = {}
      if (courseFilter !== 'all') params.course_id = courseFilter
      
      // Use different endpoint for guest students
      if (selectedStudent.is_guest && selectedStudent.guest_id) {
        const res = await api.get(`/instructor/analytics/guests/${selectedStudent.guest_id}/details`, { params })
        return res.data
      } else {
        const res = await api.get(`/instructor/analytics/students/${selectedStudent.user_id}/details`, { params })
        return res.data
      }
    },
    enabled: !!selectedStudent && detailSheetOpen,
  })

  const createStudentMutation = useMutation({
    mutationFn: async (data: { full_name: string; course_id: string }) => {
      const res = await api.post('/instructor/students', data)
      return res.data
    },
    onSuccess: (data) => {
      setGeneratedCredentials({ username: data.username, password: data.password })
      setAddDialogOpen(false)
      setCredentialsDialogOpen(true)
      setNewStudentName('')
      setSelectedCourseId('')
      queryClient.invalidateQueries({ queryKey: ['instructor-student-analytics'] })
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

  const openStudentDetails = (student: StudentAnalytics) => {
    setSelectedStudent(student)
    setDetailSheetOpen(true)
  }

  const stats = useMemo(() => {
    if (!students || students.length === 0) {
      return { total: 0, active: 0, atRisk: 0, inactive: 0, avgPassRate: 0, guests: 0 }
    }
    
    const total = students.length
    const active = students.filter(s => s.status === 'active').length
    const atRisk = students.filter(s => s.status === 'at-risk').length
    const inactive = students.filter(s => s.status === 'inactive').length
    const guests = students.filter(s => s.is_guest).length
    const avgPassRate = students.reduce((sum, s) => sum + s.pass_rate, 0) / total
    
    return { total, active, atRisk, inactive, avgPassRate: Math.round(avgPassRate), guests }
  }, [students])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">Track student engagement and performance</p>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const allStudents = students || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Students
        </h1>
        <p className="text-muted-foreground">Track student engagement and identify who needs help</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              At Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.atRisk}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              Inactive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Avg Pass Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPassRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses?.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="at-risk">At Risk</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        
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

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead className="text-center">Last Activity</TableHead>
              <TableHead className="text-center">Attempts (7d)</TableHead>
              <TableHead className="text-center">Pass Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <Users className="h-12 w-12 text-muted-foreground/30" />
                    <div>
                      <p className="font-medium">No students found</p>
                      <p className="text-sm">
                        {search || courseFilter !== 'all' || statusFilter !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Click "Add Student" to create student accounts'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              allStudents.map((student) => (
                <TableRow 
                  key={`${student.user_id}-${student.course_id}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openStudentDetails(student)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatar_url} />
                        <AvatarFallback>
                          {student.user_name?.charAt(0) || student.user_email?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {student.user_name || 'Unknown'}
                          {student.is_guest && (
                            <Badge variant="outline" className="text-xs">Guest</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {student.is_guest 
                            ? `via ${student.practice_link_title || student.practice_link_code}`
                            : student.user_email
                          }
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{student.course_title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {safeFormatDistanceToNow(student.last_activity)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-medium ${student.attempts_last_7_days > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {student.attempts_last_7_days}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500" 
                          style={{ width: `${student.pass_rate}%` }} 
                        />
                      </div>
                      <span className={`text-sm font-medium ${student.pass_rate >= 70 ? 'text-green-600' : student.pass_rate >= 50 ? 'text-yellow-600' : 'text-orange-600'}`}>
                        {student.pass_rate}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={student.status} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={(e) => {
                      e.stopPropagation()
                      openStudentDetails(student)
                    }}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          {loadingDetails ? (
            <div className="space-y-4">
               <SheetHeader>
                 <SheetTitle>
                   <Skeleton className="h-10 w-48" />
                 </SheetTitle>
                 <SheetDescription>
                   <Skeleton className="h-4 w-32" />
                 </SheetDescription>
               </SheetHeader>
               <Separator className="my-6" />
               <Skeleton className="h-32 w-full" />
               <Skeleton className="h-32 w-full" />
            </div>
          ) : studentDetails ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={studentDetails.avatar_url} />
                    <AvatarFallback>
                      {studentDetails.user_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div>{studentDetails.user_name}</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      {studentDetails.user_email}
                    </div>
                  </div>
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 pt-2">
                  Performance Trend: 
                  <span className="flex items-center gap-1 font-medium">
                    <TrendIcon trend={studentDetails.performance_trend} />
                    {studentDetails.performance_trend === 'improving' ? 'Improving' :
                     studentDetails.performance_trend === 'declining' ? 'Declining' : 'Stable'}
                  </span>
                </SheetDescription>
              </SheetHeader>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Concepts Needing Attention
                </h3>
                {studentDetails.weak_concepts.length === 0 ? (
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-center">
                    No struggling concepts identified yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {studentDetails.weak_concepts.slice(0, 5).map((concept) => (
                      <div 
                        key={concept.concept_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                      >
                        <div>
                          <div className="font-medium text-sm">{concept.concept_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {concept.passed_attempts}/{concept.total_attempts} attempts passed
                          </div>
                        </div>
                        <Badge variant="outline" className="text-orange-600">
                          {concept.pass_rate}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-6" />

               {/* Redesigned Performance Section */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Concept Mastery
                </h3>
                
                {studentDetails.recent_attempts.length === 0 ? (
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-center">
                    No practice attempts yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Aggregated view of attempts */}
                    {(() => {
                        // Group attempts by concept
                        const conceptStats = studentDetails.recent_attempts.reduce((acc, attempt) => {
                            if (!acc[attempt.concept_name]) {
                                acc[attempt.concept_name] = {
                                    name: attempt.concept_name,
                                    total: 0,
                                    passed: 0,
                                    lastAttempt: new Date(attempt.created_at)
                                };
                            }
                            acc[attempt.concept_name].total += 1;
                            if (attempt.passed) acc[attempt.concept_name].passed += 1;
                            
                            const attemptDate = new Date(attempt.created_at);
                            if (attemptDate > acc[attempt.concept_name].lastAttempt) {
                                acc[attempt.concept_name].lastAttempt = attemptDate;
                            }
                            return acc;
                        }, {} as Record<string, { name: string, total: number, passed: number, lastAttempt: Date }>);

                        const sortedConcepts = Object.values(conceptStats).sort((a, b) => {
                             // Sort by "Needs Attention" (lower pass rate) first
                             const rateA = a.passed / a.total;
                             const rateB = b.passed / b.total;
                             return rateA - rateB;
                        });

                        return sortedConcepts.map((concept) => {
                            const passRate = Math.round((concept.passed / concept.total) * 100);
                            let statusColor = "bg-primary";
                            let statusText = "Good";
                            
                            if (passRate < 50) {
                                statusColor = "bg-red-500";
                                statusText = "Needs Focus";
                            } else if (passRate < 80) {
                                statusColor = "bg-yellow-500";
                                statusText = "Improving";
                            } else {
                                statusColor = "bg-green-500";
                                statusText = "Mastered";
                            }

                            return (
                                <div key={concept.name} className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-medium">{concept.name}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                Last practiced {safeFormatDistanceToNow(concept.lastAttempt)}
                                            </p>
                                        </div>
                                        <Badge variant={passRate >= 80 ? "default" : "secondary"} className={passRate < 50 ? "bg-red-100 text-red-700 hover:bg-red-100 border-red-200" : ""}>
                                            {statusText}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>Accuracy</span>
                                            <span className="font-medium">{passRate}% ({concept.passed}/{concept.total} passed)</span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                            <div
                                                className={`h-full flex-1 transition-all ${statusColor}`}
                                                style={{ width: `${passRate}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        });
                    })()}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>Student Details</SheetTitle>
              </SheetHeader>
              <div className="text-center py-8 text-muted-foreground">
                Unable to load student details
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Understanding Student Status</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><span className="font-medium text-green-600">Active:</span> Practiced within the last 7 days</li>
                <li><span className="font-medium text-orange-600">At Risk:</span> Low pass rate (&lt;50%) or no activity for 7+ days</li>
                <li><span className="font-medium text-gray-500">Inactive:</span> No activity for 14+ days</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
