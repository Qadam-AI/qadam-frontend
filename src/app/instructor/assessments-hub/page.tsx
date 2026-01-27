'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, FileText, Play, Clock, CheckCircle2, XCircle, 
  Calendar, Users, MoreVertical, Edit, Archive, Copy
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

// Design System
import { PageShell, PageHeader, Section, Grid, Stack } from '@/design-system/layout'
import { SurfaceCard, MetricCard } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text } from '@/design-system/typography'
import { DrawerLayout } from '@/design-system/patterns/drawer-layout'
import { ModalLayout } from '@/design-system/patterns/modal-layout'

interface AssessmentTemplate {
  id: string
  course_id: string
  title: string
  description?: string
  type: string
  status: string
  question_count: number
  time_limit_minutes?: number
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

export default function AssessmentsHubPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'templates' | 'runs'>('templates')
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['assessment-templates'],
    queryFn: async () => {
      const res = await api.get<AssessmentTemplate[]>('/instructor/assessments/templates')
      return res.data
    }
  })

  // Fetch runs
  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ['assessment-runs'],
    queryFn: async () => {
      const res = await api.get<AssessmentRun[]>('/instructor/assessments/runs')
      return res.data
    }
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      draft: { className: 'bg-gray-500', label: 'Draft' },
      published: { className: 'bg-blue-600', label: 'Published' },
      scheduled: { className: 'bg-yellow-600', label: 'Scheduled' },
      live: { className: 'bg-green-600', label: 'Live' },
      closed: { className: 'bg-gray-600', label: 'Closed' },
      graded: { className: 'bg-purple-600', label: 'Graded' }
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

  return (
    <PageShell maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <PageHeader
          title="Assessments & Exams"
          description="Create, manage, and grade quizzes, midterms, finals, and custom assessments"
          action={
            <Button onClick={() => setShowCreateTemplate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Assessment
            </Button>
          }
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'templates' | 'runs')}>
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="runs">Runs</TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-6">
            {templatesLoading ? (
              <LoadingState message="Loading templates..." />
            ) : !templates || templates.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Assessment Templates"
                description="Create your first assessment template to get started. Templates define the structure and rules for your assessments."
                action={{
                  label: 'Create Template',
                  onClick: () => setShowCreateTemplate(true)
                }}
              />
            ) : (
              <Stack gap="md">
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link href={`/instructor/assessments-hub/templates/${template.id}`}>
                      <SurfaceCard className="cursor-pointer hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <Heading level={4} className="truncate">
                                {template.title}
                              </Heading>
                              {getStatusBadge(template.status)}
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(template.type)}
                              </Badge>
                            </div>
                            {template.description && (
                              <Text size="sm" variant="muted" className="line-clamp-2 mb-3">
                                {template.description}
                              </Text>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                {template.question_count} questions
                              </span>
                              {template.time_limit_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {template.time_limit_minutes} min
                                </span>
                              )}
                              <span className="text-xs">
                                Updated {new Date(template.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="gap-2">
                            Create Run
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </SurfaceCard>
                    </Link>
                  </motion.div>
                ))}
              </Stack>
            )}
          </TabsContent>

          {/* Runs Tab */}
          <TabsContent value="runs" className="mt-6">
            {runsLoading ? (
              <LoadingState message="Loading runs..." />
            ) : !runs || runs.length === 0 ? (
              <EmptyState
                icon={Play}
                title="No Assessment Runs"
                description="Create a run from an existing template to publish it to students."
                action={{
                  label: 'View Templates',
                  onClick: () => setActiveTab('templates')
                }}
              />
            ) : (
              <Stack gap="md">
                {runs.map((run, index) => (
                  <motion.div
                    key={run.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link href={`/instructor/assessments-hub/runs/${run.id}`}>
                      <SurfaceCard className="cursor-pointer hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <Heading level={4} className="truncate">
                                {run.title_override || 'Assessment'}
                              </Heading>
                              {getStatusBadge(run.status)}
                              {run.access_mode === 'public_link' && (
                                <Badge variant="secondary" className="gap-1">
                                  <Copy className="h-3 w-3" />
                                  Public Link
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {run.starts_at && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Starts {new Date(run.starts_at).toLocaleDateString()}
                                </span>
                              )}
                              {run.ends_at && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  Ends {new Date(run.ends_at).toLocaleDateString()}
                                </span>
                              )}
                              {run.public_code && (
                                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                  {run.public_code}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                              <Users className="h-4 w-4" />
                              Submissions
                            </Button>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </SurfaceCard>
                    </Link>
                  </motion.div>
                ))}
              </Stack>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Create Template Modal (simple version, full builder separate) */}
      <ModalLayout
        open={showCreateTemplate}
        onClose={() => setShowCreateTemplate(false)}
        title="Create Assessment Template"
        size="lg"
      >
        <div className="space-y-4">
          <Text variant="muted">
            Template builder coming soon. For now, use the API or continue building out the full template builder component.
          </Text>
          <Button onClick={() => router.push('/instructor/assessments-hub/templates/new')}>
            Open Template Builder
          </Button>
        </div>
      </ModalLayout>
    </PageShell>
  )
}
