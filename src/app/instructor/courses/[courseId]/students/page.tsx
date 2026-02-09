'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'


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
  const courseId = params.courseId as string

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['course-students', courseId],
    queryFn: async () => {
      const res = await api.get<StudentProgress[]>(`/instructor/courses/${courseId}/students`)
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

      {/* Students List */}
      <div className="space-y-8">
        <h3 className="text-lg font-medium">Enrolled Students ({students?.length || 0})</h3>
        <div>
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
                <p className="text-sm mt-1">Share the course join code to get started.</p>
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
        </div>
      </div>
    </div>
  )
}
