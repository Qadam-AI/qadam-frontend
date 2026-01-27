'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, Clock, Calendar, FileText, CheckCircle2, 
  AlertCircle, Hourglass
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '../_components/navbar'
import { Sidebar } from '../_components/sidebar'
import { AuthGuard } from '../_components/auth-guard'

// Design System
import { PageShell, PageHeader, Section, Stack } from '@/design-system/layout'
import { SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'

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
  created_at: string
}

interface MyAttemptStatus {
  has_attempt: boolean
  attempt_id?: string
  status?: string
  score?: number
  max_score?: number
  percent?: number
}

function AssessmentsContent() {
  const router = useRouter()

  // Fetch assigned assessments
  const { data: assessments, isLoading } = useQuery({
    queryKey: ['student-assessments'],
    queryFn: async () => {
      const res = await api.get<AssessmentRun[]>('/student/assessments')
      return res.data
    }
  })

  const getStatusInfo = (run: AssessmentRun) => {
    const now = new Date()
    const startsAt = run.starts_at ? new Date(run.starts_at) : null
    const endsAt = run.ends_at ? new Date(run.ends_at) : null

    if (run.status === 'closed') {
      return { label: 'Closed', variant: 'bg-gray-600', icon: AlertCircle, canStart: false }
    }

    if (startsAt && now < startsAt) {
      return { label: 'Not Started', variant: 'bg-yellow-600', icon: Calendar, canStart: false }
    }

    if (endsAt && now > endsAt) {
      return { label: 'Ended', variant: 'bg-gray-600', icon: AlertCircle, canStart: false }
    }

    if (run.status === 'live' || run.status === 'scheduled') {
      return { label: 'Available', variant: 'bg-green-600', icon: Play, canStart: true }
    }

    return { label: 'Draft', variant: 'bg-gray-500', icon: Hourglass, canStart: false }
  }

  const formatTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Ended'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d remaining`
    if (hours > 0) return `${hours}h remaining`
    return `${Math.floor(diff / (1000 * 60))}m remaining`
  }

  if (isLoading) {
    return (
      <PageShell maxWidth="2xl">
        <LoadingState message="Loading your assessments..." />
      </PageShell>
    )
  }

  if (!assessments || assessments.length === 0) {
    return (
      <PageShell maxWidth="lg">
        <div className="py-12">
          <EmptyState
            icon={FileText}
            title="No Assessments Yet"
            description="Your instructor hasn't assigned any assessments yet. Check back later or contact your instructor."
          />
        </div>
      </PageShell>
    )
  }

  // Group by status
  const available = assessments.filter(a => getStatusInfo(a).canStart)
  const upcoming = assessments.filter(a => {
    const now = new Date()
    const startsAt = a.starts_at ? new Date(a.starts_at) : null
    return startsAt && now < startsAt
  })
  const past = assessments.filter(a => a.status === 'closed')

  return (
    <PageShell maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <PageHeader
          title="My Assessments"
          description="View and take your assigned quizzes, exams, and tests"
        />

        {/* Available Assessments */}
        {available.length > 0 && (
          <Section title="Available Now" description="Ready to take">
            <Stack gap="md">
              {available.map((assessment, index) => {
                const statusInfo = getStatusInfo(assessment)
                const StatusIcon = statusInfo.icon

                return (
                  <motion.div
                    key={assessment.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <SurfaceCard className="hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Heading level={4}>
                              {assessment.title_override || 'Assessment'}
                            </Heading>
                            <Badge className={statusInfo.variant}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            {assessment.duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {assessment.duration_minutes} minutes
                              </span>
                            )}
                            {assessment.ends_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatTimeRemaining(assessment.ends_at)}
                              </span>
                            )}
                          </div>

                          {assessment.starts_at && assessment.ends_at && (
                            <Text size="xs" variant="muted">
                              Available: {new Date(assessment.starts_at).toLocaleString()} - {new Date(assessment.ends_at).toLocaleString()}
                            </Text>
                          )}
                        </div>

                        <Link href={`/assessments/${assessment.id}`}>
                          <Button className="gap-2">
                            <Play className="h-4 w-4" />
                            Start
                          </Button>
                        </Link>
                      </div>
                    </SurfaceCard>
                  </motion.div>
                )
              })}
            </Stack>
          </Section>
        )}

        {/* Upcoming Assessments */}
        {upcoming.length > 0 && (
          <Section title="Upcoming" description="Not yet available">
            <Stack gap="md">
              {upcoming.map((assessment, index) => {
                const statusInfo = getStatusInfo(assessment)
                const StatusIcon = statusInfo.icon

                return (
                  <motion.div
                    key={assessment.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <SurfaceCard variant="muted">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Heading level={4}>
                              {assessment.title_override || 'Assessment'}
                            </Heading>
                            <Badge variant="secondary">
                              <Calendar className="h-3 w-3 mr-1" />
                              Scheduled
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {assessment.starts_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Opens {new Date(assessment.starts_at).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </SurfaceCard>
                  </motion.div>
                )
              })}
            </Stack>
          </Section>
        )}

        {/* Past Assessments */}
        {past.length > 0 && (
          <Section title="Past Assessments" description="View results">
            <Stack gap="md">
              {past.map((assessment, index) => (
                <motion.div
                  key={assessment.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link href={`/assessments/${assessment.id}/result`}>
                    <SurfaceCard variant="muted" className="cursor-pointer hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Heading level={4}>
                              {assessment.title_override || 'Assessment'}
                            </Heading>
                            <Badge variant="secondary">Closed</Badge>
                          </div>

                          <Text size="sm" variant="muted">
                            Ended {assessment.ends_at ? new Date(assessment.ends_at).toLocaleDateString() : 'Recently'}
                          </Text>
                        </div>

                        <Button variant="outline" size="sm" className="gap-2">
                          <FileText className="h-4 w-4" />
                          View Results
                        </Button>
                      </div>
                    </SurfaceCard>
                  </Link>
                </motion.div>
              ))}
            </Stack>
          </Section>
        )}

        {available.length === 0 && upcoming.length === 0 && past.length === 0 && (
          <InfoPanel icon={FileText} title="All Caught Up!" variant="info">
            <Text size="sm">You don't have any active assessments right now.</Text>
          </InfoPanel>
        )}
      </motion.div>
    </PageShell>
  )
}

export default function AssessmentsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <AssessmentsContent />
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
