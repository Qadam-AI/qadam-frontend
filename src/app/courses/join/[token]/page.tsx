'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, BookOpen, Users, GraduationCap, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface JoinLinkInfo {
  course_id: string
  course_title: string
  instructor_name: string
  enrolled_count: number
  link_name: string
}

export default function JoinCoursePage() {
  const params = useParams()
  const router = useRouter()
  const code = params.token as string

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch course info first (no auth required)
  const { data: courseInfo, isLoading: isLoadingInfo, error: infoError } = useQuery({
    queryKey: ['join-link-info', code],
    queryFn: async () => {
      const res = await api.get<JoinLinkInfo>(`/enrollments/join/${code}/info`)
      return res.data
    },
    retry: 1
  })

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/enrollments/join/${code}`)
      return res.data
    },
    onSuccess: (data) => {
      setStatus('success')
      toast.success('Successfully enrolled!')
    },
    onError: (error: any) => {
      setStatus('error')
      const detail = error.response?.data?.detail || error.response?.data?.message
      setErrorMessage(
        detail || 'Failed to join the course. The link may be expired or invalid.'
      )
    }
  })

  const handleJoin = () => {
    setStatus('loading')
    joinMutation.mutate()
  }

  // Show loading state while fetching course info
  if (isLoadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="text-center">
            <CardHeader className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl">Loading Course...</CardTitle>
              <CardDescription>
                Please wait while we fetch the course details.
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="overflow-hidden">
          {/* Gamification Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 text-white text-center">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <Badge className="mb-3 bg-white/20 text-white border-0 text-xs font-bold uppercase tracking-wider">
                🎓 Join Course
              </Badge>
              <div className="mx-auto w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              {courseInfo ? (
                <>
                  <h2 className="text-xl font-bold">{courseInfo.course_title}</h2>
                  <p className="text-white/80 text-sm mt-1">by {courseInfo.instructor_name}</p>
                  <div className="flex items-center justify-center gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {courseInfo.enrolled_count} enrolled
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold">Join Course</h2>
                  <p className="text-white/80 text-sm mt-1">You&apos;ve been given access to join a course</p>
                </>
              )}
            </div>
          </div>

          <CardContent className="p-6 space-y-4">
            {status === 'idle' && !infoError && (
              <>
                <p className="text-center text-muted-foreground">
                  Click below to join the course and start your learning journey.
                </p>
                <Button onClick={handleJoin} size="lg" className="w-full gap-2">
                  <Sparkles className="h-4 w-4" />
                  Accept & Join Course
                </Button>
                <Link href="/">
                  <Button variant="ghost" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </>
            )}

            {status === 'idle' && infoError && (
              <>
                <div className="text-center py-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
                    <XCircle className="h-6 w-6 text-amber-500" />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    This link may have expired or is invalid. Try joining anyway?
                  </p>
                </div>
                <Button onClick={handleJoin} size="lg" className="w-full gap-2">
                  <Sparkles className="h-4 w-4" />
                  Try to Join
                </Button>
                <Link href="/courses">
                  <Button variant="ghost" className="w-full">
                    Go to My Courses
                  </Button>
                </Link>
              </>
            )}

            {status === 'loading' && (
              <div className="text-center py-6">
                <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground">Enrolling you in the course...</p>
              </div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Successfully Enrolled!</h3>
                <p className="text-muted-foreground mb-6">
                  You&apos;re now enrolled in {courseInfo?.course_title || 'the course'}. 
                  Start learning right away!
                </p>
                <Link href="/courses">
                  <Button size="lg" className="w-full gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Go to My Courses
                  </Button>
                </Link>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Unable to Join</h3>
                <p className="text-destructive/80 mb-6">{errorMessage}</p>
                <div className="space-y-2">
                  <Button onClick={handleJoin} variant="outline" className="w-full">
                    Try Again
                  </Button>
                  <Link href="/courses">
                    <Button variant="ghost" className="w-full">
                      Go to My Courses
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Having trouble? Contact your instructor or{' '}
          <a href="mailto:shukrullo.coder@gmail.com" className="underline">
            support
          </a>
          .
        </p>
      </motion.div>
    </div>
  )
}
