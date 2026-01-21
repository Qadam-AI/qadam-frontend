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

  if (passed) {
    return (
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-medium text-green-900 dark:text-green-100">Correct</h3>
        </div>
        {feedback && (
          <p className="mt-2 text-green-800 dark:text-green-300 leading-relaxed text-sm">
            {feedback}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <XCircle className="h-6 w-6 text-destructive" />
        <h3 className="text-lg font-medium text-destructive">Incorrect</h3>
      </div>

      {feedback && (
        <p className="text-foreground leading-relaxed mb-4">
          {feedback}
        </p>
      )}

      {failures.length > 0 && (
        <div className="space-y-3">
            <div className="flex items-center gap-4">
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                >
                  {showDetails ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                  {showDetails ? 'Hide' : 'Show'} details
                </Button>

                {onGetHint && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={onGetHint}
                    disabled={isLoadingHint}
                    className="h-auto p-0 text-amber-600 dark:text-amber-500"
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    {isLoadingHint ? 'Generating hint...' : 'Need a hint?'}
                  </Button>
                )}
            </div>
            
            {scaffoldedHint && (
              <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 text-sm">
                <p className="font-medium text-amber-800 mb-1">Hint:</p>
                {scaffoldedHint}
              </div>
            )}

            {showDetails && (
              <div className="bg-background rounded border p-4 text-sm font-mono mt-2">
                 <ul className="space-y-1">
                    {failures.map((f, i) => (
                      <li key={i} className="text-destructive">
                         • {f.message}
                      </li>
                    ))}
                 </ul>
              </div>
            )}
        </div>
      )}
    </div>
  )
}


