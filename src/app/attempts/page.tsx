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
import { cn } from '@/lib/utils'

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

  // Helper to format the answer display
  const formatAnswer = (answer: string) => {
    // If it looks like the matching format "1-B, 2-A", format it nicely
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
    
    // If it's a code block (multiline or has special chars), keep pre
    if (answer.includes('\n') || answer.length > 50) {
        return (
            <div className="rounded-md bg-muted/50 p-4 border overflow-x-auto text-sm font-mono">
                <pre>{answer}</pre>
            </div>
        )
    }

    // Default text display
    return <div className="text-lg font-serif">{answer}</div>
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-medium tracking-tight text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <TableSkeleton />
      </div>
    )
  }

  if (error || !attempts) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-medium tracking-tight text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <div className="p-8 border rounded-lg text-center bg-muted/10">
          <p className="text-muted-foreground">{tCommon('error')}. {tCommon('retry')}.</p>
        </div>
      </div>
    )
  }

  if (attempts.length === 0 && page === 0) {
    return <EmptyAttemptsState />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-serif font-medium tracking-tight text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      </motion.div>

      {/* Attempts Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="space-y-4">
             <h2 className="text-xl font-medium tracking-tight">Recent Activity</h2>
             <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                            <tr>
                                <th className="px-4 py-3 text-left w-12"></th>
                                <th className="px-4 py-3 text-left">Concept</th>
                                <th className="px-4 py-3 text-right">Time</th>
                                <th className="px-4 py-3 text-right">Date</th>
                                <th className="px-4 py-3 text-right">Status</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {attempts.map((attempt) => (
                                <tr 
                                    key={attempt.id} 
                                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                                    onClick={() => setSelectedAttempt(attempt)}
                                >
                                    <td className="px-4 py-3">
                                        {attempt.passed ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-destructive" />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        {attempt.conceptName || 'Unknown Concept'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground font-mono text-xs">
                                        {attempt.timeMs}ms
                                    </td>
                                    <td className="px-4 py-3 text-right text-muted-foreground">
                                        {format(new Date(attempt.createdAt), 'MMM d, h:mm a')}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                            attempt.passed 
                                                ? "bg-green-50 text-green-700 border border-green-200" 
                                                : "bg-red-50 text-red-700 border border-red-200"
                                        )}>
                                            {attempt.passed ? t('passed') : t('failed')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        <ChevronRight className="h-4 w-4" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
        </div>
      </motion.div>

      {/* Attempt Detail Dialog */}
      <Dialog open={!!selectedAttempt} onOpenChange={() => setSelectedAttempt(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-serif">
              {selectedAttempt && (
                  <>Attempt Details</>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedAttempt && format(new Date(selectedAttempt.createdAt), 'MMMM d, yyyy h:mm a')}
            </DialogDescription>
          </DialogHeader>

          {selectedAttempt && (
            <div className="space-y-6 pt-4">
              {/* Status Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-background">
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t('status')}</div>
                  <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        selectedAttempt.passed 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    )}>
                    {selectedAttempt.passed ? t('passed') : t('failed')}
                  </span>
                </div>
                <div className="p-4 rounded-lg border bg-background">
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t('time')}</div>
                  <div className="font-mono font-medium">{selectedAttempt.timeMs}ms</div>
                </div>
                <div className="p-4 rounded-lg border bg-background">
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t('concept')}</div>
                  <div className="font-medium truncate">
                    {selectedAttempt.conceptName || 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Answer Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('yourCode').replace('Code', 'Answer')}</div>
                </div>
                {formatAnswer(selectedAttempt.code)}
              </div>

              {/* Failures */}
              {!selectedAttempt.passed && selectedAttempt.failDetails && selectedAttempt.failDetails.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Feedback</h3>
                  <div className="space-y-2">
                    {selectedAttempt.failDetails.map((failure, i) => (
                      <div key={i} className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900">
                        <p className="font-medium text-red-900 dark:text-red-200 mb-1">{failure.name}</p>
                        {failure.expected && (
                          <p className="text-sm text-red-800/80 dark:text-red-300/80 mt-1">
                            Expected: <code className="text-xs bg-red-100 dark:bg-red-900/40 px-1 py-0.5 rounded">{failure.expected}</code>
                          </p>
                        )}
                        {failure.received && (
                          <p className="text-sm text-red-800/80 dark:text-red-300/80">
                            Received: <code className="text-xs bg-red-100 dark:bg-red-900/40 px-1 py-0.5 rounded">{failure.received}</code>
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

