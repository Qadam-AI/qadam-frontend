'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableSkeleton } from '@/app/_components/skeletons'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Course {
  id: string
  title: string
  description: string | null
  lesson_count: number
}

export default function CoursesManagement() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const response = await api.get('/admin/courses')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await api.post('/admin/courses', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
      setIsCreateOpen(false)
      setFormData({ title: '', description: '' })
      toast.success('Course created successfully')
    },
    onError: () => {
      toast.error('Failed to create course')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Course> }) => {
      await api.patch(`/admin/courses/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
      setIsEditOpen(false)
      setSelectedCourse(null)
      toast.success('Course updated successfully')
    },
    onError: () => {
      toast.error('Failed to update course')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/courses/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
      setIsDeleteOpen(false)
      setSelectedCourse(null)
      toast.success('Course deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete course')
    },
  })

  const handleCreate = () => {
    if (!formData.title) {
      toast.error('Please enter a title')
      return
    }
    createMutation.mutate(formData)
  }

  const handleEdit = () => {
    if (!selectedCourse) return
    updateMutation.mutate({
      id: selectedCourse.id,
      data: {
        title: formData.title || undefined,
        description: formData.description || undefined,
      },
    })
  }

  const handleDelete = () => {
    if (!selectedCourse) return
    deleteMutation.mutate(selectedCourse.id)
  }

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course)
    setFormData({
      title: course.title,
      description: course.description || '',
    })
    setIsEditOpen(true)
  }

  const openDeleteDialog = (course: Course) => {
    setSelectedCourse(course)
    setIsDeleteOpen(true)
  }

  if (isLoading) {
    return <TableSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-2">Manage courses and course structure</p>
        </div>
        <Button onClick={() => { setFormData({ title: '', description: '' }); setIsCreateOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Courses ({courses?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses?.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell className="max-w-md truncate">{course.description || '-'}</TableCell>
                  <TableCell>{course.lesson_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(course)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(course)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>Add a new course to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update course information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedCourse?.title}</strong>? This will also delete all associated lessons. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

