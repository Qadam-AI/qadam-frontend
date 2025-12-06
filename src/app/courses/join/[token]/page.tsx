'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function JoinCoursePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [courseTitle, setCourseTitle] = useState<string | null>(null)

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/v1/instructor/enroll/${token}`)
      return res.data
    },
    onSuccess: (data) => {
      setStatus('success')
      setCourseTitle(data.course_title || 'the course')
      toast.success('Successfully enrolled!')
    },
    onError: (error: any) => {
      setStatus('error')
      setErrorMessage(
        error.response?.data?.detail || 
        'Failed to join the course. The invitation may be expired or invalid.'
      )
    }
  })

  const handleJoin = () => {
    setStatus('loading')
    acceptMutation.mutate()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="text-center">
          <CardHeader className="space-y-4">
            {status === 'idle' && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Course Invitation</CardTitle>
                <CardDescription>
                  You've been invited to join a course. Click below to accept 
                  the invitation and start learning.
                </CardDescription>
              </>
            )}

            {status === 'loading' && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <CardTitle className="text-2xl">Joining Course...</CardTitle>
                <CardDescription>
                  Please wait while we enroll you in the course.
                </CardDescription>
              </>
            )}

            {status === 'success' && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center"
                >
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </motion.div>
                <CardTitle className="text-2xl">Successfully Enrolled!</CardTitle>
                <CardDescription>
                  You've been enrolled in {courseTitle}. 
                  You can now access all the course materials.
                </CardDescription>
              </>
            )}

            {status === 'error' && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center"
                >
                  <XCircle className="h-8 w-8 text-destructive" />
                </motion.div>
                <CardTitle className="text-2xl">Unable to Join</CardTitle>
                <CardDescription className="text-destructive">
                  {errorMessage}
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {status === 'idle' && (
              <>
                <Button onClick={handleJoin} size="lg" className="w-full">
                  Accept Invitation
                </Button>
                <Link href="/">
                  <Button variant="ghost" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </>
            )}

            {status === 'success' && (
              <Link href="/courses">
                <Button size="lg" className="w-full">
                  Go to My Courses
                </Button>
              </Link>
            )}

            {status === 'error' && (
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
