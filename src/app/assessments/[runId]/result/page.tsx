'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, CheckCircle2, XCircle, Trophy, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'
import { Navbar } from '../../../_components/navbar'
import { Sidebar } from '../../../_components/sidebar'
import { AuthGuard } from '../../../_components/auth-guard'

// Design System
import { PageShell, Section, Stack, Grid } from '@/design-system/layout'
import { SurfaceCard, MetricCard, InfoPanel } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'

interface GradeResponse {
  id: string
  attempt_id: string
  total_score: number
  max_score: number
  percent: number
  passed?: boolean
  breakdown_by_concept?: Record<string, { score: number; max: number }>
  released_at?: string
  created_at: string
}

function ResultsContent() {
  const params = useParams()
  const runId = params.runId as string

  // Note: This endpoint would need to be updated to accept runId and find the user's attempt
  // For now, we'll fetch via a workaround
  const { data: grade, isLoading, error } = useQuery({
    queryKey: ['assessment-result', runId],
    queryFn: async () => {
      // Simplified: In real impl, backend should provide /student/assessments/{runId}/my-result
      // For now, assume we can get attempt_id from somewhere or the endpoint handles it
      const res = await api.get<GradeResponse>(`/student/assessments/attempts/{attempt_id}/result`)
      return res.data
    }
  })

  // Trigger confetti if passed
  useEffect(() => {
    if (grade && grade.passed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
  }, [grade])

  if (isLoading) {
    return (
      <PageShell maxWidth="2xl">
        <LoadingState message="Loading your results..." />
      </PageShell>
    )
  }

  if (error || !grade) {
    return (
      <PageShell maxWidth="lg">
        <EmptyState
          icon={XCircle}
          title="Results Not Available"
          description="Your results haven't been released yet. Check back later or contact your instructor."
          action={{
            label: 'Back to Assessments',
            onClick: () => window.location.href = '/assessments'
          }}
        />
      </PageShell>
    )
  }

  const conceptBreakdown = grade.breakdown_by_concept
    ? Object.entries(grade.breakdown_by_concept).map(([id, data]) => ({
        concept_id: id,
        score: data.score,
        max: data.max,
        percent: (data.score / data.max) * 100
      }))
    : []

  return (
    <PageShell maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <Link href="/assessments">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Assessments
            </Button>
          </Link>
          
          <div className="text-center">
            <Heading level={1}>Assessment Results</Heading>
            <Text variant="muted" className="mt-2">
              Completed on {new Date(grade.created_at).toLocaleDateString()}
            </Text>
          </div>
        </div>

        {/* Overall Score */}
        <SurfaceCard variant="elevated" className="text-center bg-gradient-to-br from-primary/5 to-indigo-500/5">
          <Stack gap="md">
            <div>
              {grade.passed !== null && grade.passed !== undefined && (
                <Badge
                  className={`mb-4 ${grade.passed ? 'bg-green-600' : 'bg-yellow-600'}`}
                >
                  {grade.passed ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Passed
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      Did Not Pass
                    </>
                  )}
                </Badge>
              )}
              
              <div className="text-6xl font-bold text-primary mb-2">
                {Math.round(grade.percent)}%
              </div>
              
              <Text variant="muted" className="text-lg">
                {grade.total_score.toFixed(1)} / {grade.max_score.toFixed(1)} points
              </Text>
            </div>

            <Progress value={grade.percent} className="h-3 max-w-md mx-auto" />
          </Stack>
        </SurfaceCard>

        {/* Performance Summary */}
        <Section title="Performance Summary">
          <Grid cols={3} gap="md">
            <MetricCard
              label="Total Score"
              value={`${Math.round(grade.percent)}%`}
              icon={Trophy}
              variant={grade.percent >= 70 ? 'success' : 'warning'}
            />
            <MetricCard
              label="Points Earned"
              value={grade.total_score.toFixed(1)}
              icon={CheckCircle2}
              variant="default"
            />
            <MetricCard
              label="Max Points"
              value={grade.max_score.toFixed(1)}
              icon={TrendingUp}
              variant="info"
            />
          </Grid>
        </Section>

        {/* Concept Breakdown */}
        {conceptBreakdown.length > 0 && (
          <Section title="Performance by Concept">
            <Stack gap="sm">
              {conceptBreakdown.map((concept, index) => (
                <motion.div
                  key={concept.concept_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SurfaceCard>
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <LabelText>Concept {concept.concept_id.slice(0, 8)}</LabelText>
                      <div className="flex items-center gap-2">
                        <Text className="font-semibold text-primary">
                          {Math.round(concept.percent)}%
                        </Text>
                        <Badge variant="secondary">
                          {concept.score.toFixed(1)}/{concept.max.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={concept.percent} className="h-2" />
                  </SurfaceCard>
                </motion.div>
              ))}
            </Stack>
          </Section>
        )}

        {/* Next Steps */}
        <InfoPanel icon={TrendingUp} title="Keep Learning!" variant="info">
          <Text size="sm" className="mb-3">
            Great work on completing this assessment! Continue practicing to improve your understanding.
          </Text>
          <div className="flex gap-2">
            <Link href="/practice">
              <Button size="sm" variant="outline">
                Practice More
              </Button>
            </Link>
            <Link href="/lessons">
              <Button size="sm" variant="outline">
                Review Lessons
              </Button>
            </Link>
          </div>
        </InfoPanel>
      </motion.div>
    </PageShell>
  )
}

export default function ResultPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <ResultsContent />
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
