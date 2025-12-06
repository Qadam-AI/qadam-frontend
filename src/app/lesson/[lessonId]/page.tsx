'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { lessonSchema } from '@/lib/validation'
import { Navbar } from '../../_components/navbar'
import { Sidebar } from '../../_components/sidebar'
import { Footer } from '../../_components/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '../../_components/empty-states'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, BookOpen, Play, Pause, Volume2, VolumeX, Maximize, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { AuthGuard } from '../../_components/auth-guard'
import Link from 'next/link'
import { AIAssistant } from '@/components/ai-assistant'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CourseLessons {
  id: string
  title: string
  lessons: { id: string; title: string; position: number }[]
}

function VideoPlayer({ 
  src, 
  onComplete 
}: { 
  src: string
  onComplete: () => void 
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasWatched80Percent, setHasWatched80Percent] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime
      const dur = videoRef.current.duration
      setCurrentTime(current)
      
      // Check if 80% watched
      const progress = (current / dur) * 100
      if (progress >= 80 && !hasWatched80Percent) {
        setHasWatched80Percent(true)
        onComplete()
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleVolumeToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
    }
  }

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        }
      }
      setIsFullscreen(!isFullscreen)
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    // Don't hide controls if dropdown is open
    if (!isDropdownOpen) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false)
      }, 3000)
    }
  }

  // Also prevent hiding when dropdown is open
  const handleMouseLeave = () => {
    if (isPlaying && !isDropdownOpen) {
      setShowControls(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video bg-black rounded-xl overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onClick={handlePlayPause}
      />

      {/* Play button overlay when paused */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
            onClick={handlePlayPause}
          >
            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <Play className="w-10 h-10 text-primary ml-1" fill="currentColor" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal controls overlay - no progress bar, no seeking */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Play/Pause */}
                <button 
                  onClick={handlePlayPause}
                  className="text-white hover:text-primary transition-colors"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                {/* Volume */}
                <button 
                  onClick={handleVolumeToggle}
                  className="text-white hover:text-primary transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                {/* Time display only */}
                <span className="text-white text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Playback speed - max 1.5x */}
                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <button className="text-white hover:text-primary transition-colors text-sm font-medium px-2 py-1 rounded bg-white/10">
                      {playbackRate}x
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8}>
                    {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
                      <DropdownMenuItem 
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={playbackRate === rate ? 'bg-primary/10' : ''}
                      >
                        {rate}x {rate === 1.5 && '(max)'}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Fullscreen */}
                <button 
                  onClick={handleFullscreen}
                  className="text-white hover:text-primary transition-colors"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LessonContent() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const lessonId = params.lessonId as string

  const [canComplete, setCanComplete] = useState(false)
  const [watchedSeconds, setWatchedSeconds] = useState(0)

  // Fetch current lesson
  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const response = await api.get(`/lessons/${lessonId}`)
      return lessonSchema.parse(response.data)
    },
  })

  // Fetch completed lessons to check if this one is done
  const { data: completedLessons } = useQuery<string[]>({
    queryKey: ['completed-lessons'],
    queryFn: async () => {
      const response = await api.get('/lessons/progress')
      return response.data
    },
  })

  const isCompleted = completedLessons?.includes(lessonId) ?? false

  // Fetch course with all lessons for navigation
  const { data: courseData } = useQuery<CourseLessons | null>({
    queryKey: ['course-lessons', lesson?.courseId],
    queryFn: async () => {
      if (!lesson?.courseId) return null
      const response = await api.get(`/courses/${lesson.courseId}`)
      return {
        id: response.data.id,
        title: response.data.title,
        lessons: (response.data.lessons || []).sort(
          (a: any, b: any) => a.position - b.position
        ),
      }
    },
    enabled: !!lesson?.courseId,
  })

  // Find prev/next lessons
  const currentIndex = courseData?.lessons.findIndex(l => l.id === lessonId) ?? -1
  const prevLesson = currentIndex > 0 ? courseData?.lessons[currentIndex - 1] : null
  const nextLesson = currentIndex >= 0 && currentIndex < (courseData?.lessons.length ?? 0) - 1 
    ? courseData?.lessons[currentIndex + 1] 
    : null

  const completeLessonMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/lessons/${lessonId}/complete`, {
        watchSeconds: Math.floor(watchedSeconds),
        completed: true,
      })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mastery'] })
      queryClient.invalidateQueries({ queryKey: ['completed-lessons'] })
      toast.success('Lesson completed!', {
        description: nextLesson ? 'Continue to the next lesson' : 'Great job finishing this course section!',
      })
    },
    onError: () => {
      toast.error('Failed to complete lesson')
    },
  })

  const handleVideoComplete = () => {
    if (!canComplete) {
      setCanComplete(true)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-96" />
        <Skeleton className="aspect-video w-full rounded-xl" />
      </div>
    )
  }

  if (error || !lesson) {
    return <ErrorState error="Failed to load lesson" />
  }

  return (
    <div className="space-y-6">
      {/* Back & Course Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-4"
      >
        <Link href="/lessons">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            All Lessons
          </Button>
        </Link>
        {courseData && (
          <>
            <span className="text-muted-foreground">/</span>
            <Badge variant="secondary">{courseData.title}</Badge>
            <span className="text-muted-foreground text-sm">
              Lesson {currentIndex + 1} of {courseData.lessons.length}
            </span>
          </>
        )}
      </motion.div>

      {/* Lesson Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex items-center gap-3"
      >
        <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
        {isCompleted && (
          <Badge variant="default" className="bg-green-500 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </Badge>
        )}
      </motion.div>

      {/* Video Player */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {lesson.videoUrl ? (
          <VideoPlayer 
            src={lesson.videoUrl} 
            onComplete={handleVideoComplete}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No video available for this lesson</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Concepts Covered */}
      {lesson.concepts && lesson.concepts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Concepts Covered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lesson.concepts.map((concept) => (
                  <Badge key={concept.id} variant="secondary" className="capitalize">
                    {concept.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Navigation & Complete */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex items-center justify-between pt-4 border-t"
      >
        {/* Previous */}
        <div>
          {prevLesson ? (
            <Link href={`/lesson/${prevLesson.id}`}>
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{prevLesson.title}</span>
                <span className="sm:hidden">Previous</span>
              </Button>
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* Complete & Next */}
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
              <CheckCircle2 className="w-3 h-3" />
              Already Completed
            </Badge>
          ) : (canComplete || !lesson.videoUrl) && (
            <Button
              onClick={() => completeLessonMutation.mutate()}
              disabled={completeLessonMutation.isPending}
              variant="default"
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {completeLessonMutation.isPending ? 'Saving...' : 'Complete'}
            </Button>
          )}
          
          {nextLesson && (
            <Link href={`/lesson/${nextLesson.id}`}>
              <Button variant={canComplete ? "outline" : "secondary"} className="gap-2">
                <span className="hidden sm:inline">{nextLesson.title}</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function LessonPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-8 lg:ml-64">
            <div className="container max-w-4xl mx-auto">
              <LessonContent />
            </div>
          </main>
        </div>
        <Footer />
        {/* AI Assistant for lesson Q&A */}
        <AIAssistant context="Learning Python programming with video lessons" />
      </div>
    </AuthGuard>
  )
}

