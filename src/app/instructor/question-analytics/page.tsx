'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  TrendingDown, TrendingUp, Target, Clock, 
  CheckCircle, XCircle, AlertTriangle, BarChart3
} from 'lucide-react'
import { motion } from 'framer-motion'

// Design System
import { PageShell, PageHeader, Section, Stack, Grid } from '@/design-system/layout'
import { SurfaceCard, MetricCard, InfoPanel } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'

interface QuestionAnalytics {
  id: string
  question_text: string
  concept_name: string
  difficulty_tier: string
  times_shown: number
  times_correct: number
  success_rate: number
  avg_time_seconds: number
  actual_difficulty: string
}

interface AnalyticsSummary {
  total_questions: number
  total_attempts: number
  overall_success_rate: number
  most_difficult: QuestionAnalytics[]
  easiest: QuestionAnalytics[]
  slowest: QuestionAnalytics[]
  mismatched_difficulty: QuestionAnalytics[]
}

export default function QuestionAnalyticsPage() {
  const [selectedCourse, setSelectedCourse] = useState<string>('all')

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const res = await api.get<Array<{ id: string; title: string }>>('/instructor/courses')
      return res.data
    }
  })

  // Fetch analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['question-analytics', selectedCourse],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedCourse !== 'all') params.append('course_id', selectedCourse)
      
      const res = await api.get<AnalyticsSummary>(`/instructor/question-analytics?${params.toString()}`)
      return res.data
    }
  })

  const getDifficultyColor = (tier: string) => {
    switch (tier) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getPerformanceIcon = (successRate: number) => {
    if (successRate >= 70) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (successRate >= 40) return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    return <XCircle className="h-5 w-5 text-red-600" />
  }

  return (
    <PageShell maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <PageHeader
          title="Question Analytics"
          description="Analyze question performance and identify areas for improvement"
        />

        {/* Course Filter */}
        <SurfaceCard variant="muted">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <LabelText>Filter by Course</LabelText>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="bg-background mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SurfaceCard>

        {isLoading ? (
          <LoadingState message="Loading analytics..." />
        ) : !analytics ? (
          <EmptyState
            icon={BarChart3}
            title="No Data Available"
            description="No question analytics data available yet. Students need to complete some practice or assessments first."
          />
        ) : (
          <>
            {/* Summary Stats */}
            <Grid cols={4} gap="md">
              <MetricCard
                label="Total Questions"
                value={analytics.total_questions}
                icon={Target}
                variant="default"
              />
              <MetricCard
                label="Total Attempts"
                value={analytics.total_attempts}
                icon={CheckCircle}
                variant="info"
              />
              <MetricCard
                label="Avg Success Rate"
                value={`${Math.round(analytics.overall_success_rate)}%`}
                icon={analytics.overall_success_rate >= 70 ? CheckCircle : AlertTriangle}
                variant={analytics.overall_success_rate >= 70 ? 'success' : 'warning'}
              />
              <MetricCard
                label="Needs Review"
                value={analytics.mismatched_difficulty.length}
                icon={AlertTriangle}
                variant="warning"
              />
            </Grid>

            {/* Most Difficult Questions */}
            <Section
              title="Most Challenging Questions"
              description="Questions with lowest success rates (min 5 attempts)"
            >
              {analytics.most_difficult.length === 0 ? (
                <InfoPanel variant="info" title="No Data">
                  <Text size="sm">Not enough data yet. Questions need at least 5 attempts to appear here.</Text>
                </InfoPanel>
              ) : (
                <Stack gap="sm">
                  {analytics.most_difficult.map((q, index) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SurfaceCard>
                        <div className="flex items-start gap-4">
                          {getPerformanceIcon(q.success_rate)}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getDifficultyColor(q.difficulty_tier)}>
                                {q.difficulty_tier}
                              </Badge>
                              <Text size="sm" variant="muted">{q.concept_name}</Text>
                            </div>
                            
                            <Text className="font-medium mb-3">{q.question_text}</Text>
                            
                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <Text size="sm" variant="muted">Success Rate</Text>
                                  <Text size="sm" className="font-semibold text-red-600">
                                    {Math.round(q.success_rate)}%
                                  </Text>
                                </div>
                                <Progress value={q.success_rate} className="h-2" />
                              </div>
                              
                              <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                                <Target className="h-4 w-4" />
                                <span>{q.times_shown} attempts</span>
                              </div>
                              
                              {q.avg_time_seconds > 0 && (
                                <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                                  <Clock className="h-4 w-4" />
                                  <span>{Math.round(q.avg_time_seconds)}s avg</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </SurfaceCard>
                    </motion.div>
                  ))}
                </Stack>
              )}
            </Section>

            {/* Easiest Questions */}
            <Section
              title="Easiest Questions"
              description="Questions with highest success rates"
            >
              {analytics.easiest.length === 0 ? (
                <InfoPanel variant="info" title="No Data">
                  <Text size="sm">Not enough data yet.</Text>
                </InfoPanel>
              ) : (
                <Stack gap="sm">
                  {analytics.easiest.slice(0, 5).map((q, index) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SurfaceCard variant="muted">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getDifficultyColor(q.difficulty_tier)}>
                                {q.difficulty_tier}
                              </Badge>
                              <Text size="sm" variant="muted">{q.concept_name}</Text>
                            </div>
                            <Text size="sm" className="truncate">{q.question_text}</Text>
                          </div>
                          
                          <div className="flex items-center gap-4 shrink-0">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              {Math.round(q.success_rate)}% success
                            </Badge>
                            <Text size="sm" variant="muted">{q.times_shown} attempts</Text>
                          </div>
                        </div>
                      </SurfaceCard>
                    </motion.div>
                  ))}
                </Stack>
              )}
            </Section>

            {/* Difficulty Mismatch */}
            {analytics.mismatched_difficulty.length > 0 && (
              <Section
                title="Questions Needing Review"
                description="Questions where actual difficulty doesn't match assigned tier"
              >
                <InfoPanel variant="warning" title="Difficulty Mismatch Detected">
                  <Text size="sm" className="mb-3">
                    These questions may be labeled with incorrect difficulty. Consider adjusting them.
                  </Text>
                </InfoPanel>
                
                <Stack gap="sm">
                  {analytics.mismatched_difficulty.map((q, index) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SurfaceCard>
                        <div className="flex items-start gap-4">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-1" />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getDifficultyColor(q.difficulty_tier)}>
                                Marked: {q.difficulty_tier}
                              </Badge>
                              <Badge variant="outline">
                                Actual: {q.actual_difficulty}
                              </Badge>
                              <Text size="sm" variant="muted">{q.concept_name}</Text>
                            </div>
                            
                            <Text className="mb-2">{q.question_text}</Text>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{Math.round(q.success_rate)}% success</span>
                              <span>{q.times_shown} attempts</span>
                            </div>
                          </div>
                        </div>
                      </SurfaceCard>
                    </motion.div>
                  ))}
                </Stack>
              </Section>
            )}

            {/* Slowest Questions */}
            {analytics.slowest && analytics.slowest.length > 0 && (
              <Section
                title="Time-Consuming Questions"
                description="Questions taking longest to answer"
              >
                <Stack gap="sm">
                  {analytics.slowest.slice(0, 5).map((q, index) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SurfaceCard variant="muted">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getDifficultyColor(q.difficulty_tier)}>
                                {q.difficulty_tier}
                              </Badge>
                              <Text size="sm" variant="muted">{q.concept_name}</Text>
                            </div>
                            <Text size="sm" className="truncate">{q.question_text}</Text>
                          </div>
                          
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <Text className="font-semibold">{Math.round(q.avg_time_seconds)}s</Text>
                            </div>
                            <Text size="sm" variant="muted">{q.times_shown} attempts</Text>
                          </div>
                        </div>
                      </SurfaceCard>
                    </motion.div>
                  ))}
                </Stack>
              </Section>
            )}
          </>
        )}
      </motion.div>
    </PageShell>
  )
}
