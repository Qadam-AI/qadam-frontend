'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, Play, XCircle, CheckCircle2, Users, FileText, 
  Clock, Calendar, Copy, Download, Send, Edit2
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion } from 'framer-motion'

// Design System
import { PageShell, Section, Stack, Grid } from '@/design-system/layout'
import { SurfaceCard, MetricCard, InfoPanel } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'
import { DrawerLayout } from '@/design-system/patterns/drawer-layout'
import { ModalLayout } from '@/design-system/patterns/modal-layout'

interface AssessmentRun {
  id: string
  template_id: string
  course_id: string
  title_override?: string
  status: string
  starts_at?: string
  ends_at?: string
  duration_minutes?: number
  access_mode: string
  public_code?: string
  created_at: string
}

interface GradebookEntry {
  student_user_id?: string
  student_name: string
  guest_id?: string
  attempt_id?: string
  status: string
  started_at?: string
  submitted_at?: string
  score?: number
  max_score?: number
  percent?: number
  passed?: boolean
}

interface AttemptDetail {
  id: string
  status: string
  started_at?: string
  submitted_at?: string
  time_spent_seconds: number
  questions: QuestionWithAnswer[]
  total_score?: number
  max_score?: number
  percent?: number
}

interface QuestionWithAnswer {
  question_id: string
  question_type: string
  question_text: string
  options?: any[]
  points: number
  answer_json?: any
  correct_answer?: string
  graded: boolean
  score?: number
  feedback?: string
}

export default function RunDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const runId = params.runId as string

  const [activeTab, setActiveTab] = useState('overview')
  const [selectedAttempt, setSelectedAttempt] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)

  // Fetch run
  const { data: run, isLoading } = useQuery({
    queryKey: ['assessment-run', runId],
    queryFn: async () => {
      const res = await api.get<AssessmentRun>(`/instructor/assessments/runs/${runId}`)
      return res.data
    }
  })

  // Fetch gradebook
  const { data: gradebook } = useQuery({
    queryKey: ['gradebook', runId],
    queryFn: async () => {
      const res = await api.get<{ run_id: string; run_title: string; entries: GradebookEntry[] }>(
        `/instructor/assessments/runs/${runId}/gradebook`
      )
      return res.data
    }
  })

  // Fetch attempt detail when selected
  const { data: attemptDetail } = useQuery({
    queryKey: ['attempt-detail', selectedAttempt],
    queryFn: async () => {
      if (!selectedAttempt) return null
      const res = await api.get<AttemptDetail>(`/instructor/assessments/attempts/${selectedAttempt}`)
      return res.data
    },
    enabled: !!selectedAttempt
  })

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/instructor/assessments/runs/${runId}/publish`)
    },
    onSuccess: () => {
      toast.success('Assessment published')
      queryClient.invalidateQueries({ queryKey: ['assessment-run', runId] })
    }
  })

  // Close mutation
  const closeMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/instructor/assessments/runs/${runId}/close`)
    },
    onSuccess: () => {
      toast.success('Assessment closed')
      queryClient.invalidateQueries({ queryKey: ['assessment-run', runId] })
    }
  })

  // Release results mutation
  const releaseMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/instructor/assessments/runs/${runId}/release-results`)
    },
    onSuccess: () => {
      toast.success('Results released to students')
      queryClient.invalidateQueries({ queryKey: ['gradebook', runId] })
    }
  })

  // Assign all mutation
  const assignAllMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/instructor/assessments/runs/${runId}/assign-all?course_id=${run?.course_id}`)
    },
    onSuccess: () => {
      toast.success('Assigned to all students')
      queryClient.invalidateQueries({ queryKey: ['gradebook', runId] })
    }
  })

  // Manual grade mutation
  const gradeMutation = useMutation({
    mutationFn: async ({ answerId, score, feedback }: { answerId: string; score: number; feedback?: string }) => {
      await api.post(`/instructor/assessments/attempts/${selectedAttempt}/grade-short-answer`, {
        answer_id: answerId,
        score,
        feedback
      })
    },
    onSuccess: () => {
      toast.success('Answer graded')
      queryClient.invalidateQueries({ queryKey: ['attempt-detail', selectedAttempt] })
      queryClient.invalidateQueries({ queryKey: ['gradebook', runId] })
    }
  })

  if (isLoading) {
    return (
      <PageShell maxWidth="2xl">
        <LoadingState message="Loading assessment..." />
      </PageShell>
    )
  }

  if (!run) {
    return (
      <PageShell maxWidth="lg">
        <EmptyState icon={FileText} title="Assessment not found" />
      </PageShell>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      draft: { className: 'bg-gray-500', label: 'Draft' },
      scheduled: { className: 'bg-yellow-600', label: 'Scheduled' },
      live: { className: 'bg-green-600', label: 'Live' },
      closed: { className: 'bg-gray-600', label: 'Closed' },
      graded: { className: 'bg-purple-600', label: 'Graded' }
    }
    const variant = variants[status] || variants.draft
    return <Badge className={variant.className}>{variant.label}</Badge>
  }

  const copyPublicLink = () => {
    if (run.public_code) {
      const link = `${window.location.origin}/exam/${run.public_code}`
      navigator.clipboard.writeText(link)
      toast.success('Link copied to clipboard')
    }
  }

  const copyTelegramMessage = () => {
    if (run.public_code) {
      const link = `${window.location.origin}/exam/${run.public_code}`
      const message = `📝 New Assessment Available!\n\n${run.title_override || 'Assessment'}\nCode: ${run.public_code}\nLink: ${link}`
      navigator.clipboard.writeText(message)
      toast.success('Message copied to clipboard')
    }
  }

  const stats = gradebook ? {
    total: gradebook.entries.length,
    submitted: gradebook.entries.filter(e => e.status === 'submitted' || e.status === 'graded').length,
    graded: gradebook.entries.filter(e => e.status === 'graded').length,
    avgScore: gradebook.entries.filter(e => e.percent !== null).length > 0
      ? gradebook.entries.filter(e => e.percent !== null).reduce((sum, e) => sum + (e.percent || 0), 0) / gradebook.entries.filter(e => e.percent !== null).length
      : null
  } : null

  return (
    <PageShell maxWidth="2xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Link href="/instructor/assessments-hub?tab=runs">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Runs
            </Button>
          </Link>
          
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <Heading level={1}>{run.title_override || 'Assessment Run'}</Heading>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(run.status)}
                {run.access_mode === 'public_link' && run.public_code && (
                  <Badge variant="secondary" className="gap-1">
                    <Copy className="h-3 w-3" />
                    {run.public_code}
                  </Badge>
                )}
              </div>
            </div>

            {/* Primary action by status */}
            <div className="flex items-center gap-2">
              {run.status === 'draft' && (
                <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending} className="gap-2">
                  <Play className="h-4 w-4" />
                  Publish
                </Button>
              )}
              {run.status === 'live' && (
                <Button onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending} variant="destructive" className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Close Now
                </Button>
              )}
              {run.status === 'closed' && (
                <Button onClick={() => releaseMutation.mutate()} disabled={releaseMutation.isPending} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Release Results
                </Button>
              )}
            </div>
          </div>

          {/* Quick stats */}
          {stats && (
            <Grid cols={4} gap="sm">
              <MetricCard label="Assigned" value={stats.total} icon={Users} variant="default" />
              <MetricCard label="Submitted" value={stats.submitted} icon={CheckCircle2} variant="success" />
              <MetricCard label="Graded" value={stats.graded} icon={FileText} variant="info" />
              {stats.avgScore !== null && (
                <MetricCard label="Avg Score" value={`${Math.round(stats.avgScore)}%`} icon={CheckCircle2} variant="default" />
              )}
            </Grid>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="gradebook">Gradebook</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <Stack gap="md">
              <SurfaceCard>
                <Stack gap="md">
                  <Heading level={3}>Assessment Details</Heading>
                  
                  {run.starts_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Text>Starts: {new Date(run.starts_at).toLocaleString()}</Text>
                    </div>
                  )}
                  
                  {run.ends_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Text>Ends: {new Date(run.ends_at).toLocaleString()}</Text>
                    </div>
                  )}
                  
                  {run.duration_minutes && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Text>Time Limit: {run.duration_minutes} minutes</Text>
                    </div>
                  )}
                </Stack>
              </SurfaceCard>

              {run.access_mode === 'public_link' && run.public_code && (
                <InfoPanel icon={Copy} title="Public Link" variant="info">
                  <Stack gap="sm">
                    <Text size="sm">Share this link with students:</Text>
                    <div className="font-mono text-sm bg-muted p-2 rounded">
                      {window.location.origin}/exam/{run.public_code}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={copyPublicLink} className="gap-2">
                        <Copy className="h-3.5 w-3.5" />
                        Copy Link
                      </Button>
                      <Button size="sm" variant="outline" onClick={copyTelegramMessage} className="gap-2">
                        <Send className="h-3.5 w-3.5" />
                        Copy for Telegram
                      </Button>
                    </div>
                  </Stack>
                </InfoPanel>
              )}
            </Stack>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="mt-6">
            <SurfaceCard>
              <Stack gap="md">
                <div className="flex items-center justify-between">
                  <Heading level={3}>Student Assignments</Heading>
                  {run.access_mode === 'assigned' && (
                    <Button size="sm" onClick={() => assignAllMutation.mutate()} disabled={assignAllMutation.isPending}>
                      <Users className="h-4 w-4 mr-2" />
                      Assign All Students
                    </Button>
                  )}
                </div>

                {run.access_mode === 'public_link' ? (
                  <Text variant="muted">This is a public link assessment. Anyone with the link can join.</Text>
                ) : (
                  <Text variant="muted">{gradebook?.entries.length || 0} students assigned</Text>
                )}
              </Stack>
            </SurfaceCard>
          </TabsContent>

          {/* Gradebook Tab */}
          <TabsContent value="gradebook" className="mt-6">
            {!gradebook || gradebook.entries.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Submissions Yet"
                description="Students haven't submitted any attempts yet."
              />
            ) : (
              <SurfaceCard>
                <Stack gap="sm">
                  <div className="flex items-center justify-between mb-4">
                    <Heading level={3}>Submissions</Heading>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => {
                        const url = `/api/v1/instructor/assessments/runs/${runId}/gradebook/export`
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `gradebook_${runId}.csv`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        toast.success('Exporting gradebook...')
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>

                  {gradebook.entries.map((entry, index) => (
                    <motion.div
                      key={entry.attempt_id || index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <SurfaceCard
                        variant="muted"
                        className={entry.attempt_id ? 'cursor-pointer hover:shadow-md transition-all' : ''}
                        onClick={() => entry.attempt_id && setSelectedAttempt(entry.attempt_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Text className="font-medium">{entry.student_name}</Text>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <Badge variant="secondary" className="text-xs">
                                {entry.status}
                              </Badge>
                              {entry.submitted_at && (
                                <span>{new Date(entry.submitted_at).toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                          
                          {entry.percent !== null && entry.percent !== undefined && (
                            <div className="text-right">
                              <Text className="text-2xl font-bold text-primary">
                                {Math.round(entry.percent)}%
                              </Text>
                              {entry.score !== null && (
                                <Text size="sm" variant="muted">
                                  {entry.score?.toFixed(1)} / {entry.max_score?.toFixed(1)}
                                </Text>
                              )}
                            </div>
                          )}
                        </div>
                      </SurfaceCard>
                    </motion.div>
                  ))}
                </Stack>
              </SurfaceCard>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Attempt Detail Drawer */}
      <DrawerLayout
        open={!!selectedAttempt && !!attemptDetail}
        onClose={() => setSelectedAttempt(null)}
        title="Attempt Details"
        size="lg"
      >
        {attemptDetail && (
          <Stack gap="lg">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-2xl font-bold text-primary">
                  {attemptDetail.percent !== null ? `${Math.round(attemptDetail.percent)}%` : 'Grading...'}
                </Text>
                {attemptDetail.total_score !== null && (
                  <Text size="sm" variant="muted">
                    {attemptDetail.total_score.toFixed(1)} / {attemptDetail.max_score?.toFixed(1)} points
                  </Text>
                )}
              </div>
              <Badge variant="secondary">{attemptDetail.status}</Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              <div>Started: {attemptDetail.started_at ? new Date(attemptDetail.started_at).toLocaleString() : 'N/A'}</div>
              <div>Time spent: {Math.round(attemptDetail.time_spent_seconds / 60)} minutes</div>
            </div>

            <div>
              <Heading level={4} className="mb-3">Questions & Answers</Heading>
              <Stack gap="sm">
                {attemptDetail.questions.map((q, idx) => (
                  <SurfaceCard key={q.question_id} variant="muted">
                    <Stack gap="sm">
                      <div className="flex items-start justify-between gap-2">
                        <Text className="font-medium">Q{idx + 1}: {q.question_text}</Text>
                        <Badge variant={q.graded ? (q.score === q.points ? 'default' : 'secondary') : 'outline'}>
                          {q.graded ? `${q.score}/${q.points}` : 'Not graded'}
                        </Badge>
                      </div>

                      {q.answer_json && (
                        <div>
                          <LabelText>Student Answer:</LabelText>
                          <Text>{JSON.stringify(q.answer_json)}</Text>
                        </div>
                      )}

                      {!q.graded && q.question_type !== 'mcq' && (
                        <ManualGradeForm
                          questionId={q.question_id}
                          maxPoints={q.points}
                          onGrade={(score, feedback) => {
                            // This would need the answer_id which isn't in the schema
                            // For now, show placeholder
                            toast.info('Manual grading UI - implement with answer_id')
                          }}
                        />
                      )}

                      {q.feedback && (
                        <div>
                          <LabelText>Feedback:</LabelText>
                          <Text size="sm">{q.feedback}</Text>
                        </div>
                      )}
                    </Stack>
                  </SurfaceCard>
                ))}
              </Stack>
            </div>
          </Stack>
        )}
      </DrawerLayout>
    </PageShell>
  )
}

// Manual grading form component
function ManualGradeForm({ questionId, maxPoints, onGrade }: { 
  questionId: string
  maxPoints: number
  onGrade: (score: number, feedback?: string) => void 
}) {
  const [score, setScore] = useState<number>(maxPoints)
  const [feedback, setFeedback] = useState('')

  return (
    <div className="border-t pt-3 mt-3">
      <Stack gap="sm">
        <div>
          <LabelText>Score (0-{maxPoints})</LabelText>
          <Input
            type="number"
            min={0}
            max={maxPoints}
            step={0.5}
            value={score}
            onChange={(e) => setScore(parseFloat(e.target.value))}
          />
        </div>
        <div>
          <LabelText>Feedback (optional)</LabelText>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            placeholder="Provide feedback to the student..."
          />
        </div>
        <Button size="sm" onClick={() => onGrade(score, feedback || undefined)}>
          <Edit2 className="h-3.5 w-3.5 mr-2" />
          Grade Answer
        </Button>
      </Stack>
    </div>
  )
}
