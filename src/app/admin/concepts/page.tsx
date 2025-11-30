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

interface Concept {
  id: string
  name: string
  description: string | null
  lesson_count: number
}

export default function ConceptsManagement() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const { data: concepts, isLoading } = useQuery<Concept[]>({
    queryKey: ['admin-concepts'],
    queryFn: async () => {
      const response = await api.get('/admin/concepts')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await api.post('/admin/concepts', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-concepts'] })
      setIsCreateOpen(false)
      setFormData({ name: '', description: '' })
      toast.success('Concept created successfully')
    },
    onError: () => {
      toast.error('Failed to create concept')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Concept> }) => {
      await api.patch(`/admin/concepts/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-concepts'] })
      setIsEditOpen(false)
      setSelectedConcept(null)
      toast.success('Concept updated successfully')
    },
    onError: () => {
      toast.error('Failed to update concept')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/concepts/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-concepts'] })
      setIsDeleteOpen(false)
      setSelectedConcept(null)
      toast.success('Concept deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete concept')
    },
  })

  const handleCreate = () => {
    if (!formData.name) {
      toast.error('Please enter a name')
      return
    }
    createMutation.mutate(formData)
  }

  const handleEdit = () => {
    if (!selectedConcept) return
    updateMutation.mutate({
      id: selectedConcept.id,
      data: {
        name: formData.name || undefined,
        description: formData.description || undefined,
      },
    })
  }

  const handleDelete = () => {
    if (!selectedConcept) return
    deleteMutation.mutate(selectedConcept.id)
  }

  const openEditDialog = (concept: Concept) => {
    setSelectedConcept(concept)
    setFormData({
      name: concept.name,
      description: concept.description || '',
    })
    setIsEditOpen(true)
  }

  const openDeleteDialog = (concept: Concept) => {
    setSelectedConcept(concept)
    setIsDeleteOpen(true)
  }

  if (isLoading) {
    return <TableSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Concepts</h1>
          <p className="text-muted-foreground mt-2">Manage learning concepts</p>
        </div>
        <Button onClick={() => { setFormData({ name: '', description: '' }); setIsCreateOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Concept
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Concepts ({concepts?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {concepts?.map((concept) => (
                <TableRow key={concept.id}>
                  <TableCell className="font-medium">{concept.name}</TableCell>
                  <TableCell className="max-w-md truncate">{concept.description || '-'}</TableCell>
                  <TableCell>{concept.lesson_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(concept)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(concept)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { setIsCreateOpen(open); setIsEditOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Concept' : 'Create New Concept'}</DialogTitle>
            <DialogDescription>{isEditOpen ? 'Update concept information' : 'Add a new concept to the system'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={isEditOpen ? handleEdit : handleCreate} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Concept</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedConcept?.name}</strong>? This action cannot be undone.
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

