'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { 
  Target, 
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Lightbulb,
  BookOpen,
  ChevronRight,
  Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState, useMemo } from 'react'
import { Separator } from '@/components/ui/separator'

interface ConceptAnalytics {
  concept_id: string
  concept_name: string
  course_id: string
  course_title: string
  total_students: number
  students_with_attempts: number
  struggling_count: number
  struggling_percentage: number
  avg_pass_rate: number
  total_attempts: number
}

interface StrugglingStudent {
  user_id: string
  user_name: string
  user_email: string
  avatar_url?: string
  total_attempts: number
  passed_attempts: number
  pass_rate: number
}

interface ConceptDetails {
  concept_id: string
  concept_name: string
  struggling_students: StrugglingStudent[]
}

interface StudentConceptPerformance {
  concept_id: string
  concept_name: string
  course_title: string
  total_attempts: number
  passed_attempts: number
  pass_rate: number
  status: 'not-started' | 'weak' | 'ok' | 'strong'
  last_attempt: string | null
}

interface Course {
  id: string
  title: string
}

interface StudentForDropdown {
  user_id: string
  user_name: string
  user_email: string
}

function StatusBadge({ status }: { status: 'not-started' | 'weak' | 'ok' | 'strong' }) {
  switch (status) {
    case 'strong':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Strong</Badge>
    case 'ok':
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">OK</Badge>
    case 'weak':
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Weak</Badge>
    default:
      return <Badge variant="outline">Not Started</Badge>
  }
}

export default function MasteryOverview() {
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null)
  const [conceptSheetOpen, setConceptSheetOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [studentSearch, setStudentSearch] = useState('')

  const { data: courses } = useQuery<Course[]>({
    queryKey: ['instructor-courses-list'],
    queryFn: async () => {
      const res = await api.get('/instructor/courses')
      return Array.isArray(res.data) ? res.data : (res.data?.courses || [])
    },
  })

  const { data: conceptAnalytics, isLoading: loadingConcepts } = useQuery<ConceptAnalytics[]>({
    queryKey: ['instructor-concept-analytics', selectedCourse],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (selectedCourse !== 'all') params.course_id = selectedCourse
      const res = await api.get('/instructor/analytics/concepts', { params })
      return Array.isArray(res.data) ? res.data : []
    },
  })

  const { data: conceptDetails, isLoading: loadingConceptDetails } = useQuery<ConceptDetails>({
    queryKey: ['concept-struggling-students', selectedConceptId],
    queryFn: async () => {
      if (!selectedConceptId) return null
      const res = await api.get(`/instructor/analytics/concepts/${selectedConceptId}/students`)
      return res.data
    },
    enabled: !!selectedConceptId && conceptSheetOpen,
  })

  const { data: students } = useQuery<StudentForDropdown[]>({
    queryKey: ['instructor-students-dropdown', selectedCourse],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (selectedCourse !== 'all') params.course_id = selectedCourse
      const res = await api.get('/instructor/analytics/students', { params })
      const data = Array.isArray(res.data) ? res.data : []
      const unique = new Map()
      data.forEach((s: any) => {
        if (!unique.has(s.user_id)) {
          unique.set(s.user_id, { user_id: s.user_id, user_name: s.user_name, user_email: s.user_email })
        }
      })
      return Array.from(unique.values())
    },
  })

  const { data: studentConceptPerformance, isLoading: loadingStudentPerformance } = useQuery<StudentConceptPerformance[]>({
    queryKey: ['student-concept-performance', selectedStudentId, selectedCourse],
    queryFn: async () => {
      if (!selectedStudentId) return []
      const params: Record<string, string> = {}
      if (selectedCourse !== 'all') params.course_id = selectedCourse
      const res = await api.get(`/instructor/analytics/students/${selectedStudentId}/concepts`, { params })
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: !!selectedStudentId,
  })

  const filteredStudents = useMemo(() => {
    if (!students) return []
    if (!studentSearch) return students
    const search = studentSearch.toLowerCase()
    return students.filter(s => 
      s.user_name?.toLowerCase().includes(search) || 
      s.user_email?.toLowerCase().includes(search)
    )
  }, [students, studentSearch])

  const stats = useMemo(() => {
    if (!conceptAnalytics || conceptAnalytics.length === 0) {
      return { totalConcepts: 0, avgPassRate: 0, strugglingConcepts: 0, totalAttempts: 0 }
    }
    
    const totalConcepts = conceptAnalytics.length
    const avgPassRate = conceptAnalytics.reduce((sum, c) => sum + c.avg_pass_rate, 0) / totalConcepts
    const strugglingConcepts = conceptAnalytics.filter(c => c.struggling_percentage > 30).length
    const totalAttempts = conceptAnalytics.reduce((sum, c) => sum + c.total_attempts, 0)
    
    return { 
      totalConcepts, 
      avgPassRate: Math.round(avgPassRate), 
      strugglingConcepts,
      totalAttempts
    }
  }, [conceptAnalytics])

  const openConceptDetails = (conceptId: string) => {
    setSelectedConceptId(conceptId)
    setConceptSheetOpen(true)
  }

  if (loadingConcepts) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Classroom Understanding</h1>
          <p className="text-muted-foreground text-lg">See where your class is confident and where they need more help</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-none shadow-none bg-muted/30">
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-none shadow-sm">
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
          Classroom Understanding
        </h1>
        <p className="text-muted-foreground text-lg mt-1">
          Identifies concepts that may need re-teaching or more practice materials.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-transparent border-green-100 dark:border-green-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Confident Concepts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-900 dark:text-green-100">
              {conceptAnalytics?.filter(c => c.avg_pass_rate >= 70).length || 0}
            </div>
            <p className="text-sm text-green-700/80 dark:text-green-400 mt-1">
              Class understands well
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/10 dark:to-transparent border-orange-100 dark:border-orange-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Needs Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-900 dark:text-orange-100">{stats.strugglingConcepts}</div>
            <p className="text-sm text-orange-700/80 dark:text-orange-400 mt-1">
              Concepts causing confusion
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-900/20 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total Concepts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{stats.totalConcepts}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Across all selected courses
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
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
      </div>

      <Tabs defaultValue="concepts" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="concepts" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Concepts
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students
          </TabsTrigger>
        </TabsList>

        <TabsContent value="concepts">
          <Card className="border-none shadow-sm">
            <CardHeader className="pl-0">
              <CardTitle className="text-xl">Concept Performance</CardTitle>
              <CardDescription className="text-base">Identify which topics are landing and which need review</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="rounded-md border-none">
                <Table>
                  <TableHeader className="bg-transparent/5">
                    <TableRow className="border-b border-border/50 hover:bg-transparent">
                      <TableHead className="font-semibold text-foreground pl-0">Concept</TableHead>
                      <TableHead className="font-medium text-muted-foreground">Course</TableHead>
                      <TableHead className="font-medium text-muted-foreground text-center">Class Confusion</TableHead>
                      <TableHead className="font-medium text-muted-foreground text-center">Understanding</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!conceptAnalytics || conceptAnalytics.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                          <div className="flex flex-col items-center gap-4">
                            <div className="p-4 rounded-full bg-muted/30">
                              <Lightbulb className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                            <div>
                              <p className="font-medium text-lg text-foreground">No concept data available</p>
                              <p className="text-muted-foreground mt-1">Once students start practicing, understanding trends will appear here.</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      conceptAnalytics.map((concept) => (
                        <TableRow 
                          key={concept.concept_id}
                          className="cursor-pointer hover:bg-muted/30 border-b border-border/40"
                          onClick={() => openConceptDetails(concept.concept_id)}
                        >
                          <TableCell className="pl-0">
                            <div className="font-medium text-base text-foreground">{concept.concept_name}</div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{concept.course_title}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {concept.struggling_percentage > 30 ? (
                                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100">
                                  {concept.struggling_percentage}% Confused
                                </Badge>
                              ) : concept.struggling_count > 0 ? (
                                <span className="text-sm text-muted-foreground">{concept.struggling_percentage}%</span>
                              ) : (
                                <span className="text-sm text-green-600/70">Clear</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-3">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${concept.avg_pass_rate >= 70 ? 'bg-green-500' : concept.avg_pass_rate >= 50 ? 'bg-yellow-500' : 'bg-orange-500'}`} 
                                  style={{ width: `${concept.avg_pass_rate}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium w-8 text-right ${concept.avg_pass_rate >= 70 ? 'text-green-700' : 'text-foreground'}`}>
                                {concept.avg_pass_rate}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="text-muted-foreground/50 hover:text-foreground">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Concept Performance
              </CardTitle>
              <CardDescription>View per-concept performance for individual students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.map((student) => (
                      <SelectItem key={student.user_id} value={student.user_id}>
                        {student.user_name || student.user_email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!selectedStudentId ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="font-medium">Select a student to view their concept performance</p>
                </div>
              ) : loadingStudentPerformance ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concept</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead className="text-center">Attempts</TableHead>
                      <TableHead className="text-center">Pass Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Attempt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!studentConceptPerformance || studentConceptPerformance.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No concept data for this student
                        </TableCell>
                      </TableRow>
                    ) : (
                      studentConceptPerformance.map((concept) => (
                        <TableRow key={concept.concept_id}>
                          <TableCell className="font-medium">{concept.concept_name}</TableCell>
                          <TableCell className="text-muted-foreground">{concept.course_title}</TableCell>
                          <TableCell className="text-center">
                            {concept.total_attempts > 0 ? (
                              <span>{concept.passed_attempts}/{concept.total_attempts}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {concept.total_attempts > 0 ? (
                              <div className="flex items-center justify-center gap-2">
                                <Progress value={concept.pass_rate} className="w-16 h-2" />
                                <span className={`text-sm font-medium ${concept.pass_rate >= 75 ? 'text-green-600' : concept.pass_rate >= 50 ? 'text-yellow-600' : 'text-orange-600'}`}>
                                  {concept.pass_rate}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={concept.status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {concept.last_attempt 
                              ? formatDistanceToNow(new Date(concept.last_attempt), { addSuffix: true })
                              : 'Never'
                            }
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={conceptSheetOpen} onOpenChange={setConceptSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          {loadingConceptDetails ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-6 w-48" />
                </SheetTitle>
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-4 w-full" />
                </div>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </>
          ) : conceptDetails ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  {conceptDetails.concept_name}
                </SheetTitle>
                <SheetDescription>
                  Students struggling with this concept (pass rate &lt; 50%)
                </SheetDescription>
              </SheetHeader>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Struggling Students ({conceptDetails.struggling_students.length})
                </h3>
                
                {conceptDetails.struggling_students.length === 0 ? (
                  <div className="text-sm text-muted-foreground bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="font-medium text-green-700 dark:text-green-400">All students are doing well!</p>
                    <p className="text-green-600 dark:text-green-500">No students are struggling with this concept</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conceptDetails.struggling_students.map((student) => (
                      <div 
                        key={student.user_id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatar_url} />
                            <AvatarFallback>
                              {student.user_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{student.user_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {student.passed_attempts}/{student.total_attempts} passed
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-orange-600">
                          {student.pass_rate}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Unable to load concept details
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Understanding This Data</h4>
              <p className="text-sm text-muted-foreground">
                Students are marked as &quot;struggling&quot; when their pass rate on a concept falls below 50%. 
                Use this data to identify concepts that need more explanation or practice materials.
                Click on any concept to see the list of students who need extra help.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
