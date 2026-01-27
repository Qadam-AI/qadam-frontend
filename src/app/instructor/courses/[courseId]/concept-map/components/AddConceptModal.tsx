import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus } from 'lucide-react'
import { ModalLayout } from '@/design-system/patterns/modal-layout'
import { Stack } from '@/design-system/layout'
import { LabelText, Text } from '@/design-system/typography'
import { Badge } from '@/components/ui/badge'
import type { ConceptMapNode, LessonMapLane } from '@/lib/api'

interface AddConceptModalProps {
  lesson: LessonMapLane
  availableConcepts: ConceptMapNode[]
  onClose: () => void
  onAdd: (conceptId: string) => void
  isLoading: boolean
}

export function AddConceptModal({
  lesson,
  availableConcepts,
  onClose,
  onAdd,
  isLoading,
}: AddConceptModalProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter concepts by search
  const filteredConcepts = searchTerm
    ? availableConcepts.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableConcepts

  return (
    <ModalLayout
      open={true}
      onClose={onClose}
      title={`Add concept to "${lesson.title}"`}
      size="lg"
    >
      <Stack gap="md">
        {/* Search */}
        <div>
          <LabelText>Search concepts</LabelText>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type to search..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Concepts list */}
        <div>
          <LabelText className="mb-2">
            Available concepts ({filteredConcepts.length})
          </LabelText>
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {filteredConcepts.length === 0 ? (
              <div className="p-8 text-center">
                <Text variant="muted" className="text-sm">
                  {searchTerm
                    ? 'No concepts match your search'
                    : 'All concepts are already in this lesson'}
                </Text>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConcepts.map((concept) => (
                  <div
                    key={concept.id}
                    className="p-3 hover:bg-muted transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm mb-1">
                        {concept.name}
                      </div>
                      {concept.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {concept.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {concept.difficulty}
                        </Badge>
                        {concept.lesson_ids.length > 0 && (
                          <Text variant="muted" className="text-xs">
                            Used in {concept.lesson_ids.length} lesson{concept.lesson_ids.length !== 1 ? 's' : ''}
                          </Text>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onAdd(concept.id)}
                      disabled={isLoading}
                      className="gap-2 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </Stack>
    </ModalLayout>
  )
}
