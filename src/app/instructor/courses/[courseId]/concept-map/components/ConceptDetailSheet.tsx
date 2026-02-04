import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  GitBranch,
  Edit3,
  Trash2,
  BookOpen,
  BarChart3,
  RefreshCw,
  Users,
  X,
} from 'lucide-react'
import { DrawerLayout } from '@/design-system/patterns/drawer-layout'
import { Stack } from '@/design-system/layout'
import { SurfaceCard } from '@/design-system/surfaces'
import { Heading, Text, LabelText } from '@/design-system/typography'
import type { ConceptMapNode, LessonMapLane } from '@/lib/api'

interface ConceptDetailSheetProps {
  concept: ConceptMapNode
  lessons: LessonMapLane[]
  allConcepts: ConceptMapNode[]
  isEditMode: boolean
  courseId?: string
  onClose: () => void
  onEdit: () => void
  onRemoveFromLesson: (lessonId: string) => void
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
    case 'hard':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
    default:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
  }
}

export function ConceptDetailSheet({
  concept,
  lessons,
  allConcepts,
  isEditMode,
  courseId,
  onClose,
  onEdit,
  onRemoveFromLesson,
}: ConceptDetailSheetProps) {
  // Get prerequisite concepts
  const prerequisites = concept.prereq_ids
    .map((prereqId) => allConcepts.find((c) => c.id === prereqId))
    .filter(Boolean) as ConceptMapNode[]

  // Get lessons this concept is used in
  const usedInLessons = lessons.filter((lesson) =>
    concept.lesson_ids.includes(lesson.id)
  )

  return (
    <DrawerLayout
      open={true}
      onClose={onClose}
      title="Concept Details"
      size="lg"
    >
      <Stack gap="lg">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <Heading level={3}>{concept.name}</Heading>
            <Badge
              variant="outline"
              className={getDifficultyColor(concept.difficulty)}
            >
              {concept.difficulty}
            </Badge>
          </div>
          {concept.description && (
            <Text variant="muted" className="text-sm">
              {concept.description}
            </Text>
          )}
        </div>

        {/* Prerequisites */}
        {prerequisites.length > 0 && (
          <SurfaceCard variant="muted">
            <Stack gap="sm">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                <LabelText>Prerequisites</LabelText>
              </div>
              <div className="flex flex-wrap gap-2">
                {prerequisites.map((prereq) => (
                  <Badge key={prereq.id} variant="secondary" className="text-xs">
                    {prereq.name}
                  </Badge>
                ))}
              </div>
            </Stack>
          </SurfaceCard>
        )}

        {/* Used in lessons */}
        <SurfaceCard variant="muted">
          <Stack gap="sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <LabelText>Used in lessons</LabelText>
            </div>
            <div className="space-y-2">
              {usedInLessons.length === 0 ? (
                <Text variant="muted" className="text-sm">
                  Not assigned to any lesson yet
                </Text>
              ) : (
                usedInLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-background"
                  >
                    <div>
                      <Text className="text-sm font-medium">{lesson.title}</Text>
                      <Text variant="muted" className="text-xs">
                        Position: {concept.position_in_lessons[lesson.id] + 1}
                      </Text>
                    </div>
                    {isEditMode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveFromLesson(lesson.id)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </Stack>
        </SurfaceCard>

        {/* Actions */}
        <div className="border-t pt-4">
          <Stack gap="sm">
            <LabelText>Quick actions</LabelText>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  // Navigate to question bank filtered by this concept
                  const params = new URLSearchParams()
                  if (courseId) params.set('course_id', courseId)
                  params.set('concept_id', concept.id)
                  window.location.href = `/instructor/question-bank?${params.toString()}`
                }}
              >
                <BarChart3 className="h-4 w-4" />
                View questions
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  // Navigate to AI tools to regenerate questions
                  window.location.href = `/instructor/ai-tools?concept=${concept.id}`
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 col-span-2"
                onClick={() => {
                  // Navigate to mastery page filtered by this concept
                  window.location.href = `/instructor/mastery?concept=${concept.id}`
                }}
              >
                <Users className="h-4 w-4" />
                See struggling students
              </Button>
            </div>
          </Stack>
        </div>

        {/* Edit button */}
        {isEditMode && (
          <div className="border-t pt-4">
            <Button
              onClick={onEdit}
              className="w-full gap-2"
              variant="default"
            >
              <Edit3 className="h-4 w-4" />
              Edit concept
            </Button>
          </div>
        )}
      </Stack>
    </DrawerLayout>
  )
}
