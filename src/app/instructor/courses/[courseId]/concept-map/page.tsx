'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ChevronLeft,
  GitBranch,
  BookOpen,
  HelpCircle,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronRight,
  BarChart3,
  AlertTriangle,
  X,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import {
  getCourseConceptMap,
  getConceptDetails,
  suggestQuestionsForConcepts,
  generateQuestionsForConcept,
  updateConcept,
  createConcept,
  deleteConcept,
  type ConceptMapNode,
  type LessonMapLane,
  type QuestionTypeSuggestion,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageShell, Section, Stack } from '@/design-system/layout'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'
import { ModalLayout } from '@/design-system/patterns/modal-layout'
import { EditConceptModal } from './components/EditConceptModal'

// ===== Difficulty helpers =====
function difficultyColor(d: string) {
  if (d === 'easy') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200'
  if (d === 'hard') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200'
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200'
}

function difficultyDot(d: string) {
  if (d === 'easy') return 'bg-emerald-500'
  if (d === 'hard') return 'bg-red-500'
  return 'bg-amber-500'
}

// ===== Question type labels =====
const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'fill_in_blank', label: 'Fill in Blank' },
  { value: 'code_output', label: 'Code Output' },
]

// ===== Concept Card in Tree =====
function ConceptTreeCard({
  concept,
  isSelected,
  onClick,
}: {
  concept: ConceptMapNode
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`
        group relative text-left w-56 rounded-xl border-2 p-3.5 transition-all duration-200
        hover:shadow-lg hover:-translate-y-0.5 cursor-pointer
        ${isSelected
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-2 ring-primary/20'
          : 'border-border/60 bg-white dark:bg-gray-950 hover:border-primary/40'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="font-semibold text-sm leading-tight line-clamp-2 flex-1">
          {concept.name}
        </h4>
        <Badge variant="outline" className={`text-[10px] shrink-0 px-1.5 py-0 ${difficultyColor(concept.difficulty)}`}>
          {concept.difficulty}
        </Badge>
      </div>
      {concept.description && (
        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
          {concept.description}
        </p>
      )}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {concept.question_count > 0 && (
          <span className="flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            {concept.question_count}
          </span>
        )}
        {concept.prereq_ids.length > 0 && (
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            {concept.prereq_ids.length}
          </span>
        )}
      </div>
    </motion.button>
  )
}

// ===== Lesson Level Row =====
function LessonLevel({
  lesson,
  concepts,
  index,
  selectedConceptId,
  onConceptClick,
}: {
  lesson: LessonMapLane
  concepts: ConceptMapNode[]
  index: number
  selectedConceptId: string | null
  onConceptClick: (id: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.08 }}
      className="relative"
    >
      {/* Vertical connector from previous level */}
      {index > 0 && (
        <div className="flex justify-center -mt-1 mb-1">
          <div className="w-0.5 h-6 bg-gradient-to-b from-border to-primary/30" />
        </div>
      )}

      {/* Lesson header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-3 mb-3 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors w-full text-left group"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
          {index + 1}
        </div>
        <BookOpen className="h-4 w-4 text-primary shrink-0" />
        <span className="font-medium text-sm flex-1 truncate">{lesson.title}</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
          {concepts.length} concept{concepts.length !== 1 ? 's' : ''}
        </Badge>
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Concepts grid */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {concepts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No concepts extracted yet for this lesson
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 pb-2 pl-6">
                {concepts.map((concept) => (
                  <ConceptTreeCard
                    key={concept.id}
                    concept={concept}
                    isSelected={selectedConceptId === concept.id}
                    onClick={() => onConceptClick(concept.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ===== Concept Detail Panel =====
function ConceptDetailPanel({
  courseId,
  conceptId,
  allConcepts,
  suggestion,
  onClose,
  onEdit,
  onDelete,
  onGenerateQuestions,
  isGenerating,
}: {
  courseId: string
  conceptId: string
  allConcepts: ConceptMapNode[]
  suggestion?: QuestionTypeSuggestion
  onClose: () => void
  onEdit: () => void
  onDelete: (conceptId: string) => void
  onGenerateQuestions: (conceptId: string, types: string[], perTier: number) => void
  isGenerating: boolean
}) {
  const { data: details, isLoading } = useQuery({
    queryKey: ['concept-details', courseId, conceptId],
    queryFn: () => getConceptDetails(courseId, conceptId),
  })

  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    suggestion?.suggested_types || ['multiple_choice', 'short_answer', 'true_false']
  )
  const [questionsPerTier, setQuestionsPerTier] = useState(
    suggestion?.suggested_count_per_tier || 5
  )
  const [showQuestions, setShowQuestions] = useState(false)

  const concept = allConcepts.find(c => c.id === conceptId)
  if (!concept) return null

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-16 bottom-0 w-[420px] bg-white dark:bg-gray-950 border-l shadow-2xl z-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-950 border-b px-5 py-4 z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight">{concept.name}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className={`text-xs ${difficultyColor(concept.difficulty)}`}>
                {concept.difficulty}
              </Badge>
              {concept.question_count > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {concept.question_count} questions
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 -mr-2 -mt-1">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Description */}
        {concept.description && (
          <div>
            <Text variant="muted" className="text-sm">{concept.description}</Text>
          </div>
        )}

        {/* Prerequisites */}
        {concept.prereq_ids.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <GitBranch className="h-4 w-4 text-primary" />
              Prerequisites
            </div>
            <div className="flex flex-wrap gap-1.5">
              {concept.prereq_ids.map(pid => {
                const prereq = allConcepts.find(c => c.id === pid)
                return prereq ? (
                  <Badge key={pid} variant="secondary" className="text-xs">{prereq.name}</Badge>
                ) : null
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* Loading state for details */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : details ? (
          <>
            {/* Completion Stats */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="h-4 w-4 text-primary" />
                Performance
              </div>
              <div className="rounded-lg bg-muted/40 p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-semibold">{details.completion_rate}%</span>
                </div>
                <Progress value={details.completion_rate} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{details.total_correct} correct</span>
                  <span>{details.total_attempts} attempts</span>
                </div>
              </div>
            </div>

            {/* Questions Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Questions ({details.question_count})
                </div>
                {details.question_count > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuestions(!showQuestions)}
                    className="text-xs h-7"
                  >
                    {showQuestions ? 'Hide' : 'Show all'}
                  </Button>
                )}
              </div>

              {details.question_count > 0 && (
                <div className="flex gap-2">
                  {Object.entries(details.questions_by_tier).map(([tier, count]) => (
                    <div
                      key={tier}
                      className="flex items-center gap-1.5 rounded-md bg-muted/40 px-2.5 py-1.5"
                    >
                      <div className={`w-2 h-2 rounded-full ${difficultyDot(tier)}`} />
                      <span className="text-xs capitalize">{tier}</span>
                      <span className="text-xs font-bold">{count as number}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Question list */}
              <AnimatePresence>
                {showQuestions && details.questions.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    {details.questions.slice(0, 20).map(q => (
                      <div key={q.id} className="text-xs p-2.5 rounded-md border bg-muted/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-[10px] px-1 py-0 ${difficultyColor(q.difficulty_tier)}`}>
                            {q.difficulty_tier}
                          </Badge>
                          <span className="text-muted-foreground capitalize">{q.question_type.replace('_', ' ')}</span>
                          {q.times_shown > 0 && (
                            <span className="ml-auto text-muted-foreground">
                              {q.success_rate}% ({q.times_shown} shown)
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-2">{q.question_text}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Struggling Students */}
            {details.struggling_students.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Struggling Students ({details.struggling_students.length})
                </div>
                <div className="space-y-1.5">
                  {details.struggling_students.map(s => (
                    <div key={s.user_id} className="flex items-center gap-3 p-2 rounded-md border bg-orange-50/50 dark:bg-orange-950/10">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.user_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.user_email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-orange-600">{s.success_rate}%</p>
                        <p className="text-xs text-muted-foreground">{s.attempts} att.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}

        <Separator />

        {/* Question Generation Config */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            Generate Questions
          </div>

          {suggestion?.reasoning && (
            <p className="text-xs text-muted-foreground bg-primary/5 rounded-md p-2.5 border border-primary/10">
              <strong>AI suggestion:</strong> {suggestion.reasoning}
            </p>
          )}

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Question types</p>
            {QUESTION_TYPES.map(qt => (
              <label key={qt.value} className="flex items-center gap-2.5 text-sm cursor-pointer">
                <Checkbox
                  checked={selectedTypes.includes(qt.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTypes(prev => [...prev, qt.value])
                    } else {
                      setSelectedTypes(prev => prev.filter(t => t !== qt.value))
                    }
                  }}
                />
                {qt.label}
              </label>
            ))}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Questions per tier (easy / medium / hard)</p>
            <Input
              type="number"
              min={1}
              max={20}
              value={questionsPerTier}
              onChange={(e) => setQuestionsPerTier(parseInt(e.target.value) || 5)}
              className="w-24 h-8 text-sm"
            />
          </div>

          <Button
            onClick={() => onGenerateQuestions(conceptId, selectedTypes, questionsPerTier)}
            disabled={selectedTypes.length === 0 || isGenerating}
            className="w-full gap-2"
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate {questionsPerTier * 3} Questions
          </Button>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2 pb-6">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            Edit Concept
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm(`Delete "${concept.name}" and all its questions? This cannot be undone.`)) {
                onDelete(conceptId)
              }
            }}
            className="gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ===== Main Page =====
export default function ConceptMapPage() {
  const params = useParams<{ courseId: string }>()
  const courseId = params?.courseId || ''
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null)
  const [editingConceptId, setEditingConceptId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newConceptName, setNewConceptName] = useState('')
  const [newConceptDescription, setNewConceptDescription] = useState('')
  const [newConceptDifficulty, setNewConceptDifficulty] = useState('medium')

  // Fetch concept map data
  const { data: mapData, isLoading } = useQuery({
    queryKey: ['conceptMap', courseId],
    queryFn: () => getCourseConceptMap(courseId),
  })

  // LLM suggestions (lazy loaded)
  const { data: suggestions, isFetching: loadingSuggestions, refetch: fetchSuggestions } = useQuery({
    queryKey: ['question-suggestions', courseId],
    queryFn: () => suggestQuestionsForConcepts(courseId),
    enabled: false,
  })

  // Generate questions mutation
  const generateMutation = useMutation({
    mutationFn: ({ conceptId, types, perTier }: { conceptId: string; types: string[]; perTier: number }) =>
      generateQuestionsForConcept(courseId, conceptId, types, perTier),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conceptMap', courseId] })
      queryClient.invalidateQueries({ queryKey: ['concept-details', courseId] })
      toast.success(`Generated ${data.questions_generated} questions!`)
    },
    onError: () => {
      toast.error('Failed to generate questions')
    }
  })

  // Update concept mutation
  const updateConceptMutation = useMutation({
    mutationFn: ({ conceptId, data }: { conceptId: string; data: Record<string, unknown> }) =>
      updateConcept(courseId, conceptId, data as Parameters<typeof updateConcept>[2]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conceptMap', courseId] })
      queryClient.invalidateQueries({ queryKey: ['concept-details', courseId] })
      toast.success('Concept updated')
      setEditingConceptId(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update concept')
    },
  })

  // Create concept mutation
  const createConceptMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; difficulty?: string }) =>
      createConcept(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conceptMap', courseId] })
      toast.success('Concept created')
      setShowCreateModal(false)
      setNewConceptName('')
      setNewConceptDescription('')
      setNewConceptDifficulty('medium')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create concept')
    },
  })

  // Delete concept mutation
  const deleteConceptMutation = useMutation({
    mutationFn: (conceptId: string) => deleteConcept(courseId, conceptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conceptMap', courseId] })
      queryClient.invalidateQueries({ queryKey: ['question-bank'] })
      toast.success('Concept deleted')
      setSelectedConceptId(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete concept')
    },
  })

  // Build tree structure: group concepts by lesson
  const tree = useMemo(() => {
    if (!mapData) return { lessons: [], unmapped: [] }

    const sortedLessons = [...mapData.lessons].sort((a, b) => a.position - b.position)
    const placedIds = new Set<string>()
    const search = searchTerm.toLowerCase()

    const lessonGroups = sortedLessons.map(lesson => {
      const lessonConcepts = mapData.concepts
        .filter(c => c.lesson_ids.includes(lesson.id))
        .filter(c => !search || c.name.toLowerCase().includes(search))
        .sort((a, b) => (a.position_in_lessons[lesson.id] || 0) - (b.position_in_lessons[lesson.id] || 0))

      lessonConcepts.forEach(c => placedIds.add(c.id))
      return { lesson, concepts: lessonConcepts }
    })

    const unmapped = mapData.concepts
      .filter(c => !placedIds.has(c.id))
      .filter(c => !search || c.name.toLowerCase().includes(search))

    return { lessons: lessonGroups, unmapped }
  }, [mapData, searchTerm])

  const selectedSuggestion = useMemo(() => {
    if (!selectedConceptId || !suggestions) return undefined
    return suggestions.suggestions.find(s => s.concept_id === selectedConceptId)
  }, [selectedConceptId, suggestions])

  if (isLoading) {
    return (
      <PageShell maxWidth="full">
        <LoadingState message="Loading concept map..." />
      </PageShell>
    )
  }

  if (!mapData || mapData.concepts.length === 0) {
    return (
      <PageShell maxWidth="2xl">
        <Section>
          <EmptyState
            icon={GitBranch}
            title="No concepts yet"
            description="Process lesson materials to extract concepts automatically, or create concepts manually."
            action={{
              label: 'Create Concept',
              onClick: () => setShowCreateModal(true),
            }}
          />
        </Section>
      </PageShell>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      {/* Header */}
      <div className="bg-white dark:bg-gray-950 border-b sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link href="/instructor/courses" className="hover:text-foreground transition-colors">
              My Courses
            </Link>
            <ChevronLeft className="h-4 w-4 rotate-180" />
            <Link href={`/instructor/courses/${courseId}`} className="hover:text-foreground transition-colors">
              {mapData.course_title}
            </Link>
            <ChevronLeft className="h-4 w-4 rotate-180" />
            <span className="text-foreground font-medium">Concept Map</span>
          </div>

          {/* Title row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <GitBranch className="h-6 w-6 text-primary" />
              <Heading level={2}>Concept Map</Heading>
              <Badge variant="secondary">{mapData.concepts.length} concepts</Badge>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search concepts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-56 h-9"
                />
              </div>

              {/* AI Suggest button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSuggestions()}
                disabled={loadingSuggestions}
                className="gap-2"
              >
                {loadingSuggestions ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AI Suggest
              </Button>

              {/* Create Concept button */}
              <Button
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Concept
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tree content */}
      <div className={`max-w-5xl mx-auto px-6 py-8 transition-all duration-300 ${selectedConceptId ? 'mr-[420px]' : ''}`}>
        {/* Difficulty legend */}
        <div className="flex items-center gap-4 mb-6 text-xs">
          <span className="text-muted-foreground font-medium">Difficulty:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Easy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Hard</span>
          </div>
        </div>

        {/* Lesson levels */}
        <div className="space-y-2">
          {tree.lessons.map(({ lesson, concepts }, idx) => (
            <LessonLevel
              key={lesson.id}
              lesson={lesson}
              concepts={concepts}
              index={idx}
              selectedConceptId={selectedConceptId}
              onConceptClick={(id) => setSelectedConceptId(id === selectedConceptId ? null : id)}
            />
          ))}

          {/* Unmapped concepts */}
          {tree.unmapped.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-center mb-1">
                <div className="w-0.5 h-4 bg-border" />
              </div>
              <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-lg bg-orange-50/60 dark:bg-orange-950/10 border border-orange-200/40">
                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                <span className="font-medium text-sm text-orange-700 dark:text-orange-400">
                  Unassigned Concepts
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5">
                  {tree.unmapped.length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 pl-6">
                {tree.unmapped.map(concept => (
                  <ConceptTreeCard
                    key={concept.id}
                    concept={concept}
                    isSelected={selectedConceptId === concept.id}
                    onClick={() => setSelectedConceptId(concept.id === selectedConceptId ? null : concept.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedConceptId && mapData && (
          <ConceptDetailPanel
            courseId={courseId}
            conceptId={selectedConceptId}
            allConcepts={mapData.concepts}
            suggestion={selectedSuggestion}
            onClose={() => setSelectedConceptId(null)}
            onEdit={() => setEditingConceptId(selectedConceptId)}
            onDelete={(id) => deleteConceptMutation.mutate(id)}
            onGenerateQuestions={(cId, types, perTier) => {
              generateMutation.mutate({ conceptId: cId, types, perTier })
            }}
            isGenerating={generateMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Edit modal */}
      {editingConceptId && mapData && (
        <EditConceptModal
          concept={mapData.concepts.find(c => c.id === editingConceptId)!}
          allConcepts={mapData.concepts}
          onClose={() => setEditingConceptId(null)}
          onSave={(data) => {
            updateConceptMutation.mutate({ conceptId: editingConceptId, data })
          }}
          isLoading={updateConceptMutation.isPending}
        />
      )}

      {/* Create Concept Modal */}
      <ModalLayout
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Concept"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createConceptMutation.mutate({
                name: newConceptName,
                description: newConceptDescription || undefined,
                difficulty: newConceptDifficulty,
              })}
              disabled={!newConceptName.trim() || createConceptMutation.isPending}
              className="gap-2"
            >
              {createConceptMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Concept
            </Button>
          </>
        }
      >
        <Stack gap="md">
          <div>
            <LabelText required>Concept Name</LabelText>
            <Input
              value={newConceptName}
              onChange={(e) => setNewConceptName(e.target.value)}
              placeholder="e.g., Variables, Loop Structures"
              className="mt-1"
            />
          </div>
          <div>
            <LabelText>Description</LabelText>
            <Textarea
              value={newConceptDescription}
              onChange={(e) => setNewConceptDescription(e.target.value)}
              placeholder="Brief description of this concept..."
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <LabelText>Difficulty</LabelText>
            <Select value={newConceptDifficulty} onValueChange={setNewConceptDifficulty}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Stack>
      </ModalLayout>



      {/* Generating overlay */}
      {generateMutation.isPending && (
        <div className="fixed inset-0 z-[60] bg-background/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gray-950 rounded-xl border shadow-2xl p-6 flex items-center gap-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div>
              <p className="font-semibold">Generating questions...</p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
