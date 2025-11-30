'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import { useState } from 'react'
import type { TestFailure } from '@/lib/types'
import { Button } from '@/components/ui/button'

interface FeedbackPanelProps {
  passed: boolean
  feedback: string | null
  failures: TestFailure[]
  timeMs?: number
  onGetHint?: () => void
  isLoadingHint?: boolean
  scaffoldedHint?: string | null
}

export function FeedbackPanel({ 
  passed, 
  feedback, 
  failures, 
  timeMs,
  onGetHint,
  isLoadingHint,
  scaffoldedHint
}: FeedbackPanelProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={passed ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-destructive bg-destructive/5'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {passed ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-emerald-600">All Tests Passed!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="text-destructive">Some Tests Failed</span>
                </>
              )}
            </CardTitle>
            {timeMs && (
              <Badge variant="outline">
                {timeMs}ms
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback && (
            <div className="text-sm">
              <p className="font-medium mb-1">Feedback:</p>
              <p className="text-muted-foreground">{feedback}</p>
            </div>
          )}

          {!passed && failures.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="p-0 h-auto font-normal"
                >
                  {showDetails ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                  {showDetails ? 'Hide' : 'Show'} failure details
                </Button>
                
                {onGetHint && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onGetHint}
                    disabled={isLoadingHint}
                    className="gap-2"
                  >
                    <Lightbulb className="h-4 w-4" />
                    {isLoadingHint ? 'Getting hint...' : 'Get Hint'}
                  </Button>
                )}
              </div>

              {scaffoldedHint && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Scaffolded Hint</p>
                      <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                        {scaffoldedHint}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2"
                >
                  {failures.map((failure, i) => (
                    <div key={i} className="text-sm p-3 rounded-lg bg-background/50 border">
                      <p className="font-medium mb-1">❌ {failure.name}</p>
                      {failure.expected && (
                        <p className="text-muted-foreground">
                          Expected: <code className="text-xs bg-muted px-1 py-0.5 rounded">{failure.expected}</code>
                        </p>
                      )}
                      {failure.received && (
                        <p className="text-muted-foreground">
                          Received: <code className="text-xs bg-muted px-1 py-0.5 rounded">{failure.received}</code>
                        </p>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Tip: Almost there. Try focusing on the failing test names.
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

