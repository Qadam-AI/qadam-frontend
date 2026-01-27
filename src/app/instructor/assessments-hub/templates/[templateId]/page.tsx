'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft, Play, Edit, Archive, Copy, Trash2, Plus,
  FileText, Clock, AlertCircle, CheckCircle2, Settings, Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import Link from 'next/link'

// Design System
import { PageShell, PageHeader, Section, Grid, Stack } from '@/design-system/layout'
import { SurfaceCard, MetricCard, InfoPanel } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'
import { ModalLayout } from '@/design-system/patterns/modal-layout'

interface AssessmentTemplate {
  id: string
  course_id: string
  title: string
  description?: string
  type: string
  status: string
  time_limit_minutes?: number
  question_count: number
  allowed_question_types: string[]
  difficulty_distribution?: { easy: number; medium: number; hard: number }
  coverage_mode: string
  coverage_weights?: Record<string, number>
  randomize_questions: boolean
  randomize_options: boolean
  retake_policy: string
  max_attempts: number
  pass_threshold?: number
  show_results_mode: string
  show_correct_answers: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

interface AssessmentRun {
  id: string
  template_id: string
  course_id: string
  title_override?: string
  status: string
  starts_at?: string
  ends_at?: string
  access_mode: string
  public_code?: string
  created_at: string
}

export default function TemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const templateId = params.templateId as string

  const [editMode, setEditMode] = useState(false)
  const [showCreateRun, setShowCreateRun] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('')

  // Run creation state
  const [runTitleOverride, setRunTitleOverride] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [accessMode, setAccessMode] = useState<'assigned' | 'public_link'>('assigned')
  const [allowLateSubmissions, setAllowLateSubmissions] = useState(false)
  const [lateSubmissionEndsAt, setLateSubmissionEndsAt] = useState('')

  // Fetch template details
  const { data: template, isLoading } = useQuery({
    queryKey: ['assessment-template', templateId],
    queryFn: async () => {
      const res = await api.get<AssessmentTemplate>(`/instructor/assessments/templates/${templateId}`)
      const data = res.data
      setTitle(data.title)
      setDescription(data.description || '')
      setStatus(data.status)
      return data
    }
  })

  // Fetch runs for this template
  const { data: runs = [] } = useQuery({
    queryKey: ['template-runs', templateId],
    queryFn: async () => {
      const res = await api.get<AssessmentRun[]>(`/instructor/assessments/runs`)
      return res.data.filter(r => r.template_id === templateId)
    }
  })

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/instructor/assessments/templates/${templateId}`, {
        title,
        description,
        status
      })
    },
    onSuccess: () => {
      toast.success('Template updated')
      queryClient.invalidateQueries({ queryKey: ['assessment-template', templateId] })
      queryClient.invalidateQueries({ queryKey: ['assessment-templates'] })
      setEditMode(false)
    },
    onError: () => {
      toast.error('Failed to update template')
    }
  })

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/instructor/assessments/templates/${templateId}`)
    },
    onSuccess: () => {
      toast.success('Template deleted')
      router.push('/instructor/assessments-hub')
    },
    onError: () => {
      toast.error('Failed to delete template')
    }
  })

  // Create run mutation
  const createRunMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        template_id: templateId,
        title_override: runTitleOverride || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        access_mode: accessMode,
        allow_late_submissions: allowLateSubmissions
      }

      if (startsAt) payload.starts_at = new Date(startsAt).toISOString()
      if (endsAt) payload.ends_at = new Date(endsAt).toISOString()
      if (durationMinutes) payload.duration_minutes = parseInt(durationMinutes)
      if (allowLateSubmissions && lateSubmissionEndsAt) {
        payload.late_submission_ends_at = new Date(lateSubmissionEndsAt).toISOString()
      }

      const res = await api.post(`/instructor/assessments/runs`, payload)
      return res.data
    },
    onSuccess: (data) => {
      toast.success('Assessment run created')
      queryClient.invalidateQueries({ queryKey: ['template-runs', templateId] })
      setShowCreateRun(false)
      // Reset form
      setRunTitleOverride('')
      setStartsAt('')
      setEndsAt('')
      setDurationMinutes('')
      setAccessMode('assigned')
      setAllowLateSubmissions(false)
      setLateSubmissionEndsAt('')
      
      // Navigate to the new run
      router.push(`/instructor/assessments-hub/runs/${data.id}`)
    },
    onError: () => {
      toast.error('Failed to create run')
    }
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      draft: { className: 'bg-gray-500', label: 'Draft' },
      published: { className: 'bg-blue-600', label: 'Published' },
      archived: { className: 'bg-gray-400', label: 'Archived' }
    }
    const variant = variants[status] || variants.draft
    return <Badge className={variant.className}>{variant.label}</Badge>
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quiz: 'Quiz',
      midterm: 'Midterm',
      final: 'Final',
      mock: 'Mock Exam',
      placement: 'Placement Test',
      custom: 'Custom'
    }
    return labels[type] || type
  }

  if (isLoading) {
    return (
      <PageShell maxWidth="2xl">
        <LoadingState message="Loading template..." />
      </PageShell>
    )
  }

  if (!template) {
    return (
      <PageShell maxWidth="2xl">
        <EmptyState
          icon={AlertCircle}
          title="Template Not Found"
          description="This assessment template does not exist or you don't have access to it."
        />
      </PageShell>
    )
  }

  return (
    <PageShell maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <PageHeader
          backHref="/instructor/assessments-hub"
          title={template.title}
          description={template.description}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/instructor/assessments-hub/templates/new?duplicate=${templateId}`)}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
              <Button
                variant={editMode ? 'secondary' : 'outline'}
                onClick={() => setEditMode(!editMode)}
                className="gap-2"
              >
                {editMode ? 'Cancel' : (
                  <>
                    <Edit className="h-4 w-4" />
                    Edit
                  </>
                )}
              </Button>
              <Button onClick={() => setShowCreateRun(true)} className="gap-2">
                <Play className="h-4 w-4" />
                Create Run
              </Button>
            </div>
          }
        />

        {/* Template Info */}
        <Grid cols={3} gap="md">
          <MetricCard
            label="Type"
            value={getTypeLabel(template.type)}
            icon={FileText}
          />
          <MetricCard
            label="Questions"
            value={template.question_count}
            icon={FileText}
          />
          <MetricCard
            label="Time Limit"
            value={template.time_limit_minutes ? `${template.time_limit_minutes} min` : 'Untimed'}
            icon={Clock}
          />
        </Grid>

        {/* Edit Form */}
        {editMode && (
          <SurfaceCard>
            <Stack gap="lg">
              <Heading level={3}>Edit Template</Heading>

              <div className="space-y-2">
                <LabelText required>Title</LabelText>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter template title"
                />
              </div>

              <div className="space-y-2">
                <LabelText>Description</LabelText>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this assessment template"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <LabelText>Status</LabelText>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending || !title.trim()}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Stack>
          </SurfaceCard>
        )}

        {/* Template Settings */}
        <Section title="Configuration">
          <SurfaceCard>
            <Grid cols={2} gap="lg">
              <div>
                <Text size="sm" className="font-semibold mb-1">Allowed Question Types</Text>
                <div className="flex flex-wrap gap-2">
                  {template.allowed_question_types.map(type => (
                    <Badge key={type} variant="secondary">{type}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Text size="sm" className="font-semibold mb-1">Retake Policy</Text>
                <Text size="sm" variant="muted">{template.retake_policy} (max {template.max_attempts} attempts)</Text>
              </div>

              <div>
                <Text size="sm" className="font-semibold mb-1">Randomization</Text>
                <div className="space-y-1">
                  <Text size="sm" variant="muted">
                    Questions: {template.randomize_questions ? 'Yes' : 'No'}
                  </Text>
                  <Text size="sm" variant="muted">
                    Options: {template.randomize_options ? 'Yes' : 'No'}
                  </Text>
                </div>
              </div>

              <div>
                <Text size="sm" className="font-semibold mb-1">Results</Text>
                <Text size="sm" variant="muted">
                  Show: {template.show_results_mode}<br />
                  Answers: {template.show_correct_answers ? 'Visible' : 'Hidden'}
                </Text>
              </div>

              {template.pass_threshold && (
                <div>
                  <Text size="sm" className="font-semibold mb-1">Pass Threshold</Text>
                  <Text size="sm" variant="muted">{template.pass_threshold}%</Text>
                </div>
              )}

              {template.difficulty_distribution && (
                <div>
                  <Text size="sm" className="font-semibold mb-1">Difficulty Distribution</Text>
                  <div className="space-y-1">
                    <Text size="sm" variant="muted">
                      Easy: {(template.difficulty_distribution.easy * 100).toFixed(0)}%
                    </Text>
                    <Text size="sm" variant="muted">
                      Medium: {(template.difficulty_distribution.medium * 100).toFixed(0)}%
                    </Text>
                    <Text size="sm" variant="muted">
                      Hard: {(template.difficulty_distribution.hard * 100).toFixed(0)}%
                    </Text>
                  </div>
                </div>
              )}
            </Grid>
          </SurfaceCard>
        </Section>

        {/* Runs */}
        <Section 
          title="Assessment Runs"
          description={`${runs.length} run(s) created from this template`}
          action={
            <Button onClick={() => setShowCreateRun(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Run
            </Button>
          }
        >
          {runs.length === 0 ? (
            <EmptyState
              icon={Play}
              title="No Runs Yet"
              description="Create a run to deploy this assessment template to students."
              action={{
                label: 'Create Run',
                onClick: () => setShowCreateRun(true)
              }}
            />
          ) : (
            <Stack gap="sm">
              {runs.map(run => (
                <Link key={run.id} href={`/instructor/assessments-hub/runs/${run.id}`}>
                  <SurfaceCard className="cursor-pointer hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <Text className="font-semibold">{run.title_override || template.title}</Text>
                        <Text size="sm" variant="muted">
                          Created {new Date(run.created_at).toLocaleDateString()}
                        </Text>
                      </div>
                      <Badge>{run.status}</Badge>
                    </div>
                  </SurfaceCard>
                </Link>
              ))}
            </Stack>
          )}
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone">
          <SurfaceCard variant="destructive">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Text className="font-semibold text-destructive mb-1">Delete Template</Text>
                <Text size="sm" variant="muted">
                  This will permanently delete the template and all associated runs.
                </Text>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </SurfaceCard>
        </Section>
      </motion.div>

      {/* Create Run Modal */}
      <ModalLayout
        open={showCreateRun}
        onClose={() => setShowCreateRun(false)}
        title="Create Assessment Run"
        description="Deploy this template to students"
        size="lg"
      >
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Title Override */}
            <div className="space-y-2">
              <LabelText>Custom Title (Optional)</LabelText>
              <Input
                value={runTitleOverride}
                onChange={(e) => setRunTitleOverride(e.target.value)}
                placeholder={template.title}
              />
              <Text size="xs" variant="muted">
                Leave blank to use template title: "{template.title}"
              </Text>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <LabelText>Start Date & Time (Optional)</LabelText>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="pl-10 cursor-pointer"
                    style={{ colorScheme: 'light' }}
                  />
                </div>
                <Text size="xs" variant="muted">
                  Leave blank for immediate access
                </Text>
              </div>

              <div className="space-y-2">
                <LabelText>End Date & Time (Optional)</LabelText>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="pl-10 cursor-pointer"
                    style={{ colorScheme: 'light' }}
                  />
                </div>
                <Text size="xs" variant="muted">
                  Leave blank for no deadline
                </Text>
              </div>
            </div>

            {/* Duration Override */}
            <div className="space-y-2">
              <LabelText>Time Limit (minutes)</LabelText>
              <Input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder={template.time_limit_minutes?.toString() || 'Untimed'}
              />
              <Text size="xs" variant="muted">
                Override template time limit of {template.time_limit_minutes || 'unlimited'} minutes
              </Text>
            </div>

            {/* Access Mode */}
            <div className="space-y-2">
              <LabelText>Access Mode</LabelText>
              <Select value={accessMode} onValueChange={(v: any) => setAccessMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assigned">Assigned to Specific Students</SelectItem>
                  <SelectItem value="public_link">Public Link (Anyone with code)</SelectItem>
                </SelectContent>
              </Select>
              <Text size="xs" variant="muted">
                {accessMode === 'assigned' 
                  ? 'You can assign students after creating the run'
                  : 'A unique code will be generated for sharing'}
              </Text>
            </div>

            {/* Late Submissions */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <LabelText>Allow Late Submissions</LabelText>
                  <Text size="xs" variant="muted">
                    Accept submissions after the deadline
                  </Text>
                </div>
                <Switch
                  checked={allowLateSubmissions}
                  onCheckedChange={setAllowLateSubmissions}
                />
              </div>

              {allowLateSubmissions && (
                <div className="space-y-2">
                  <LabelText>Late Submission Deadline</LabelText>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                      type="datetime-local"
                      value={lateSubmissionEndsAt}
                      onChange={(e) => setLateSubmissionEndsAt(e.target.value)}
                      className="pl-10 cursor-pointer"
                      style={{ colorScheme: 'light' }}
                    />
                  </div>
                  <Text size="xs" variant="muted">
                    Final deadline for late submissions
                  </Text>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreateRun(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createRunMutation.mutate()}
              disabled={createRunMutation.isPending}
              className="gap-2"
            >
              {createRunMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Create Run
                </>
              )}
            </Button>
          </div>
        </div>
      </ModalLayout>

      {/* Delete Confirmation */}
      <ModalLayout
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Template"
        description="Are you sure you want to delete this template?"
      >
        <div className="p-6">
          <InfoPanel
            icon={AlertCircle}
            variant="destructive"
            title="This action cannot be undone"
            description={`This will permanently delete "${template.title}" and all ${runs.length} associated runs.`}
          />
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Template'}
            </Button>
          </div>
        </div>
      </ModalLayout>
    </PageShell>
  )
}
