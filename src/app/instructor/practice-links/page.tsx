'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  MessageCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

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
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
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
      setCreateDialogOpen(false)
      resetForm()
      
      // Auto-copy the link
      navigator.clipboard.writeText(data.url)
      setCopiedLinkId(data.id)
      setTimeout(() => setCopiedLinkId(null), 2000)
      toast.success('Link copied to clipboard!')
    },
    onError: (error: any) => {
      const errorDetail = error.response?.data?.detail
      if (typeof errorDetail === 'object' && errorDetail?.error === 'no_questions_available') {
        toast.error('No practice questions available. Please approve concepts first to generate questions.', {
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
    toast.success('Link copied to clipboard!')
  }

  const copyTelegramMessage = (link: PracticeLink) => {
    const courseName = courses.find(c => c.id === link.course_id)?.title || 'Course'
    const message = `📚 Practice Time!\n\n${link.title || courseName}${link.concept_name ? `\nTopic: ${link.concept_name}` : ''}\n\n🔗 Join here: ${link.url}\n\n${link.questions_count} questions${link.time_limit_minutes ? ` • ${link.time_limit_minutes} min` : ''}\nNo registration needed - just enter your name!`
    
    navigator.clipboard.writeText(message)
    toast.success('Message copied! Paste in Telegram.')
  }

  // Auto-select first course if only one
  if (courses.length === 1 && !selectedCourseId) {
    setSelectedCourseId(courses[0].id)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Link2 className="h-8 w-8 text-primary" />
            Practice Links
          </h1>
          <p className="text-muted-foreground mt-1">
            Create shareable links for students to practice. No registration required.
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={!selectedCourseId}>
              <Plus className="h-4 w-4" />
              Create Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Practice Link</DialogTitle>
              <DialogDescription>
                Students can join with just their name and start practicing immediately.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  placeholder="e.g., Week 3 Practice, Midterm Review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="concept">Concept (optional)</Label>
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
                <p className="text-xs text-muted-foreground">
                  Leave empty to include questions from all concepts
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="questions">Questions</Label>
                  <Input
                    id="questions"
                    type="number"
                    min={5}
                    max={50}
                    value={questionsCount}
                    onChange={(e) => setQuestionsCount(parseInt(e.target.value) || 10)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (min)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min={5}
                    max={120}
                    placeholder="No limit"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses (optional)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for unlimited uses
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createLinkMutation.mutate()}
                disabled={createLinkMutation.isPending}
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
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Course Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Select Course</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCourses ? (
            <Skeleton className="h-10 w-full" />
          ) : courses.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No courses yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Create a course to start sharing practice links.</p>
            </div>
          ) : (
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger>
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
        </CardContent>
      </Card>

      {/* Practice Links List */}
      {selectedCourseId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Your Practice Links
            </CardTitle>
            <CardDescription>
              Share these links with students via Telegram, WhatsApp, or any messaging app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLinks ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : practiceLinks.length === 0 ? (
              <div className="text-center py-8">
                <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-1">Ready to share practice!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first link and share it with students via Telegram or WhatsApp.
                </p>
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Practice Link
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {practiceLinks.map((link) => (
                    <motion.div
                      key={link.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className={`p-4 border rounded-lg ${!link.is_active ? 'opacity-60 bg-muted/50' : ''}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium truncate">
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

                            {/* Link URL */}
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[300px]">
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

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
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
                                onClick={() => deleteMutation.mutate(link.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="text-xs text-muted-foreground mt-2">
                          Created {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
                          {link.expires_at && ` • Expires ${formatDistanceToNow(new Date(link.expires_at), { addSuffix: true })}`}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">1</span>
              <span><strong>Create a link</strong> – Pick how many questions (5-50) and an optional time limit</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">2</span>
              <span><strong>Share via Telegram</strong> – Click the message icon to copy a ready-to-send message</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">3</span>
              <span><strong>Students practice instantly</strong> – No sign-up, just name and go!</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">4</span>
              <span><strong>See results</strong> – Check the Students page for scores and progress</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
