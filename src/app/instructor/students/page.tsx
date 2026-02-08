'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api, { getImageUrl } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
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
  Send,
  X,
  Loader2,
  LayoutGrid,
  LayoutList
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState, useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// Design System
import { PageShell, PageHeader, Section, Grid, Stack } from '@/design-system/layout'
import { MetricCard, SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { EmptyState, LoadingState, Skeleton } from '@/design-system/feedback'
import { DrawerLayout } from '@/design-system/patterns/drawer-layout'
import { ModalLayout } from '@/design-system/patterns/modal-layout'
import { LabelText, HelperText } from '@/design-system/typography'

interface StudentAnalytics {
  user_id: string
  guest_id?: string
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
  is_guest?: boolean
  practice_link_code?: string
  practice_link_title?: string
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
    if (isNaN(d.getTime())) return 'Unknown'
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

export default function InstructorStudents() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false)
  const [newStudentName, setNewStudentName] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [generatedCredentials, setGeneratedCredentials] = useState<{ username: string; password: string } | null>(null)
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null)
  
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
    // Navigate to dedicated student profile page
    const studentId = student.is_guest && student.guest_id 
      ? `guest_${student.guest_id}`
      : student.user_id
    
    console.log('🔍 CLICKED STUDENT - Navigating to:', studentId)
    console.log('🔍 Full student data:', student)
    console.log('🔍 Full URL:', `/instructor/students/${studentId}`)
    
    // Try direct navigation
    window.location.href = `/instructor/students/${studentId}`
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

  return (
    <PageShell maxWidth="2xl">
      <PageHeader
        title="Students"
        description="Track student engagement and identify who needs help"
        action={
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Student
          </Button>
        }
      />

      {/* KPI Metrics */}
      <Section>
        <Grid cols={4} gap="md">
          <MetricCard label="Total" value={stats.total} icon={Users} variant="default" />
          <MetricCard label="Active" value={stats.active} icon={Activity} variant="success" />
          <MetricCard label="At Risk" value={stats.atRisk} icon={AlertTriangle} variant="warning" />
          <MetricCard label="Avg Pass Rate" value={`${stats.avgPassRate}%`} icon={Target} variant="info" />
        </Grid>
      </Section>

      {/* Filters */}
      <Section>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
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

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg">
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Cards
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <LayoutList className="h-4 w-4" />
              List
            </Button>
          </div>
        </div>
      </Section>

      {/* Students List */}
      <Section>
        {isLoading ? (
          <LoadingState message="Loading students..." />
        ) : !students || students.length === 0 ? (
          <SurfaceCard variant="muted" className="py-12">
            <EmptyState
              icon={Users}
              title="No students found"
              description={
                search || courseFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add students to start tracking their progress'
              }
              action={
                !search && courseFilter === 'all' && statusFilter === 'all'
                  ? { label: 'Add Student', onClick: () => setAddDialogOpen(true) }
                  : undefined
              }
            />
          </SurfaceCard>
        ) : viewMode === 'card' ? (
          <Grid cols={3} gap="md">
            {students.map((student, index) => (
              <motion.div
                key={`${student.user_id}-${student.course_id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
              >
                <SurfaceCard
                  className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all h-full"
                  onClick={() => openStudentDetails(student)}
                >
                  <Stack gap="md">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarImage src={getImageUrl(student.avatar_url)} />
                          <AvatarFallback className="text-lg">
                            {student.user_name?.charAt(0) || student.user_email?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base mb-1 truncate">
                            {student.user_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {student.is_guest 
                              ? `via ${student.practice_link_title || student.practice_link_code}`
                              : student.user_email
                            }
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={student.status} />
                    </div>

                    <Separator />

                    {/* Course */}
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground truncate">{student.course_title}</span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Pass Rate</div>
                        <div className={`text-2xl font-bold ${
                          student.pass_rate >= 70 ? 'text-green-600' : 
                          student.pass_rate >= 50 ? 'text-yellow-600' : 
                          'text-orange-600'
                        }`}>
                          {student.pass_rate}%
                        </div>
                        <Progress value={student.pass_rate} className="h-1.5 mt-2" />
                      </div>
                      
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">7d Activity</div>
                        <div className={`text-2xl font-bold ${
                          student.attempts_last_7_days > 0 ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {student.attempts_last_7_days}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">attempts</div>
                      </div>
                    </div>

                    {/* Last Activity */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Last active</span>
                      </div>
                      <span className="font-medium">{safeFormatDistanceToNow(student.last_activity)}</span>
                    </div>

                    {student.is_guest && (
                      <Badge variant="outline" className="w-fit text-xs">Guest Student</Badge>
                    )}
                  </Stack>
                </SurfaceCard>
              </motion.div>
            ))}
          </Grid>
        ) : (
          <Stack gap="sm">
            {students.map((student, index) => (
              <motion.div
                key={`${student.user_id}-${student.course_id}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <SurfaceCard
                  className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                  onClick={() => openStudentDetails(student)}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={getImageUrl(student.avatar_url)} />
                      <AvatarFallback>
                        {student.user_name?.charAt(0) || student.user_email?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-2 mb-0.5">
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
                    
                    <div className="hidden sm:block shrink-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span>{student.course_title}</span>
                      </div>
                    </div>
                    
                    <div className="text-center shrink-0 hidden md:block">
                      <p className="text-sm text-muted-foreground mb-1">Last active</p>
                      <p className="text-sm font-medium">
                        {safeFormatDistanceToNow(student.last_activity)}
                      </p>
                    </div>
                    
                    <div className="text-center shrink-0">
                      <p className="text-sm text-muted-foreground mb-1">7d attempts</p>
                      <p className={`text-lg font-bold ${student.attempts_last_7_days > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {student.attempts_last_7_days}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Pass rate</p>
                        <p className={`text-lg font-bold ${
                          student.pass_rate >= 70 ? 'text-green-600' : 
                          student.pass_rate >= 50 ? 'text-yellow-600' : 
                          'text-orange-600'
                        }`}>
                          {student.pass_rate}%
                        </p>
                      </div>
                      <div className="w-24">
                        <Progress value={student.pass_rate} className="h-2" />
                      </div>
                    </div>
                    
                    <StatusBadge status={student.status} />
                  </div>
                </SurfaceCard>
              </motion.div>
            ))}
          </Stack>
        )}
      </Section>

      {/* Legend */}
      <Section>
        <InfoPanel icon={AlertTriangle} title="Student Status Guide">
          <ul className="text-sm space-y-1">
            <li><span className="font-medium text-green-600">Active:</span> Practiced within the last 7 days</li>
            <li><span className="font-medium text-orange-600">At Risk:</span> Low pass rate (&lt;50%) or no activity for 7+ days</li>
            <li><span className="font-medium text-gray-500">Inactive:</span> No activity for 14+ days</li>
          </ul>
        </InfoPanel>
      </Section>

      {/* Add Student Modal */}
      <ModalLayout
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        title="Add New Student"
        description="Enter student's name and select a course. Login credentials will be generated automatically."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent} disabled={createStudentMutation.isPending}>
              {createStudentMutation.isPending ? 'Creating...' : 'Create Student'}
            </Button>
          </>
        }
      >
        <Stack gap="md">
          <div className="space-y-2">
            <LabelText required>Full Name</LabelText>
            <Input
              placeholder="Enter student's full name"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <LabelText required>Course</LabelText>
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
        </Stack>
      </ModalLayout>

      {/* Credentials Modal */}
      <ModalLayout
        open={credentialsDialogOpen}
        onClose={() => setCredentialsDialogOpen(false)}
        title="Student Created Successfully"
        description="Share these credentials with the student. They can use them to log in."
        size="md"
        footer={
          <Button onClick={() => {
            setCredentialsDialogOpen(false)
            setGeneratedCredentials(null)
          }}>
            Done
          </Button>
        }
      >
        {generatedCredentials && (
          <Stack gap="md">
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
            <InfoPanel variant="warning">
              <strong>Important:</strong> Save these credentials now. The password cannot be retrieved later.
            </InfoPanel>
          </Stack>
        )}
      </ModalLayout>
    </PageShell>
  )
}
