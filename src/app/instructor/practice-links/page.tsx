'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Link2,
  Plus,
  Copy,
  Check,
  Loader2,
  MoreVertical,
  Trash2,
  Ban,
  ExternalLink,
  Users,
  Clock,
  BookOpen,
  Target,
  Share2,
  MessageCircle,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { useTranslations } from '@/lib/i18n'

// Design System
import { PageShell, PageHeader, Section, Grid, Stack } from '@/design-system/layout'
import { SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { EmptyState, LoadingState } from '@/design-system/feedback'
import { ModalLayout } from '@/design-system/patterns/modal-layout'
import { LabelText, HelperText } from '@/design-system/typography'

interface Course {
  id: string
  title: string
  description?: string
  student_count: number
  lesson_count: number
}

interface Concept {
  id: string
  name: string
  course_id: string
}

interface PracticeLink {
  id: string
  code: string
  url: string
  title: string | null
  course_id: string
  lesson_id: string | null
  concept_id: string | null
  concept_name: string | null
  questions_count: number
  time_limit_minutes: number | null
  max_uses: number | null
  uses_count: number
  is_active: boolean
  expires_at: string | null
  created_at: string
}

export default function PracticeLinksPage() {
  const tPilot = useTranslations('pilotPracticeLinks')
  const queryClient = useQueryClient()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)
  
  // Form state
  const [title, setTitle] = useState('')
  const [conceptId, setConceptId] = useState<string>('')
  const [questionsCount, setQuestionsCount] = useState(10)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<string>('')
  const [maxUses, setMaxUses] = useState<string>('')

  // Fetch instructor courses
  const { data: courses = [], isLoading: loadingCourses } = useQuery<Course[]>({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const res = await api.get('/instructor/courses')
      return res.data
    },
  })

  // Fetch concepts for selected course
  const { data: concepts = [] } = useQuery<Concept[]>({
    queryKey: ['course-concepts', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return []
      const res = await api.get(`/instructor/courses/${selectedCourseId}/concepts`)
      return res.data
    },
    enabled: !!selectedCourseId,
  })

  // Fetch practice links for selected course
  const { data: practiceLinks = [], isLoading: loadingLinks } = useQuery<PracticeLink[]>({
    queryKey: ['practice-links', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return []
      const res = await api.get(`/instructor/courses/${selectedCourseId}/practice-links`)
      return res.data
    },
    enabled: !!selectedCourseId,
  })

  // Create practice link mutation
  const createLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/instructor/courses/${selectedCourseId}/practice-links`, {
        title: title || null,
        concept_id: (conceptId && conceptId !== 'all') ? conceptId : null,
        questions_count: questionsCount,
        time_limit_minutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : null,
        max_uses: maxUses ? parseInt(maxUses) : null,
      })
      return res.data
    },
    onSuccess: (data) => {
      toast.success('Practice link created!')
      queryClient.invalidateQueries({ queryKey: ['practice-links', selectedCourseId] })
      setCreateModalOpen(false)
      resetForm()
      
      navigator.clipboard.writeText(data.url)
      setCopiedLinkId(data.id)
      setTimeout(() => setCopiedLinkId(null), 2000)
      toast.success('Link copied to clipboard!')
    },
    onError: (error: any) => {
      const errorDetail = error.response?.data?.detail
      if (typeof errorDetail === 'object' && errorDetail?.error === 'no_questions_available') {
        toast.error('No practice questions available. Please extract concepts and generate questions first.', {
          duration: 5000,
        })
      } else {
        toast.error(typeof errorDetail === 'string' ? errorDetail : 'Failed to create practice link')
      }
    },
  })

  // Deactivate link mutation
  const deactivateMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await api.patch(`/instructor/practice-links/${linkId}/deactivate`)
    },
    onSuccess: () => {
      toast.success('Practice link deactivated')
      queryClient.invalidateQueries({ queryKey: ['practice-links', selectedCourseId] })
    },
  })

  // Delete link mutation
  const deleteMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await api.delete(`/instructor/practice-links/${linkId}`)
    },
    onSuccess: () => {
      toast.success('Practice link deleted')
      queryClient.invalidateQueries({ queryKey: ['practice-links', selectedCourseId] })
    },
  })

  const resetForm = () => {
    setTitle('')
    setConceptId('')
    setQuestionsCount(10)
    setTimeLimitMinutes('')
    setMaxUses('')
  }

  const copyLink = (link: PracticeLink) => {
    navigator.clipboard.writeText(link.url)
    setCopiedLinkId(link.id)
    setTimeout(() => setCopiedLinkId(null), 2000)
    toast.success('Link copied!')
  }

  const copyTelegramMessage = (link: PracticeLink) => {
    const courseName = courses.find(c => c.id === link.course_id)?.title || 'Course'
    const title = link.title || courseName
    const topicLine = link.concept_name ? tPilot('telegramTopicLine', { topic: link.concept_name }) : ''
    const timePart = link.time_limit_minutes ? tPilot('telegramTimePart', { minutes: link.time_limit_minutes }) : ''
    const message = tPilot('telegramMessage', {
      title,
      topicLine,
      url: link.url,
      questions: link.questions_count,
      timePart,
    })
    
    navigator.clipboard.writeText(message)
    toast.success(tPilot('telegramCopiedToast'))
  }

  // Auto-select first course if only one
  if (courses.length === 1 && !selectedCourseId) {
    setSelectedCourseId(courses[0].id)
  }

  return (
    <PageShell maxWidth="xl">
      <PageHeader
        title={tPilot('title')}
        description={tPilot('description')}
        action={
          <Button 
            className="gap-2" 
            disabled={!selectedCourseId}
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {tPilot('createLink')}
          </Button>
        }
      />

      {/* Course Selector */}
      <Section>
        <SurfaceCard variant="muted">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <LabelText className="mb-2">Course</LabelText>
              {loadingCourses ? (
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              ) : courses.length === 0 ? (
                <InfoPanel variant="warning">
                  No courses yet. Create a course to start sharing practice links.
                </InfoPanel>
              ) : (
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </SurfaceCard>
      </Section>

      {/* Practice Links List */}
      {selectedCourseId && (
        <Section
          title="Your Practice Links"
          description="Share these links with students via Telegram, WhatsApp, or any messaging app"
        >
          {loadingLinks ? (
            <LoadingState message="Loading practice links..." />
          ) : practiceLinks.length === 0 ? (
            <SurfaceCard variant="muted" className="py-12">
              <EmptyState
                icon={Link2}
                title="Ready to share practice!"
                description="Create your first link and share it with students via messaging apps"
                action={{
                  label: tPilot('createLink'),
                  onClick: () => setCreateModalOpen(true)
                }}
              />
            </SurfaceCard>
          ) : (
            <Stack gap="md">
              {practiceLinks.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <SurfaceCard 
                    className={`group hover:shadow-md transition-all ${
                      !link.is_active ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">
                            {link.title || `Practice ${link.code}`}
                          </h3>
                          {!link.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                          {link.concept_name && (
                            <span className="flex items-center gap-1">
                              <Target className="h-3.5 w-3.5" />
                              {link.concept_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            {link.questions_count} questions
                          </span>
                          {link.time_limit_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {link.time_limit_minutes} min
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {link.uses_count}{link.max_uses ? `/${link.max_uses}` : ''} used
                          </span>
                        </div>

                        {/* Link URL with Actions */}
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                          <code className="text-xs flex-1 truncate">
                            {link.url}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyLink(link)}
                            className="shrink-0"
                          >
                            {copiedLinkId === link.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyTelegramMessage(link)}
                            title="Copy message for Telegram"
                            className="shrink-0"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(link.url, '_blank')}
                            className="shrink-0"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {link.is_active && (
                            <DropdownMenuItem
                              onClick={() => deactivateMutation.mutate(link.id)}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              if (confirm('Delete this practice link?')) {
                                deleteMutation.mutate(link.id)
                              }
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Created {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
                      {link.expires_at && ` • Expires ${formatDistanceToNow(new Date(link.expires_at), { addSuffix: true })}`}
                    </div>
                  </SurfaceCard>
                </motion.div>
              ))}
            </Stack>
          )}
        </Section>
      )}

      {/* Quick Start Guide */}
      {selectedCourseId && (
        <Section>
          <InfoPanel icon={Share2} title="Quick Start Guide" variant="info">
            <ol className="space-y-2 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">1</span>
                <span><strong>Create a link</strong> – Pick how many questions (5-50) and an optional time limit</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">2</span>
                <span><strong>Share via Telegram</strong> – Click the message icon to copy a ready-to-send message</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">3</span>
                <span><strong>Students practice instantly</strong> – No sign-up, just name and go!</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">4</span>
                <span><strong>See results</strong> – Check the Students page for scores and progress</span>
              </li>
            </ol>
          </InfoPanel>
        </Section>
      )}

      {/* Create Link Modal */}
      <ModalLayout
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Practice Link"
        description="Students can join with just their name and start practicing immediately"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createLinkMutation.mutate()}
              disabled={createLinkMutation.isPending || !selectedCourseId}
              className="gap-2"
            >
              {createLinkMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Create & Copy
                </>
              )}
            </Button>
          </>
        }
      >
        <Stack gap="md">
          <div className="space-y-2">
            <LabelText>Title (Optional)</LabelText>
            <Input
              placeholder="e.g., Week 3 Practice, Midterm Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <HelperText>Give this link a memorable name</HelperText>
          </div>

          <div className="space-y-2">
            <LabelText>Concept (Optional)</LabelText>
            <Select value={conceptId} onValueChange={setConceptId}>
              <SelectTrigger>
                <SelectValue placeholder="All concepts in course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All concepts</SelectItem>
                {concepts.map((concept) => (
                  <SelectItem key={concept.id} value={concept.id}>
                    {concept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <HelperText>Filter questions to a specific concept or include all</HelperText>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <LabelText>Questions</LabelText>
              <Input
                type="number"
                min={5}
                max={50}
                value={questionsCount}
                onChange={(e) => setQuestionsCount(parseInt(e.target.value) || 10)}
              />
              <HelperText>5-50 questions</HelperText>
            </div>

            <div className="space-y-2">
              <LabelText>Time Limit (min)</LabelText>
              <Input
                type="number"
                min={5}
                max={120}
                placeholder="No limit"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
              />
              <HelperText>Optional</HelperText>
            </div>
          </div>

          <div className="space-y-2">
            <LabelText>Max Uses</LabelText>
            <Input
              type="number"
              min={1}
              placeholder="Unlimited"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
            <HelperText>Leave empty for unlimited uses</HelperText>
          </div>

          <InfoPanel variant="info">
            After creating, the link will be automatically copied to your clipboard. Share it via any messaging app!
          </InfoPanel>
        </Stack>
      </ModalLayout>
    </PageShell>
  )
}
