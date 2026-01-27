'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  BookOpen, 
  Users, 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Eye,
  EyeOff,
  Search,
  Video
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'

// Design System
import { PageShell, PageHeader, Section, Grid } from '@/design-system/layout'
import { SurfaceCard } from '@/design-system/surfaces'
import { EmptyState, LoadingState } from '@/design-system/feedback'
import { ModalLayout } from '@/design-system/patterns/modal-layout'
import { LabelText, ErrorText } from '@/design-system/typography'
import { Textarea } from '@/components/ui/textarea'

interface Course {
  id: string
  title: string
  description: string | null
  language: string
  is_published: boolean
  thumbnail_url: string | null
  cover_image_url: string | null
  lesson_count: number
  student_count: number
  created_at: string
}

export default function InstructorCoursesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const { data: courses, isLoading } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const res = await api.get<Course[]>('/instructor/courses')
      return res.data
    }
  })

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      await api.patch(`/instructor/courses/${id}`, { is_published })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      toast.success('Course updated')
    },
    onError: () => {
      toast.error('Failed to update course')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title: string; description: string }) => {
      await api.patch(`/instructor/courses/${id}`, { title, description })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      toast.success('Course updated')
      setEditCourse(null)
    },
    onError: () => {
      toast.error('Failed to update course')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/instructor/courses/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      toast.success('Course deleted')
      setDeleteId(null)
      setDeleteConfirmText('')
    },
    onError: () => {
      toast.error('Failed to delete course. It may have active students.')
      setDeleteId(null)
      setDeleteConfirmText('')
    }
  })

  const openEditModal = (course: Course) => {
    setEditCourse(course)
    setEditTitle(course.title)
    setEditDescription(course.description || '')
  }

  const handleEdit = () => {
    if (!editCourse || !editTitle.trim()) return
    updateMutation.mutate({
      id: editCourse.id,
      title: editTitle.trim(),
      description: editDescription.trim()
    })
  }

  const handleDelete = () => {
    if (!deleteId) return
    const course = courses?.find(c => c.id === deleteId)
    if (!course || deleteConfirmText !== course.title) {
      toast.error('Course name does not match')
      return
    }
    deleteMutation.mutate(deleteId)
  }

  const filteredCourses = courses?.filter(course =>
    course.title.toLowerCase().includes(search.toLowerCase()) ||
    course.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageShell maxWidth="2xl">
      <PageHeader
        title="My Courses"
        description="Create and manage your courses. Add lessons, extract concepts, and track student progress."
        action={
          <Link href="/instructor/courses/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Course
            </Button>
          </Link>
        }
      />

      <Section>
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <LoadingState message="Loading courses..." />
        ) : !filteredCourses || filteredCourses.length === 0 ? (
          search ? (
            <SurfaceCard variant="muted" className="py-12">
              <EmptyState
                icon={Search}
                title="No courses found"
                description={`No courses match "${search}". Try a different search term.`}
              />
            </SurfaceCard>
          ) : (
            <SurfaceCard variant="muted" className="py-12">
              <EmptyState
                icon={BookOpen}
                title="No courses yet"
                description="Start by creating your first course. Add lessons, extract concepts, and invite students."
                action={{
                  label: 'Create Your First Course',
                  onClick: () => router.push('/instructor/courses/new')
                }}
              />
            </SurfaceCard>
          )
        ) : (
          <Grid cols={3} gap="md">
            {filteredCourses?.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }}
              >
                <SurfaceCard 
                  className="group h-full flex flex-col cursor-pointer hover:shadow-md hover:border-primary/50 transition-all" 
                  onClick={() => router.push(`/instructor/courses/${course.id}`)}
                >
                  {/* Course Image */}
                  <div className="w-[calc(100%+3rem)] aspect-video bg-gradient-to-br from-primary/10 via-indigo-500/10 to-purple-500/10 relative overflow-hidden rounded-t-lg -mt-6 -mx-6 mb-4">
                    {course.cover_image_url || course.thumbnail_url ? (
                      <img 
                        src={course.cover_image_url || course.thumbnail_url || ''} 
                        alt={course.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <BookOpen className="h-10 w-10 opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  </div>

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg line-clamp-1 mb-1">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {course.description || 'No description'}
                      </p>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(course)
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Course
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            togglePublishMutation.mutate({
                              id: course.id,
                              is_published: !course.is_published
                            })
                          }}>
                            {course.is_published ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteId(course.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3 mt-auto">
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    <Badge variant="outline">{course.language.toUpperCase()}</Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Video className="h-4 w-4" />
                      <span>{course.lesson_count}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>{course.student_count}</span>
                    </div>
                  </div>
                </SurfaceCard>
              </motion.div>
            ))}
          </Grid>
        )}
      </Section>

      {/* Edit Modal */}
      <ModalLayout
        open={!!editCourse}
        onClose={() => setEditCourse(null)}
        title="Edit Course"
        description="Update course details"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditCourse(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEdit}
              disabled={!editTitle.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <LabelText required>Course Title</LabelText>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Enter course title"
            />
          </div>
          <div className="space-y-2">
            <LabelText>Description</LabelText>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Describe what students will learn"
              rows={4}
            />
          </div>
        </div>
      </ModalLayout>

      {/* Delete Confirmation Modal */}
      <ModalLayout
        open={!!deleteId}
        onClose={() => {
          setDeleteId(null)
          setDeleteConfirmText('')
        }}
        title="Delete Course?"
        description="This action cannot be undone. All lessons and student progress will be permanently deleted."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => {
              setDeleteId(null)
              setDeleteConfirmText('')
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmText !== courses?.find(c => c.id === deleteId)?.title || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Course'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Type the course name to confirm deletion:
          </p>
          <div className="space-y-2">
            <LabelText>Course Name</LabelText>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={courses?.find(c => c.id === deleteId)?.title || ''}
            />
            {deleteConfirmText && deleteConfirmText !== courses?.find(c => c.id === deleteId)?.title && (
              <ErrorText>Course name does not match</ErrorText>
            )}
          </div>
        </div>
      </ModalLayout>
    </PageShell>
  )
}
