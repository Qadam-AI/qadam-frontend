'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Navbar } from '../_components/navbar'
import { Sidebar } from '../_components/sidebar'
import { Footer } from '../_components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '../_components/auth-guard'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, Code, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { TableSkeleton } from '../_components/skeletons'
import { EmptyAttemptsState } from '../_components/empty-states'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTranslations } from '@/lib/i18n'

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
  const t = useTranslations('attempts')
  const tCommon = useTranslations('common')
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null)
  const [page, setPage] = useState(0)
  const limit = 20

  const { data: attempts, isLoading, error } = useQuery({
    queryKey: ['attempts', user?.id, page],
    queryFn: async () => {
      const response = await api.get(
        `/users/${user?.id}/attempts?limit=${limit}&offset=${page * limit}`
      )
      return response.data as Attempt[]
    },
    enabled: !!user?.id,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  if (error || !attempts) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{tCommon('error')}. {tCommon('retry')}.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (attempts.length === 0 && page === 0) {
    return <EmptyAttemptsState />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
      </motion.div>

      {/* Attempts Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('recent')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attempts.map((attempt, index) => (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedAttempt(attempt)}
                >
                  {/* Status Icon */}
                  <div>
                    {attempt.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>

                  {/* Concept */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {attempt.conceptName || 'Unknown Concept'}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {format(new Date(attempt.createdAt), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>

                  {/* Time */}
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {attempt.timeMs}ms
                  </Badge>

                  {/* Status Badge */}
                  <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                    {attempt.passed ? t('passed') : t('failed')}
                  </Badge>

                  {/* View Details */}
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {attempts.length === limit && (
              <div className="mt-4 flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  {tCommon('previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={attempts.length < limit}
                >
                  {tCommon('next')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Attempt Detail Dialog */}
      <Dialog open={!!selectedAttempt} onOpenChange={() => setSelectedAttempt(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAttempt?.passed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              {t('details')}
            </DialogTitle>
            <DialogDescription>
              {selectedAttempt && format(new Date(selectedAttempt.createdAt), 'MMMM d, yyyy h:mm a')}
            </DialogDescription>
          </DialogHeader>

          {selectedAttempt && (
            <div className="space-y-4">
              {/* Status Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">{t('status')}</div>
                  <Badge variant={selectedAttempt.passed ? 'default' : 'destructive'} className="mt-1">
                    {selectedAttempt.passed ? t('passed') : t('failed')}
                  </Badge>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">{t('time')}</div>
                  <div className="font-semibold mt-1">{selectedAttempt.timeMs}ms</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">{t('concept')}</div>
                  <div className="font-semibold mt-1 truncate">
                    {selectedAttempt.conceptName || 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Code */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4" />
                  <h3 className="font-semibold">{t('yourCode')}</h3>
                </div>
                <div className="rounded-lg border bg-muted p-4">
                  <pre className="text-sm overflow-x-auto">
                    <code>{selectedAttempt.code}</code>
                  </pre>
                </div>
              </div>

              {/* Failures */}
              {!selectedAttempt.passed && selectedAttempt.failDetails && selectedAttempt.failDetails.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">{t('testFailures')}</h3>
                  <div className="space-y-2">
                    {selectedAttempt.failDetails.map((failure, i) => (
                      <div key={i} className="p-3 rounded-lg border bg-card">
                        <p className="font-medium mb-1">❌ {failure.name}</p>
                        {failure.expected && (
                          <p className="text-sm text-muted-foreground">
                            Expected: <code className="text-xs bg-muted px-1 py-0.5 rounded">{failure.expected}</code>
                          </p>
                        )}
                        {failure.received && (
                          <p className="text-sm text-muted-foreground">
                            Received: <code className="text-xs bg-muted px-1 py-0.5 rounded">{failure.received}</code>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AttemptsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 lg:ml-64">
            <div className="max-w-7xl mx-auto">
              <AttemptsContent />
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </AuthGuard>
  )
}

