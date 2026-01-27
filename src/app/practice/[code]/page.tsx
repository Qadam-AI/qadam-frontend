'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Target,
  User,
  ArrowRight,
  Sparkles
} from 'lucide-react'

// Design System
import { SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { LabelText, HelperText, Heading, Text } from '@/design-system/typography'
import { Stack } from '@/design-system/layout'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://qadam-backend-production.up.railway.app/api/v1'

interface PracticeLinkInfo {
  code: string
  is_valid: boolean
  error: string | null
  course_title: string
  title: string | null
  questions_count: number
  time_limit_minutes: number | null
  concept_name: string | null
}

interface GuestJoinResponse {
  session_token: string
  guest_id: string
  guest_name: string
  practice_session_id: string
  course_id: string
  questions_count: number
  time_limit_minutes: number | null
}

export default function PracticeJoinPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  
  const [studentName, setStudentName] = useState('')
  const [joined, setJoined] = useState(false)

  // Fetch practice link info
  const { data: linkInfo, isLoading: loadingInfo, error: infoError } = useQuery<PracticeLinkInfo>({
    queryKey: ['practice-link', code],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/practice/link/${code}`)
      return response.data
    },
    retry: 1,
  })

  // Join mutation
  const joinMutation = useMutation<GuestJoinResponse, Error, string>({
    mutationFn: async (name: string) => {
      const response = await axios.post(`${API_BASE}/practice/link/${code}/join`, {
        name: name.trim()
      })
      return response.data
    },
    onSuccess: (data) => {
      localStorage.setItem('practice_session_token', data.session_token)
      localStorage.setItem('practice_session_id', data.practice_session_id)
      localStorage.setItem('practice_guest_name', data.guest_name)
      localStorage.setItem('practice_questions_count', String(data.questions_count))
      if (data.time_limit_minutes) {
        localStorage.setItem('practice_time_limit', String(data.time_limit_minutes))
      }
      
      setJoined(true)
      setTimeout(() => {
        router.push(`/practice/${code}/session`)
      }, 1200)
    },
  })

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (studentName.trim().length < 1) return
    joinMutation.mutate(studentName)
  }

  const getErrorMessage = (error: string | null) => {
    const messages: Record<string, string> = {
      link_not_found: 'This practice link does not exist.',
      link_deactivated: 'This practice link is no longer active.',
      link_expired: 'This practice link has expired.',
      max_uses_reached: 'This practice link has reached its maximum uses.',
      no_questions_available: 'No practice questions are available yet.',
    }
    return messages[error || ''] || 'Something went wrong. Please try again.'
  }

  // Loading state
  if (loadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <Text variant="muted">Loading practice session...</Text>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (infoError || (linkInfo && !linkInfo.is_valid)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <SurfaceCard variant="elevated" className="text-center">
            <Stack gap="md">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <Heading level={3} className="mb-2">Practice Unavailable</Heading>
                <Text variant="muted">
                  {linkInfo ? getErrorMessage(linkInfo.error) : 'Unable to load practice link.'}
                </Text>
              </div>
              <Text size="sm" variant="subtle" className="pb-4">
                Contact your teacher for a working practice link.
              </Text>
              <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                Back to Home
              </Button>
            </Stack>
          </SurfaceCard>
        </motion.div>
      </div>
    )
  }

  // Success joining state
  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </motion.div>
          <Heading level={2} className="mb-2">Welcome, {studentName}!</Heading>
          <Text variant="muted" className="mb-4">Starting your practice session...</Text>
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        </motion.div>
      </div>
    )
  }

  // Main join form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <SurfaceCard variant="elevated">
          <Stack gap="lg">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
            >
              <Target className="h-8 w-8 text-primary" />
            </motion.div>

            {/* Title */}
            <div className="text-center">
              <Heading level={2} className="mb-2">
                {linkInfo?.title || 'Practice Session'}
              </Heading>
              <Text className="font-medium">{linkInfo?.course_title}</Text>
              {linkInfo?.concept_name && (
                <Text size="sm" variant="muted" className="mt-1">
                  Topic: {linkInfo.concept_name}
                </Text>
              )}
            </div>

            {/* Info badges */}
            <div className="flex justify-center gap-3">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {linkInfo?.questions_count} questions
              </Badge>
              {linkInfo?.time_limit_minutes && (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {linkInfo.time_limit_minutes} min
                </Badge>
              )}
            </div>

            {/* Join form */}
            <form onSubmit={handleJoin} className="space-y-4 pt-2">
              <div className="space-y-2">
                <LabelText className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Your Name
                </LabelText>
                <Input
                  placeholder="Enter your name to start"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                  minLength={1}
                  maxLength={100}
                  autoFocus
                  className="text-center text-lg"
                />
                <HelperText className="text-center">
                  No sign-up needed. Just type your name and start!
                </HelperText>
              </div>

              <Button 
                type="submit" 
                className="w-full gap-2" 
                size="lg"
                disabled={!studentName.trim() || joinMutation.isPending}
              >
                {joinMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Start Practice
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              {joinMutation.isError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <InfoPanel variant="error" className="text-center">
                    {(joinMutation.error as any)?.response?.data?.detail || 'Failed to join. Please try again.'}
                  </InfoPanel>
                </motion.div>
              )}
            </form>

            {/* Footer */}
            <div className="pt-2 space-y-1 text-center">
              <Text size="xs" variant="subtle">✓ Instant feedback after each answer</Text>
              <Text size="xs" variant="subtle">✓ Progress saved automatically</Text>
            </div>
          </Stack>
        </SurfaceCard>
      </motion.div>
    </div>
  )
}
