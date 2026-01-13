'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Link2, Plus, Copy, Share2, Trash2, Users, Calendar,
  CheckCircle2, XCircle, ExternalLink, QrCode, Eye,
  EyeOff, Clock, Infinity
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'

interface Course {
  id: string
  title: string
  lesson_count: number
  student_count: number
}

interface JoinLink {
  id: string
  code: string
  url: string
  max_uses: number | null
  uses_count: number
  is_active: boolean
  expires_at: string | null
  created_at: string
}

export default function JoinLinksPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteLink, setDeleteLink] = useState<JoinLink | null>(null)
  const [form, setForm] = useState({
    max_uses: '',
    expires_in_days: '',
  })

  // Fetch instructor courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const res = await api.get<Course[]>('/instructor/courses')
      return res.data
    },
  })

  // Fetch join links for selected course
  const { data: joinLinks, isLoading: linksLoading } = useQuery({
    queryKey: ['join-links', selectedCourse],
    queryFn: async () => {
      const res = await api.get<JoinLink[]>(`/instructor/courses/${selectedCourse}/join-links`)
      return res.data
    },
    enabled: !!selectedCourse,
  })

  // Create join link mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<JoinLink>(`/instructor/courses/${selectedCourse}/join-links`, {
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_in_days: form.expires_in_days ? parseInt(form.expires_in_days) : null,
      })
      return res.data
    },
    onSuccess: (link) => {
      toast.success('Join link created!')
      queryClient.invalidateQueries({ queryKey: ['join-links', selectedCourse] })
      setIsDialogOpen(false)
      setForm({ max_uses: '', expires_in_days: '' })
      copyToClipboard(link.url)
    },
    onError: () => {
      toast.error('Failed to create join link')
    },
  })

  // Delete join link mutation
  const deleteMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await api.delete(`/instructor/join-links/${linkId}`)
    },
    onSuccess: () => {
      toast.success('Join link deleted')
      queryClient.invalidateQueries({ queryKey: ['join-links', selectedCourse] })
      setDeleteLink(null)
    },
    onError: () => {
      toast.error('Failed to delete join link')
    },
  })

  // Deactivate join link mutation
  const deactivateMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await api.patch(`/instructor/join-links/${linkId}/deactivate`)
    },
    onSuccess: () => {
      toast.success('Join link deactivated')
      queryClient.invalidateQueries({ queryKey: ['join-links', selectedCourse] })
    },
    onError: () => {
      toast.error('Failed to deactivate join link')
    },
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Link copied to clipboard!')
  }

  const selectedCourseData = courses?.find(c => c.id === selectedCourse)

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header - Clean style */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold tracking-tight">Join Links</h1>
        <p className="text-muted-foreground mt-2">
          Create shareable links for students to join your courses easily.
        </p>
      </motion.div>

      {/* Course Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Course</CardTitle>
          <CardDescription>Choose a course to manage its join links</CardDescription>
        </CardHeader>
        <CardContent>
          {coursesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses?.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    <div className="flex items-center gap-2">
                      <span>{course.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {course.student_count} students
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedCourse && (
        <>
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{selectedCourseData?.title}</h2>
              <p className="text-sm text-muted-foreground">
                {joinLinks?.length || 0} active join links
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Join Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Join Link</DialogTitle>
                  <DialogDescription>
                    Generate a shareable link for students to join this course
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Max Uses (optional)</Label>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      value={form.max_uses}
                      onChange={(e) => setForm(prev => ({ ...prev, max_uses: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for unlimited uses</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Expires In (days)</Label>
                    <Select
                      value={form.expires_in_days || 'never'}
                      onValueChange={(v) => setForm(prev => ({ ...prev, expires_in_days: v === 'never' ? '' : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Never expires" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never expires</SelectItem>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Link'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Join Links List */}
          {linksLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : joinLinks?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Link2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No Join Links Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create a join link to let students enroll in your course
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Link
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {joinLinks?.map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={!link.is_active ? 'opacity-60' : ''}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${
                              link.is_active 
                                ? 'bg-green-100 dark:bg-green-900/30' 
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              <Link2 className={`h-5 w-5 ${
                                link.is_active ? 'text-green-600' : 'text-gray-400'
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                                  {link.code}
                                </code>
                                <Badge variant={link.is_active ? 'default' : 'secondary'}>
                                  {link.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {link.uses_count}
                                  {link.max_uses ? ` / ${link.max_uses}` : ''} uses
                                </span>
                                <span className="flex items-center gap-1">
                                  {link.expires_at ? (
                                    <>
                                      <Calendar className="h-4 w-4" />
                                      Expires {formatDistanceToNow(new Date(link.expires_at), { addSuffix: true })}
                                    </>
                                  ) : (
                                    <>
                                      <Infinity className="h-4 w-4" />
                                      Never expires
                                    </>
                                  )}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  Created {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(link.url)}
                              className="gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(link.url, '_blank')}
                              className="gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Preview
                            </Button>
                            {link.is_active && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deactivateMutation.mutate(link.id)}
                                disabled={deactivateMutation.isPending}
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setDeleteLink(link)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Progress bar for max uses */}
                        {link.max_uses && (
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Usage</span>
                              <span>{Math.round((link.uses_count / link.max_uses) * 100)}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all"
                                style={{ width: `${Math.min((link.uses_count / link.max_uses) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteLink} onOpenChange={() => setDeleteLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Join Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the join link <code className="font-mono">{deleteLink?.code}</code>.
              Students who have this link will no longer be able to use it to join the course.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteLink && deleteMutation.mutate(deleteLink.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
