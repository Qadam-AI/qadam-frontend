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
import { 
  Target, 
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Users,
  Brain,
  Lightbulb,
  Filter
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState, useMemo } from 'react'

// Types
interface ConceptMastery {
  concept_id: string
  concept_name: string
  lesson_title: string
  mastered_count: number
  struggling_count: number
  not_started_count: number
  total_students: number
  mastery_rate: number
}

interface StudentMasteryOverview {
  user_id: string
  user_email: string
  user_name: string
  avatar_url?: string
  course_title: string
  total_concepts: number
  mastered_concepts: number
  struggling_concepts: number
  mastery_percentage: number
  last_activity?: string
}

interface Course {
  id: string
  title: string
}

// Mastery level badge component
function MasteryBadge({ percentage }: { percentage: number }) {
  if (percentage >= 80) {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Mastered</Badge>
  } else if (percentage >= 50) {
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Progressing</Badge>
  } else if (percentage > 0) {
    return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Struggling</Badge>
  }
  return <Badge variant="outline">Not Started</Badge>
}

export default function MasteryOverview() {
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [view, setView] = useState<'concepts' | 'students'>('concepts')

  // Fetch instructor's courses
  const { data: courses } = useQuery<Course[]>({
    queryKey: ['instructor-courses-list'],
    queryFn: async () => {
      try {
        const res = await api.get('/instructor/courses')
        return Array.isArray(res.data) ? res.data : (res.data?.courses || [])
      } catch {
        return []
      }
    },
  })

  // Fetch concept mastery data
  const { data: conceptMastery, isLoading: loadingConcepts } = useQuery<ConceptMastery[]>({
    queryKey: ['instructor-concept-mastery', selectedCourse],
    queryFn: async () => {
      try {
        const params = selectedCourse !== 'all' ? { course_id: selectedCourse } : {}
        const res = await api.get('/instructor/mastery/concepts', { params })
        return Array.isArray(res.data) ? res.data : (res.data?.concepts || [])
      } catch {
        // Return mock data for demo
        return [
          { concept_id: '1', concept_name: 'Variables & Data Types', lesson_title: 'Introduction to Python', mastered_count: 12, struggling_count: 3, not_started_count: 5, total_students: 20, mastery_rate: 60 },
          { concept_id: '2', concept_name: 'Control Flow', lesson_title: 'Conditionals & Loops', mastered_count: 8, struggling_count: 7, not_started_count: 5, total_students: 20, mastery_rate: 40 },
          { concept_id: '3', concept_name: 'Functions', lesson_title: 'Functions & Modules', mastered_count: 5, struggling_count: 4, not_started_count: 11, total_students: 20, mastery_rate: 25 },
          { concept_id: '4', concept_name: 'Lists & Dictionaries', lesson_title: 'Data Structures', mastered_count: 3, struggling_count: 2, not_started_count: 15, total_students: 20, mastery_rate: 15 },
        ]
      }
    },
  })

  // Fetch student mastery overview
  const { data: studentMastery, isLoading: loadingStudents } = useQuery<StudentMasteryOverview[]>({
    queryKey: ['instructor-student-mastery', selectedCourse, search],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {}
        if (selectedCourse !== 'all') params.course_id = selectedCourse
        if (search) params.search = search
        const res = await api.get('/instructor/mastery/students', { params })
        return Array.isArray(res.data) ? res.data : (res.data?.students || [])
      } catch {
        // Return mock data for demo
        return [
          { user_id: '1', user_email: 'alice@example.com', user_name: 'Alice Johnson', course_title: 'Python Basics', total_concepts: 10, mastered_concepts: 8, struggling_concepts: 1, mastery_percentage: 80, last_activity: '2024-01-15T10:00:00Z' },
          { user_id: '2', user_email: 'bob@example.com', user_name: 'Bob Smith', course_title: 'Python Basics', total_concepts: 10, mastered_concepts: 5, struggling_concepts: 3, mastery_percentage: 50, last_activity: '2024-01-14T15:30:00Z' },
          { user_id: '3', user_email: 'charlie@example.com', user_name: 'Charlie Brown', course_title: 'Python Basics', total_concepts: 10, mastered_concepts: 2, struggling_concepts: 5, mastery_percentage: 20, last_activity: '2024-01-13T09:00:00Z' },
        ]
      }
    },
  })

  // Calculate summary stats
  const stats = useMemo(() => {
    const concepts = conceptMastery || []
    const students = studentMastery || []
    
    const totalConcepts = concepts.length
    const avgMasteryRate = concepts.length > 0 
      ? concepts.reduce((sum, c) => sum + c.mastery_rate, 0) / concepts.length 
      : 0
    const strugglingConcepts = concepts.filter(c => c.mastery_rate < 50).length
    const totalStudents = students.length
    
    return {
      totalConcepts,
      avgMasteryRate: Math.round(avgMasteryRate),
      strugglingConcepts,
      totalStudents
    }
  }, [conceptMastery, studentMastery])

  const isLoading = loadingConcepts || loadingStudents

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mastery Overview</h1>
          <p className="text-muted-foreground">Track which concepts students have truly mastered</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Target className="h-8 w-8 text-primary" />
          Mastery Overview
        </h1>
        <p className="text-muted-foreground">Track what students actually understand, not just completion</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Concepts</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConcepts}</div>
            <p className="text-xs text-muted-foreground">Across all lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Mastery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgMasteryRate}%</div>
            <Progress value={stats.avgMasteryRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.strugglingConcepts}</div>
            <p className="text-xs text-muted-foreground">Concepts below 50% mastery</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <Button 
            variant={view === 'concepts' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setView('concepts')}
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            By Concept
          </Button>
          <Button 
            variant={view === 'students' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setView('students')}
          >
            <Users className="mr-2 h-4 w-4" />
            By Student
          </Button>
        </div>
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
        {view === 'students' && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search students..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </div>

      {/* Concept View */}
      {view === 'concepts' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Concept Mastery Breakdown
            </CardTitle>
            <CardDescription>See which concepts students are mastering and where they need help</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concept</TableHead>
                  <TableHead>Lesson</TableHead>
                  <TableHead className="text-center">Mastered</TableHead>
                  <TableHead className="text-center">Struggling</TableHead>
                  <TableHead className="text-center">Not Started</TableHead>
                  <TableHead>Mastery Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(conceptMastery || []).map((concept) => (
                  <TableRow key={concept.concept_id}>
                    <TableCell className="font-medium">{concept.concept_name}</TableCell>
                    <TableCell className="text-muted-foreground">{concept.lesson_title}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        {concept.mastered_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                        {concept.struggling_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {concept.not_started_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={concept.mastery_rate} className="w-24" />
                        <span className={`text-sm font-medium ${
                          concept.mastery_rate >= 70 ? 'text-green-600' : 
                          concept.mastery_rate >= 40 ? 'text-yellow-600' : 'text-orange-600'
                        }`}>
                          {concept.mastery_rate}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!conceptMastery || conceptMastery.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No concept data available. Add lessons with concepts to see mastery tracking.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Student View */}
      {view === 'students' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Mastery Progress
            </CardTitle>
            <CardDescription>Individual student mastery across all concepts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-center">Concepts Mastered</TableHead>
                  <TableHead className="text-center">Struggling</TableHead>
                  <TableHead>Overall Mastery</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(studentMastery || []).map((student) => (
                  <TableRow key={student.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.avatar_url} />
                          <AvatarFallback>{student.user_name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.user_name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{student.user_email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{student.course_title}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{student.mastered_concepts}/{student.total_concepts}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {student.struggling_concepts > 0 ? (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                          {student.struggling_concepts}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={student.mastery_percentage} className="w-20" />
                        <MasteryBadge percentage={student.mastery_percentage} />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {student.last_activity 
                        ? formatDistanceToNow(new Date(student.last_activity), { addSuffix: true })
                        : 'Never'
                      }
                    </TableCell>
                  </TableRow>
                ))}
                {(!studentMastery || studentMastery.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No students enrolled yet. Invite students to your courses to see their progress.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Help text */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Understanding Mastery</h4>
              <p className="text-sm text-muted-foreground">
                Students are marked as &quot;mastered&quot; when they correctly answer practice questions on a concept multiple times. 
                &quot;Struggling&quot; means they&apos;ve attempted the concept but haven&apos;t demonstrated consistent understanding. 
                Use this data to identify concepts that need more explanation or additional practice materials.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
