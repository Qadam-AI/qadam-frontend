'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MasteryBar } from './mastery-bar'
import { getMasteryLevel } from '@/lib/utils'
import { BookOpen, Code, List, Zap } from 'lucide-react'

interface MasteryCardProps {
  concept: string
  value: number
  onPractice?: () => void
  index?: number
}

const conceptIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  variables: Zap,
  loops: Code,
  lists: List,
  functions: BookOpen,
}

export function MasteryCard({ concept, value, onPractice, index = 0 }: MasteryCardProps) {
  const { label, color } = getMasteryLevel(value)
  const Icon = conceptIcons[concept.toLowerCase()] || BookOpen

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg capitalize">{concept}</CardTitle>
            </div>
            <Badge variant="outline" className={color}>
              {label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <MasteryBar value={value} />
          {onPractice && (
            <Button onClick={onPractice} className="w-full" variant="default">
              Practice this concept
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

