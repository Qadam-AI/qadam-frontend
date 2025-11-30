'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info, TestTube2 } from 'lucide-react'
import type { TestCase } from '@/lib/types'

interface TaskCardProps {
  prompt: string
  tests: TestCase[]
  hint?: string | null
  difficulty?: number
}

export function TaskCard({ prompt, tests, hint, difficulty }: TaskCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Challenge</CardTitle>
          {difficulty && (
            <Badge variant="secondary">
              Difficulty {difficulty}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-base leading-relaxed">{prompt}</p>
        </div>

        {tests.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TestTube2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Tests ({tests.length})</p>
            </div>
            <ul className="space-y-1">
              {tests.map((test, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start">
                  <span className="mr-2">•</span>
                  <span>{test.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hint && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary mb-1">Hint</p>
                <p className="text-sm text-muted-foreground">{hint}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

