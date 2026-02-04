'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Target, 
  Search,
  AlertTriangle,
  CheckCircle2,
  Users,
  Lightbulb,
  BookOpen,
  GitBranch,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslations } from '@/lib/i18n'

// Design System
import { PageShell, PageHeader, Section, Grid, Stack } from '@/design-system/layout'
import { MetricCard, SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { EmptyState, LoadingState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'

// Import concept map components
import { StudentPerformanceMap } from './components/StudentPerformanceMap'
import { ConceptPerformanceList } from './components/ConceptPerformanceList'

interface Course {
  id: string
  title: string
}

interface Student {
  user_id: string
  user_name: string
  user_email: string
}

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

export default function MasteryOverviewPage() {
  const tPilot = useTranslations('pilotUnderstanding')
  const [activeTab, setActiveTab] = useState('concepts')
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [studentCourse, setStudentCourse] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch courses
  const { data: courses } = useQuery<Course[]>({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const res = await api.get('/instructor/courses')
      return res.data
    },
  })

  // Fetch students for selected course
  const { data: students } = useQuery<Student[]>({
    queryKey: ['course-students', selectedCourse],
    queryFn: async () => {
      if (selectedCourse === 'all') {
        const res = await api.get('/instructor/students')
        return res.data
      }
      const res = await api.get(`/instructor/courses/${selectedCourse}/students`)
      return res.data
    },
    enabled: activeTab === 'students',
  })

  // Fetch concept analytics (for "By Concept" tab)
  const { data: conceptAnalytics, isLoading: loadingConcepts } = useQuery<ConceptAnalytics[]>({
    queryKey: ['concept-analytics', selectedCourse],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedCourse !== 'all') {
        params.append('course_id', selectedCourse)
      }
      const res = await api.get(`/instructor/analytics/concepts?${params}`)
      return res.data
    },
    enabled: activeTab === 'concepts',
  })

  // Filter concepts by search
  const filteredConcepts = useMemo(() => {
    if (!conceptAnalytics) return []
    if (!searchTerm) return conceptAnalytics
    return conceptAnalytics.filter(c => 
      c.concept_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.course_title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [conceptAnalytics, searchTerm])

  // Calculate stats
  const stats = useMemo(() => {
    if (!conceptAnalytics) return { struggling: 0, confident: 0, total: 0 }
    return {
      struggling: conceptAnalytics.filter(c => c.struggling_percentage > 30).length,
      confident: conceptAnalytics.filter(c => c.avg_pass_rate >= 70).length,
      total: conceptAnalytics.length,
    }
  }, [conceptAnalytics])

  return (
    <PageShell maxWidth="full">
      <PageHeader
        title={tPilot('title')}
        description={tPilot('description')}
      />

      {/* KPI Metrics */}
      <Section>
        <Grid cols={4} gap="md">
          <MetricCard
            label={tPilot('confidentConcepts')}
            value={stats.confident}
            icon={CheckCircle2}
            variant="success"
            trend={{ value: `${stats.total} total`, positive: true }}
          />
          <MetricCard
            label="Needs Attention"
            value={stats.struggling}
            icon={AlertTriangle}
            variant="warning"
            trend={stats.struggling > 0 ? { value: 'Review needed', positive: false } : undefined}
          />
          <MetricCard
            label="Active Students"
            value={students?.length || 0}
            icon={Users}
            variant="info"
          />
          <MetricCard
            label="Total Concepts"
            value={stats.total}
            icon={Lightbulb}
            variant="default"
          />
        </Grid>
      </Section>

      {/* Main Tabs */}
      <Section>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="concepts" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              By Concept
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              By Student
            </TabsTrigger>
          </TabsList>

          {/* By Concept Tab */}
          <TabsContent value="concepts" className="space-y-6">
            <div className="flex items-center gap-4">
              {/* Course filter */}
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-[280px]">
                  <BookOpen className="h-4 w-4 mr-2" />
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

              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search concepts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {loadingConcepts ? (
              <LoadingState message="Loading concept performance..." />
            ) : !filteredConcepts || filteredConcepts.length === 0 ? (
              <SurfaceCard variant="muted" className="py-12">
                <EmptyState
                  icon={Lightbulb}
                  title="No concept data available"
                  description={searchTerm ? "No concepts match your search" : "Once students start practicing, performance data will appear here."}
                />
              </SurfaceCard>
            ) : (
              <ConceptPerformanceList concepts={filteredConcepts} />
            )}
          </TabsContent>

          {/* By Student Tab */}
          <TabsContent value="students" className="space-y-6">
            {/* Student Selection */}
            <SurfaceCard>
              <Stack gap="lg">
                <div>
                  <Heading level={4} className="mb-2">Select Student</Heading>
                  <Text variant="muted" className="text-sm">
                    Choose a student to visualize their understanding across concepts
                  </Text>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Student selector */}
                  <div>
                    <LabelText className="mb-2">Student</LabelText>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger>
                        <Users className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Choose a student..." />
                      </SelectTrigger>
                      <SelectContent>
                        {!students || students.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No students found
                          </div>
                        ) : (
                          students.map((student) => (
                            <SelectItem key={student.user_id} value={student.user_id}>
                              <div className="flex flex-col">
                                <span>{student.user_name}</span>
                                <span className="text-xs text-muted-foreground">{student.user_email}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Course selector */}
                  <div>
                    <LabelText className="mb-2">Course</LabelText>
                    <Select 
                      value={studentCourse} 
                      onValueChange={setStudentCourse}
                      disabled={!selectedStudent}
                    >
                      <SelectTrigger>
                        <BookOpen className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Choose a course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {!courses || courses.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No courses found
                          </div>
                        ) : (
                          courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedStudent && studentCourse && (
                  <InfoPanel icon={GitBranch} title="Visual Performance Map" variant="info">
                    <Text className="text-sm">
                      Concept nodes are colored by performance: 
                      <span className="text-green-600 font-medium"> Green (mastered)</span>, 
                      <span className="text-yellow-600 font-medium"> Yellow (learning)</span>, 
                      <span className="text-red-600 font-medium"> Red (struggling)</span>
                    </Text>
                  </InfoPanel>
                )}
              </Stack>
            </SurfaceCard>

            {/* Student Performance Map */}
            {selectedStudent && studentCourse ? (
              <StudentPerformanceMap
                studentId={selectedStudent}
                courseId={studentCourse}
              />
            ) : (
              <SurfaceCard variant="muted" className="py-16">
                <EmptyState
                  icon={Target}
                  title="Select a student and course"
                  description="Choose a student and course above to see their visual performance map"
                />
              </SurfaceCard>
            )}
          </TabsContent>
        </Tabs>
      </Section>
    </PageShell>
  )
}
