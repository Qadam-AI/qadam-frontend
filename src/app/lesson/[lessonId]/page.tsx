'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { lessonSchema } from '@/lib/validation'
import { Navbar } from '../../_components/navbar'
import { Sidebar } from '../../_components/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { 
  CheckCircle2, 
  BookOpen, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  FileText, 
  Link as LinkIcon, 
  Download, 
  ExternalLink,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { AuthGuard } from '../../_components/auth-guard'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Design System
import { PageShell, Stack } from '@/design-system/layout'
import { SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'

interface CourseLessons {
  id: string
  title: string
  lessons: { id: string; title: string; position: number }[]
}

function VideoPlayer({ 
  src,
  qualities,
  onComplete 
}: { 
  src: string
  qualities?: Record<string, string>
  onComplete: () => void 
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [selectedQuality, setSelectedQuality] = useState<string>("auto")
  const [currentSrc, setCurrentSrc] = useState(src)
  const [showControls, setShowControls] = useState(true)
  const [hasWatched80Percent, setHasWatched80Percent] = useState(false)
  const maxWatchedRef = useRef(0)
  const [maxWatched, setMaxWatched] = useState(0)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Determine available qualities
  const availableQualities = qualities && Object.keys(qualities).length > 0
    ? ["auto", ...Object.keys(qualities).sort((a, b) => {
        const aNum = parseInt(a)
        const bNum = parseInt(b)
        return aNum - bNum
      })]
    : null

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Handle quality change
  const handleQualityChange = (quality: string) => {
    if (!videoRef.current || !qualities) return
    
    const wasPlaying = !videoRef.current.paused
    const currentTimeBeforeChange = videoRef.current.currentTime
    
    // Determine new source
    let newSrc = src
    if (quality !== "auto") {
      newSrc = qualities[quality] || src
    }
    
    setSelectedQuality(quality)
    setCurrentSrc(newSrc)
    
    // Wait for video to load then restore position and play state
    if (videoRef.current) {
      videoRef.current.src = newSrc
      videoRef.current.currentTime = currentTimeBeforeChange
      if (wasPlaying) {
        videoRef.current.play()
      }
    }
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

      // Track maximum watched position (allow small buffer for buffering jumps)
      if (current > maxWatchedRef.current) {
        maxWatchedRef.current = current
        setMaxWatched(current)
      }
      
      const progress = (current / dur) * 100
      if (progress >= 80 && !hasWatched80Percent) {
        setHasWatched80Percent(true)
        onComplete()
      }
    }
  }

  // Prevent seeking forward past maxWatched
  const handleSeeking = () => {
    if (videoRef.current) {
      const seekTarget = videoRef.current.currentTime
      const allowed = maxWatchedRef.current + 2 // 2s tolerance
      if (seekTarget > allowed) {
        videoRef.current.currentTime = maxWatchedRef.current
        setCurrentTime(maxWatchedRef.current)
      }
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  // Prevent right-click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    return false
  }

  // Handle progress bar click — only allow seeking backward
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current || duration === 0) return
    const rect = progressRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    const targetTime = pct * duration
    const allowed = maxWatchedRef.current + 2
    // Only allow seeking to a position already watched
    if (targetTime <= allowed) {
      videoRef.current.currentTime = targetTime
      setCurrentTime(targetTime)
    }
  }

  // Prevent keyboard seeking shortcuts
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block arrow keys for seeking forward
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        if (videoRef.current && videoRef.current.currentTime >= maxWatchedRef.current) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [])

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0
  const maxWatchedPct = duration > 0 ? (maxWatched / duration) * 100 : 0

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video bg-black rounded-xl overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onContextMenu={handleContextMenu}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={currentSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onSeeking={handleSeeking}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={handlePlayPause}
        onContextMenu={handleContextMenu}
        preload="auto"
        playsInline
        controlsList="nodownload"
        disablePictureInPicture
      />

      {/* Play button overlay */}
      {!isPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={handlePlayPause}
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
            <Play className="w-10 h-10 text-primary ml-1" fill="currentColor" />
          </div>
        </motion.div>
      )}

      {/* Controls */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
        >
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="relative w-full h-2 bg-white/20 rounded-full mb-3 cursor-pointer group"
            onClick={handleProgressClick}
          >
            {/* Max watched indicator */}
            <div
              className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
              style={{ width: `${Math.min(maxWatchedPct, 100)}%` }}
            />
            {/* Current position */}
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-[width] duration-100"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
            {/* Scrubber handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${Math.min(progressPct, 100)}% - 7px)` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={handlePlayPause} className="text-white hover:text-primary transition-colors">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button 
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted
                    setIsMuted(!isMuted)
                  }
                }}
                className="text-white hover:text-primary transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <span className="text-white text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {/* Quality selector */}
              {availableQualities && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-white hover:text-primary transition-colors text-sm font-medium px-2 py-1 rounded bg-white/10">
                      {selectedQuality === "auto" ? "Auto" : selectedQuality}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {availableQualities.map((quality) => (
                      <DropdownMenuItem 
                        key={quality}
                        onClick={() => handleQualityChange(quality)}
                        className={selectedQuality === quality ? "bg-primary/10" : ""}
                      >
                        {quality === "auto" ? "Auto" : quality}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Playback speed */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-white hover:text-primary transition-colors text-sm font-medium px-2 py-1 rounded bg-white/10">
                    {playbackRate}x
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
                    <DropdownMenuItem 
                      key={rate}
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.playbackRate = rate
                          setPlaybackRate(rate)
                        }
                      }}
                    >
                      {rate}x
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={() => {
                  if (containerRef.current) {
                    if (document.fullscreenElement) {
                      document.exitFullscreen()
                    } else {
                      containerRef.current.requestFullscreen()
                    }
                  }
                }}
                className="text-white hover:text-primary transition-colors"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function LessonContent() {
  const params = useParams()
  const queryClient = useQueryClient()
  const lessonId = params.lessonId as string

  const [canComplete, setCanComplete] = useState(false)
  const [watchedSeconds, setWatchedSeconds] = useState(0)

  // Fetch current lesson
  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      try {
        const response = await api.get(`/lessons/${lessonId}`)
        const parsed = lessonSchema.parse(response.data)
        return parsed
      } catch (err) {
        console.error('Lesson fetch/parse error:', err, 'Raw data:', err)
        throw err
      }
    },
  })

  // Fetch completed lessons
  const { data: completedLessons } = useQuery<string[]>({
    queryKey: ['completed-lessons'],
    queryFn: async () => {
      const response = await api.get('/lessons/progress')
      return response.data
    },
  })

  const isCompleted = completedLessons?.includes(lessonId) ?? false

  // Fetch course for navigation
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

  // Navigation
  const lessons = courseData?.lessons ?? []
  const currentIndex = lessons.findIndex(l => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 
    ? lessons[currentIndex + 1] 
    : null

  const completeLessonMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/lessons/${lessonId}/complete`, {
        watchSeconds: Math.floor(watchedSeconds),
        completed: true,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mastery'] })
      queryClient.invalidateQueries({ queryKey: ['completed-lessons'] })
      toast.success('Lesson completed!')
    },
    onError: () => {
      toast.error('Failed to mark as complete')
    },
  })

  const handleVideoComplete = () => {
    if (!canComplete) {
      setCanComplete(true)
    }
  }

  if (isLoading) {
    return (
      <PageShell maxWidth="2xl">
        <LoadingState message="Loading lesson..." />
      </PageShell>
    )
  }

  if (error || !lesson) {
    console.error('Lesson error or not found:', { error, lesson, lessonId })
    return (
      <PageShell maxWidth="2xl">
        <EmptyState 
          icon={BookOpen}
          title="Lesson not found"
          description={error ? `Error: ${(error as any)?.message || 'Unknown error'}` : "The lesson you're looking for doesn't exist or has been removed."}
          action={{
            label: 'Back to Courses',
            onClick: () => window.location.href = '/courses'
          }}
        />
      </PageShell>
    )
  }

  const progressText = courseData && currentIndex >= 0 
    ? `Lesson ${currentIndex + 1} of ${courseData.lessons.length}`
    : ''

  return (
    <PageShell maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/lessons">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              All Lessons
            </Button>
          </Link>
          {courseData && (
            <>
              <Text variant="muted">/</Text>
              <Badge variant="secondary">{courseData.title}</Badge>
              {progressText && (
                <Text size="sm" variant="muted">{progressText}</Text>
              )}
            </>
          )}
        </div>

        {/* Title */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Heading level={1} className="mb-2">{lesson.title}</Heading>
            {lesson.description && (
              <Text variant="muted" className="text-lg">{lesson.description}</Text>
            )}
          </div>
          {isCompleted && (
            <Badge variant="default" className="bg-green-600 gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </Badge>
          )}
        </div>

        {/* Video */}
        {lesson.videoUrl && (
          <VideoPlayer 
            src={lesson.videoUrl}
            qualities={lesson.videoQualities} 
            onComplete={handleVideoComplete}
          />
        )}

        {/* Content */}
        {lesson.content && (
          <SurfaceCard>
            <Stack gap="md">
              <LabelText className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Lesson Content
              </LabelText>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: ({ className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '')
                      return match ? (
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                          <code className={`language-${match[1]}`} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      )
                    },
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {lesson.content}
                </ReactMarkdown>
              </div>
            </Stack>
          </SurfaceCard>
        )}

        {/* Resources */}
        {((lesson.resources && lesson.resources.length > 0) || (lesson.attachments && lesson.attachments.length > 0)) && (
          <SurfaceCard>
            <Stack gap="md">
              <LabelText className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Additional Resources
              </LabelText>
              <div className="space-y-2">
                {lesson.resources?.map((resource, i) => (
                  <a
                    key={`resource-${i}`}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <Badge variant="outline">{resource.type}</Badge>
                    <span className="flex-1 font-medium group-hover:text-primary">
                      {resource.title || resource.name || resource.url}
                    </span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                ))}
                {lesson.attachments?.map((attachment, i) => (
                  <a
                    key={`attachment-${i}`}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <Badge variant="secondary">{attachment.type}</Badge>
                    <span className="flex-1 font-medium group-hover:text-primary">
                      {attachment.name || attachment.title || 'Attachment'}
                    </span>
                    <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                ))}
              </div>
            </Stack>
          </SurfaceCard>
        )}

        {/* Key Concepts */}
        {lesson.concepts && lesson.concepts.length > 0 && (
          <SurfaceCard variant="muted">
            <Stack gap="md">
              <LabelText>Key Concepts</LabelText>
              <div className="flex flex-wrap gap-2">
                {lesson.concepts.map((concept) => (
                  <Badge key={concept.id} variant="secondary" className="text-sm px-3 py-1.5">
                    {concept.name}
                  </Badge>
                ))}
              </div>
            </Stack>
          </SurfaceCard>
        )}

        {/* What's Next */}
        {(canComplete || !lesson.videoUrl) && !isCompleted && (
          <InfoPanel icon={Sparkles} title="Ready to Practice?" variant="info">
            <Text size="sm">
              Complete this lesson and start practicing to reinforce what you've learned.
            </Text>
          </InfoPanel>
        )}

        {/* Navigation & Complete */}
        <div className="flex items-center justify-between pt-6 border-t">
          {prevLesson ? (
            <Link href={`/lesson/${prevLesson.id}`}>
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="w-4 w-4" />
                <span className="hidden sm:inline">{prevLesson.title}</span>
                <span className="sm:hidden">Previous</span>
              </Button>
            </Link>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {isCompleted ? (
              <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                <CheckCircle2 className="w-3 h-3" />
                Completed
              </Badge>
            ) : (canComplete || !lesson.videoUrl) && (
              <Button
                onClick={() => completeLessonMutation.mutate()}
                disabled={completeLessonMutation.isPending}
                size="lg"
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {completeLessonMutation.isPending ? 'Saving...' : 'Complete Lesson'}
              </Button>
            )}
            
            {nextLesson && (
              <Link href={`/lesson/${nextLesson.id}`}>
                <Button variant={canComplete ? "default" : "outline"} size="lg" className="gap-2">
                  <span className="hidden sm:inline">{nextLesson.title}</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            )}

            {!nextLesson && isCompleted && (
              <Link href="/practice">
                <Button size="lg" className="gap-2">
                  Start Practice
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </PageShell>
  )
}

export default function LessonPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 lg:ml-64">
            <LessonContent />
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
