import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, AlertCircle } from 'lucide-react'
import { ModalLayout } from '@/design-system/patterns/modal-layout'
import { Stack } from '@/design-system/layout'
import { LabelText, HelperText } from '@/design-system/typography'
import type { ConceptMapNode } from '@/lib/api'

interface EditConceptModalProps {
  concept: ConceptMapNode
  allConcepts: ConceptMapNode[]
  onClose: () => void
  onSave: (data: {
    name?: string
    description?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    prereq_ids?: string[]
  }) => void
  isLoading: boolean
}

export function EditConceptModal({
  concept,
  allConcepts,
  onClose,
  onSave,
  isLoading,
}: EditConceptModalProps) {
  const [name, setName] = useState(concept.name)
  const [description, setDescription] = useState(concept.description || '')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    concept.difficulty
  )
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<string[]>(
    concept.prereq_ids
  )

  // Get available concepts (exclude self)
  const availablePrereqs = allConcepts.filter((c) => c.id !== concept.id)

  // Check for potential cycles (simple check: if A requires B, then B cannot require A)
  const wouldCreateCycle = (prereqId: string) => {
    const prereq = allConcepts.find((c) => c.id === prereqId)
    if (!prereq) return false
    // If the prerequisite already depends on this concept, it would create a cycle
    return prereq.prereq_ids.includes(concept.id)
  }

  const handleTogglePrereq = (prereqId: string) => {
    if (selectedPrereqIds.includes(prereqId)) {
      setSelectedPrereqIds(selectedPrereqIds.filter((id) => id !== prereqId))
    } else {
      if (wouldCreateCycle(prereqId)) {
        return // Don't allow selection if it would create a cycle
      }
      setSelectedPrereqIds([...selectedPrereqIds, prereqId])
    }
  }

  const handleSave = () => {
    const data: any = {}
    if (name !== concept.name) data.name = name
    if (description !== concept.description) data.description = description
    if (difficulty !== concept.difficulty) data.difficulty = difficulty
    if (JSON.stringify(selectedPrereqIds) !== JSON.stringify(concept.prereq_ids)) {
      data.prereq_ids = selectedPrereqIds
    }

    if (Object.keys(data).length === 0) {
      onClose()
      return
    }

    onSave(data)
  }

  return (
    <ModalLayout
      open={true}
      onClose={onClose}
      title="Edit Concept"
      size="xl"
    >
      <Stack gap="lg">
        {/* Name */}
        <div>
          <LabelText>Concept name</LabelText>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Variables and Data Types"
            className="mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <LabelText>Description</LabelText>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this concept..."
            rows={3}
            className="mt-1"
          />
        </div>

        {/* Difficulty */}
        <div>
          <LabelText>Difficulty level</LabelText>
          <Select
            value={difficulty}
            onValueChange={(value: any) => setDifficulty(value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <HelperText className="mt-1">
            Indicates the complexity level for students
          </HelperText>
        </div>

        {/* Prerequisites */}
        <div>
          <LabelText>Prerequisites</LabelText>
          <HelperText className="mt-1 mb-2">
            Select concepts that students should understand before this one
          </HelperText>

          {/* Selected prerequisites */}
          {selectedPrereqIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 p-3 rounded-lg border bg-muted/50">
              {selectedPrereqIds.map((prereqId) => {
                const prereq = allConcepts.find((c) => c.id === prereqId)
                if (!prereq) return null
                return (
                  <Badge
                    key={prereqId}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {prereq.name}
                    <button
                      onClick={() => handleTogglePrereq(prereqId)}
                      className="ml-1 hover:bg-background/50 rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )
              })}
            </div>
          )}

          {/* Available prerequisites */}
          <div className="border rounded-lg max-h-48 overflow-y-auto">
            {availablePrereqs.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No other concepts available
              </div>
            ) : (
              <div className="divide-y">
                {availablePrereqs.map((prereq) => {
                  const isSelected = selectedPrereqIds.includes(prereq.id)
                  const createsCycle = wouldCreateCycle(prereq.id)

                  return (
                    <button
                      key={prereq.id}
                      onClick={() => !createsCycle && handleTogglePrereq(prereq.id)}
                      disabled={createsCycle}
                      className={`
                        w-full px-3 py-2 text-left text-sm transition-colors
                        ${
                          isSelected
                            ? 'bg-primary/10 hover:bg-primary/20'
                            : 'hover:bg-muted'
                        }
                        ${createsCycle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{prereq.name}</div>
                          {prereq.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {prereq.description}
                            </div>
                          )}
                        </div>
                        {createsCycle && (
                          <AlertCircle className="h-4 w-4 text-destructive ml-2" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {selectedPrereqIds.some((id) => wouldCreateCycle(id)) && (
            <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Some selections would create circular dependencies and are disabled
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !name.trim()}>
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </Stack>
    </ModalLayout>
  )
}
