'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Target, FileText, Clock, Calendar, User, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// Design System
import { PageShell, Stack } from '@/design-system/layout'
import { SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'

interface PublicRunInfo {
  code: string
  title: string
  course_title: string
  question_count: number
  time_limit_minutes?: number
  status: string
  starts_at?: string
  ends_at?: string
}

export default function PublicExamJoinPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [name, setName] = useState('')

  // Fetch public run info
  const { data: runInfo, isLoading, error } = useQuery({
    queryKey: ['public-exam', code],
    queryFn: async () => {
      const res = await api.get<PublicRunInfo>(`/public/assessments/${code}`)
      return res.data
    }
  })

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/public/assessments/${code}/join`, { name })
      return res.data
    },
    onSuccess: (data) => {
      // Store guest info in localStorage
      localStorage.setItem('guest_id', data.guest_id)
      localStorage.setItem('guest_token', data.session_token)
      localStorage.setItem('guest_name', name)
      
      toast.success('Joined successfully!')
      router.push(`/exam/${code}/session?attempt_id=${data.attempt_id}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to join')
    }
  })

  if (isLoading) {
    return (
      <PageShell maxWidth="lg">
        <LoadingState message="Loading assessment..." />
      </PageShell>
    )
  }

  if (error || !runInfo) {
    return (
      <PageShell maxWidth="lg">
        <div className="py-12">
          <EmptyState
            icon={FileText}
            title="Assessment Not Found"
            description="This assessment link is invalid or has expired."
          />
        </div>
      </PageShell>
    )
  }

  const isAvailable = runInfo.status === 'live'
  const now = new Date()
  const hasStarted = !runInfo.starts_at || new Date(runInfo.starts_at) <= now
  const hasEnded = runInfo.ends_at && new Date(runInfo.ends_at) < now

  return (
    <PageShell maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 py-12"
      >
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <Heading level={1} className="mb-2">{runInfo.title}</Heading>
          <Text variant="muted" className="text-lg">{runInfo.course_title}</Text>
        </div>

        {/* Assessment Info */}
        <SurfaceCard variant="elevated">
          <Stack gap="md">
            <Heading level={3}>Assessment Details</Heading>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <Text size="sm" variant="muted">Questions</Text>
                  <Text className="font-medium">{runInfo.question_count}</Text>
                </div>
              </div>

              {runInfo.time_limit_minutes && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <Text size="sm" variant="muted">Time Limit</Text>
                    <Text className="font-medium">{runInfo.time_limit_minutes} minutes</Text>
                  </div>
                </div>
              )}

              {runInfo.starts_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <Text size="sm" variant="muted">Opens</Text>
                    <Text className="font-medium">{new Date(runInfo.starts_at).toLocaleString()}</Text>
                  </div>
                </div>
              )}

              {runInfo.ends_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <Text size="sm" variant="muted">Closes</Text>
                    <Text className="font-medium">{new Date(runInfo.ends_at).toLocaleString()}</Text>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center pt-2">
              <Badge className={isAvailable && hasStarted && !hasEnded ? 'bg-green-600' : 'bg-gray-600'}>
                {hasEnded ? 'Ended' : hasStarted ? (isAvailable ? 'Available' : 'Not Open') : 'Not Started'}
              </Badge>
            </div>
          </Stack>
        </SurfaceCard>

        {/* Join Form */}
        {isAvailable && hasStarted && !hasEnded ? (
          <SurfaceCard>
            <form onSubmit={(e) => { e.preventDefault(); joinMutation.mutate(); }} className="space-y-6">
              <div>
                <Heading level={3} className="mb-4">Join Assessment</Heading>
                <LabelText required className="mb-2">Your Name</LabelText>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  autoFocus
                  className="text-lg"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2"
                disabled={!name.trim() || joinMutation.isPending}
              >
                <User className="h-5 w-5" />
                {joinMutation.isPending ? 'Joining...' : 'Join & Start'}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </form>
          </SurfaceCard>
        ) : (
          <InfoPanel 
            icon={Calendar} 
            title={hasEnded ? 'Assessment Ended' : !hasStarted ? 'Not Yet Started' : 'Not Available'}
            variant="warning"
          >
            <Text size="sm">
              {hasEnded 
                ? 'This assessment has ended and is no longer accepting submissions.' 
                : !hasStarted 
                ? 'This assessment has not started yet. Please check back later.'
                : 'This assessment is not currently available.'}
            </Text>
          </InfoPanel>
        )}
      </motion.div>
    </PageShell>
  )
}
