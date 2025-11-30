import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, BookOpen, Code, RefreshCw, FileText } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="mb-4 text-muted-foreground">
            {icon || <BookOpen className="h-12 w-12" />}
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function ErrorState({ error, retry }: { error: string; retry?: () => void }) {
  return (
    <EmptyState
      title="Something went wrong"
      description={error}
      action={retry ? { label: 'Try Again', onClick: retry } : undefined}
      icon={<AlertCircle className="h-12 w-12 text-destructive" />}
    />
  )
}

export function NoTasksState({ onStart }: { onStart: () => void }) {
  return (
    <EmptyState
      title="Ready to practice?"
      description="Start your personalized practice session. We'll suggest the perfect challenge based on your current skills."
      action={{ label: 'Start Practice', onClick: onStart }}
      icon={<Code className="h-12 w-12" />}
    />
  )
}

export function EmptyAttemptsState() {
  return (
    <EmptyState
      title="No Attempts Yet"
      description="Your practice history will appear here once you start solving tasks"
      action={{ label: 'Start Practicing', onClick: () => window.location.href = '/practice' }}
      icon={<FileText className="h-12 w-12" />}
    />
  )
}

