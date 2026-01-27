'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Navbar } from '../_components/navbar'
import { Sidebar } from '../_components/sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '../_components/auth-guard'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, Code, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

// Design System
import { PageShell, PageHeader, Section, Stack } from '@/design-system/layout'
import { SurfaceCard } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { DrawerLayout } from '@/design-system/patterns/drawer-layout'
import { Heading, Text, LabelText } from '@/design-system/typography'

interface Attempt {
  id: string
  taskId: string
  conceptName?: string
  code: string
  passed: boolean
  timeMs: number
  createdAt: string
  failDetails?: Array<{
    name: string
    expected?: string
    received?: string
  }>
}

function AttemptsContent() {
  const { user } = useAuth()
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null)
  const [page, setPage] = useState(0)
  const limit = 20

  const { data: attempts, isLoading } = useQuery({
    queryKey: ['attempts', user?.id, page],
    queryFn: async () => {
      const response = await api.get(
        `/users/${user?.id}/attempts?limit=${limit}&offset=${page * limit}`
      )
      return response.data as Attempt[]
    },
    enabled: !!user?.id,
  })

  const formatAnswer = (answer: string) => {
    if (answer.match(/^\d+-[A-Z](, \d+-[A-Z])*$/)) {
      return (
        <div className="flex flex-wrap gap-2">
          {answer.split(', ').map((pair, i) => (
            <div key={i} className="bg-muted px-2 py-1 rounded text-sm font-mono border">
              {pair}
            </div>
          ))}
        </div>
      )
    }
    
    if (answer.includes('\n') || answer.length > 50) {
      return (
        <div className="rounded-md bg-muted/50 p-4 border overflow-x-auto text-sm font-mono">
          <pre>{answer}</pre>
        </div>
      )
    }

    return <div className="text-lg">{answer}</div>
  }

  if (isLoading) {
    return (
      <PageShell maxWidth="2xl">
        <LoadingState message="Loading your attempts..." />
      </PageShell>
    )
  }

  if (!attempts || attempts.length === 0) {
    return (
      <PageShell maxWidth="lg">
        <div className="py-12">
          <EmptyState
            icon={Code}
            title="No practice attempts yet"
            description="Start practicing to see your attempt history here."
            action={{
              label: 'Start Practice',
              onClick: () => window.location.href = '/practice'
            }}
          />
        </div>
      </PageShell>
    )
  }

  const passedCount = attempts.filter(a => a.passed).length
  const successRate = Math.round((passedCount / attempts.length) * 100)

  return (
    <PageShell maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <PageHeader
          title="Practice Attempts"
          description="Review your practice history and track progress"
        />

        {/* Summary */}
        <SurfaceCard variant="muted">
          <div className="flex items-center justify-between">
            <div>
              <Text variant="muted" size="sm" className="uppercase tracking-wide mb-1">
                Total Attempts
              </Text>
              <Heading level={3}>{attempts.length}</Heading>
            </div>
            <div>
              <Text variant="muted" size="sm" className="uppercase tracking-wide mb-1">
                Passed
              </Text>
              <Heading level={3} className="text-green-600">{passedCount}</Heading>
            </div>
            <div>
              <Text variant="muted" size="sm" className="uppercase tracking-wide mb-1">
                Success Rate
              </Text>
              <Heading level={3} className={successRate >= 70 ? 'text-green-600' : 'text-yellow-600'}>
                {successRate}%
              </Heading>
            </div>
          </div>
        </SurfaceCard>

        {/* Attempts List */}
        <Section>
          <Stack gap="sm">
            {attempts.map((attempt, index) => (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <SurfaceCard 
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setSelectedAttempt(attempt)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2.5 rounded-lg ${
                        attempt.passed 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-red-500/10 text-red-600'
                      }`}>
                        {attempt.passed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Text className="font-medium mb-1">
                          {attempt.conceptName || 'Practice Task'}
                        </Text>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(attempt.createdAt), 'MMM d, yyyy h:mm a')}
                          </span>
                          {attempt.timeMs && (
                            <span>{Math.round(attempt.timeMs / 1000)}s</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={attempt.passed ? 'default' : 'secondary'}
                        className={attempt.passed ? 'bg-green-600' : ''}
                      >
                        {attempt.passed ? 'Passed' : 'Failed'}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </SurfaceCard>
              </motion.div>
            ))}
          </Stack>

          {/* Pagination */}
          {attempts.length === limit && (
            <div className="flex justify-center pt-6">
              <Button variant="outline" onClick={() => setPage(p => p + 1)}>
                Load More
              </Button>
            </div>
          )}
        </Section>
      </motion.div>

      {/* Attempt Detail Drawer */}
      <DrawerLayout
        open={!!selectedAttempt}
        onClose={() => setSelectedAttempt(null)}
        title="Attempt Details"
        size="lg"
      >
        {selectedAttempt && (
          <Stack gap="lg">
            {/* Status */}
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${
                selectedAttempt.passed 
                  ? 'bg-green-500/10 text-green-600' 
                  : 'bg-red-500/10 text-red-600'
              }`}>
                {selectedAttempt.passed ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <XCircle className="h-6 w-6" />
                )}
              </div>
              <div>
                <LabelText className={selectedAttempt.passed ? 'text-green-600' : 'text-red-600'}>
                  {selectedAttempt.passed ? 'Passed' : 'Failed'}
                </LabelText>
                <Text size="sm" variant="muted">
                  {format(new Date(selectedAttempt.createdAt), 'MMMM d, yyyy h:mm a')}
                </Text>
              </div>
            </div>

            {/* Concept */}
            {selectedAttempt.conceptName && (
              <div>
                <LabelText className="mb-2">Concept</LabelText>
                <Badge variant="secondary" className="text-sm px-3 py-1.5">
                  {selectedAttempt.conceptName}
                </Badge>
              </div>
            )}

            {/* Your Answer */}
            <div>
              <LabelText className="mb-2">Your Answer</LabelText>
              {formatAnswer(selectedAttempt.code)}
            </div>

            {/* Failures */}
            {!selectedAttempt.passed && selectedAttempt.failDetails && selectedAttempt.failDetails.length > 0 && (
              <div>
                <LabelText className="mb-2">What went wrong</LabelText>
                <Stack gap="sm">
                  {selectedAttempt.failDetails.map((fail, idx) => (
                    <SurfaceCard key={idx} variant="muted">
                      <Stack gap="xs">
                        <Text size="sm" className="font-medium">{fail.name}</Text>
                        {fail.expected && (
                          <Text size="sm" variant="muted">
                            Expected: <span className="font-mono">{fail.expected}</span>
                          </Text>
                        )}
                        {fail.received && (
                          <Text size="sm" variant="muted">
                            Received: <span className="font-mono">{fail.received}</span>
                          </Text>
                        )}
                      </Stack>
                    </SurfaceCard>
                  ))}
                </Stack>
              </div>
            )}

            {/* CTA */}
            {selectedAttempt.conceptName && (
              <Button className="w-full" onClick={() => window.location.href = '/practice'}>
                Practice This Concept
              </Button>
            )}
          </Stack>
        )}
      </DrawerLayout>
    </PageShell>
  )
}

export default function AttemptsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <AttemptsContent />
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
