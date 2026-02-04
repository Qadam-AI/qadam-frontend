'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'templates' | 'runs'>('templates')
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)

  const setTab = (tab: 'templates' | 'runs') => {
    setActiveTab(tab)
    router.replace(`/instructor/assessments-hub?tab=${tab}`)
  }

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'templates' || tab === 'runs') {
      setActiveTab(tab)
    }
  }, [searchParams])

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
          title="Practice sets"
          description="Create practice sets, publish them to students, and grade submissions"
          action={
            <Button onClick={() => setShowCreateTemplate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create practice set
            </Button>
          }
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setTab(v as 'templates' | 'runs')}>
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="templates">Practice sets</TabsTrigger>
            <TabsTrigger value="runs">Gradebook</TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-6">
            {templatesLoading ? (
              <LoadingState message="Loading practice sets..." />
            ) : !templates || templates.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No practice sets yet"
                description="Create your first practice set. Publish it to students and grade submissions in Gradebook."
                action={{
                  label: 'Create practice set',
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
                            Publish
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
              <LoadingState message="Loading gradebook..." />
            ) : !runs || runs.length === 0 ? (
              <EmptyState
                icon={Play}
                title="No published runs"
                description="Publish a practice set to students to start collecting submissions and grading."
                action={{
                  label: 'View practice sets',
                  onClick: () => setTab('templates')
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
                                {run.title_override || 'Practice set run'}
                              </Heading>
                              {getStatusBadge(run.status)}
                              {run.access_mode === 'public_link' && (
                                <Badge variant="secondary" className="gap-1">
                                  <Copy className="h-3 w-3" />
                                  Public link
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
                              Grade
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
        title="Create practice set"
        size="lg"
      >
        <div className="space-y-4">
          <Text variant="muted">
            Use the builder to define the question selection and grading rules for this practice set.
          </Text>
          <Button onClick={() => router.push('/instructor/assessments-hub/templates/new')}>
            Open builder
          </Button>
        </div>
      </ModalLayout>
    </PageShell>
  )
}
