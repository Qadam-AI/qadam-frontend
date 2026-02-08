'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FileText, Edit2, Trash2, Plus, Filter, 
  Search, BarChart3, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Clock, X
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useTranslations } from '@/lib/i18n'

// Design System
import { PageShell, PageHeader, Section, Stack, Grid } from '@/design-system/layout'
import { SurfaceCard, MetricCard, InfoPanel } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text, LabelText, HelperText } from '@/design-system/typography'
import { DrawerLayout } from '@/design-system/patterns/drawer-layout'
import { ModalLayout } from '@/design-system/patterns/modal-layout'

interface Question {
  id: string
  concept_id: string
  concept_name?: string
  course_id: string
  course_title?: string
  question_type: string
  question_text: string
  options?: Array<{ id: string; text: string; is_correct?: boolean }>
  correct_answer?: string
  explanation?: string
  hints?: string[]
  difficulty: number
  difficulty_tier: string
  times_shown: number
  times_correct: number
  avg_time_seconds?: number
  is_active: boolean
  created_at: string
}

interface QuestionStats {
  total_questions: number
  by_difficulty: { easy: number; medium: number; hard: number }
  by_type: Record<string, number>
  avg_success_rate: number
  most_difficult: Question[]
}

export default function QuestionBankPage() {
  const tPilot = useTranslations('pilotQuestionBank')
  const queryClient = useQueryClient()
  
  // Filters
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [selectedLesson, setSelectedLesson] = useState<string>('all')
  const [selectedConcept, setSelectedConcept] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showInactiveOnly, setShowInactiveOnly] = useState(false)

  // State
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showStats, setShowStats] = useState(false)

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const res = await api.get<Array<{ id: string; title: string }>>('/instructor/courses')
      return res.data
    }
  })

  // Fetch lessons for selected course
  const { data: lessons = [] } = useQuery({
    queryKey: ['course-lessons', selectedCourse],
    queryFn: async () => {
      if (selectedCourse === 'all') return []
      const res = await api.get<Array<{ id: string; title: string }>>(`/instructor/courses/${selectedCourse}/lessons`)
      return res.data
    },
    enabled: selectedCourse !== 'all'
  })

  // Fetch concepts for selected course (filtered by lesson if specified)
  const { data: concepts = [] } = useQuery({
    queryKey: ['course-concepts', selectedCourse, selectedLesson],
    queryFn: async () => {
      if (selectedCourse === 'all') return []
      const params = new URLSearchParams()
      if (selectedLesson !== 'all') params.append('lesson_id', selectedLesson)
      const qs = params.toString()
      const res = await api.get<Array<{ id: string; name: string; lesson_ids?: string[] }>>(`/instructor/courses/${selectedCourse}/concepts${qs ? `?${qs}` : ''}`)
      return res.data
    },
    enabled: selectedCourse !== 'all'
  })

  // Fetch questions
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['question-bank', selectedCourse, selectedConcept, selectedDifficulty, selectedType, showInactiveOnly],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedCourse !== 'all') params.append('course_id', selectedCourse)
      if (selectedConcept !== 'all') params.append('concept_id', selectedConcept)
      if (selectedDifficulty !== 'all') params.append('difficulty_tier', selectedDifficulty)
      if (selectedType !== 'all') params.append('question_type', selectedType)
      if (showInactiveOnly) params.append('is_active', 'false')

      const res = await api.get<Question[]>(`/instructor/question-bank?${params.toString()}`)
      return res.data
    }
  })

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['question-bank-stats', selectedCourse],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedCourse !== 'all') params.append('course_id', selectedCourse)
      const res = await api.get<QuestionStats>(`/instructor/question-bank/stats?${params.toString()}`)
      return res.data
    }
  })

  // Update question mutation
  const updateMutation = useMutation({
    mutationFn: async (question: Question) => {
      await api.patch(`/instructor/question-bank/${question.id}`, {
        question_text: question.question_text,
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        hints: question.hints,
        difficulty_tier: question.difficulty_tier,
        is_active: question.is_active
      })
    },
    onSuccess: () => {
      toast.success('Question updated')
      queryClient.invalidateQueries({ queryKey: ['question-bank'] })
      setEditingQuestion(null)
    },
    onError: () => {
      toast.error('Failed to update question')
    }
  })

  // Delete question mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/instructor/question-bank/${id}`)
    },
    onSuccess: () => {
      toast.success('Question deleted')
      queryClient.invalidateQueries({ queryKey: ['question-bank'] })
      setSelectedQuestion(null)
    },
    onError: () => {
      toast.error('Failed to delete question')
    }
  })

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await api.patch(`/instructor/question-bank/${id}`, { is_active })
    },
    onSuccess: () => {
      toast.success('Question status updated')
      queryClient.invalidateQueries({ queryKey: ['question-bank'] })
    }
  })

  // Filtered questions
  const filteredQuestions = questions.filter(q => {
    if (searchQuery) {
      return q.question_text.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const getSuccessRate = (q: Question) => {
    if (q.times_shown === 0) return 0
    return Math.round((q.times_correct / q.times_shown) * 100)
  }

  const getDifficultyColor = (tier: string) => {
    switch (tier) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  return (
    <PageShell maxWidth="2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <PageHeader
          title={tPilot('title')}
          description={tPilot('description')}
          action={
            <Button variant="outline" onClick={() => setShowStats(!showStats)} className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {showStats ? tPilot('hideStats') : tPilot('showStats')}
            </Button>
          }
        />

        {/* Stats Overview */}
        {showStats && stats && (
          <Grid cols={4} gap="md">
            <MetricCard
              label="Total Questions"
              value={stats.total_questions}
              icon={FileText}
              variant="default"
            />
            <MetricCard
              label="Easy"
              value={stats.by_difficulty.easy}
              icon={TrendingDown}
              variant="success"
            />
            <MetricCard
              label="Medium"
              value={stats.by_difficulty.medium}
              icon={Clock}
              variant="warning"
            />
            <MetricCard
              label="Hard"
              value={stats.by_difficulty.hard}
              icon={TrendingUp}
              variant="danger"
            />
          </Grid>
        )}

        {/* Filters */}
        <SurfaceCard variant="muted">
          <Stack gap="md">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Heading level={4}>Filters</Heading>
            </div>

            {/* Row 1: Course, Lesson, Concept */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <LabelText>Course</LabelText>
                <Select 
                  value={selectedCourse} 
                  onValueChange={(value) => {
                    setSelectedCourse(value)
                    setSelectedLesson('all')
                    setSelectedConcept('all')
                  }}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <LabelText>Lesson</LabelText>
                <Select 
                  value={selectedLesson} 
                  onValueChange={(value) => {
                    setSelectedLesson(value)
                    setSelectedConcept('all')
                  }}
                  disabled={selectedCourse === 'all'}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Lessons</SelectItem>
                    {lessons.map(lesson => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <LabelText>Concept</LabelText>
                <Select 
                  value={selectedConcept} 
                  onValueChange={setSelectedConcept}
                  disabled={selectedCourse === 'all'}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Concepts</SelectItem>
                    {concepts.map(concept => (
                      <SelectItem key={concept.id} value={concept.id}>
                        {concept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Difficulty, Type, Search, Inactive toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_auto] gap-3 items-end">
              <div>
                <LabelText>Difficulty</LabelText>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <LabelText>Type</LabelText>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="short_answer">Short Answer</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <LabelText className="invisible">Search</LabelText>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search question text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pb-0.5">
                <Switch
                  checked={showInactiveOnly}
                  onCheckedChange={setShowInactiveOnly}
                />
                <Text size="sm" className="whitespace-nowrap">Inactive only</Text>
              </div>
            </div>
          </Stack>
        </SurfaceCard>

        {/* Questions List */}
        <Section
          title="Questions"
          description={`${filteredQuestions.length} questions found`}
        >
          {isLoading ? (
            <LoadingState message="Loading questions..." />
          ) : filteredQuestions.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Questions Found"
              description="No questions match your filters. Try adjusting your search criteria or generate more questions from concepts."
            />
          ) : (
            <Stack gap="sm">
              {filteredQuestions.map((question, index) => {
                const successRate = getSuccessRate(question)
                
                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <SurfaceCard
                      className="cursor-pointer hover:shadow-md transition-all"
                      onClick={() => setSelectedQuestion(question)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getDifficultyColor(question.difficulty_tier)}>
                              {question.difficulty_tier}
                            </Badge>
                            <Badge variant="secondary">
                              {question.question_type.replace('_', ' ')}
                            </Badge>
                            {!question.is_active && (
                              <Badge variant="outline" className="text-muted-foreground">
                                Inactive
                              </Badge>
                            )}
                            {question.concept_name && (
                              <Text size="sm" variant="muted">
                                {question.concept_name}
                              </Text>
                            )}
                          </div>

                          <Text className="font-medium mb-2">
                            {question.question_text}
                          </Text>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Shown {question.times_shown}x
                            </span>
                            {successRate !== null && (
                              <span className="flex items-center gap-1">
                                {successRate >= 70 ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-600" />
                                )}
                                {successRate}% success
                              </span>
                            )}
                            {question.avg_time_seconds && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Avg {Math.round(question.avg_time_seconds)}s
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingQuestion(question)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={question.is_active}
                            onCheckedChange={(checked) => {
                              toggleActiveMutation.mutate({ id: question.id, is_active: checked })
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    </SurfaceCard>
                  </motion.div>
                )
              })}
            </Stack>
          )}
        </Section>
      </motion.div>

      {/* Question Detail Drawer */}
      <DrawerLayout
        open={!!selectedQuestion && !editingQuestion}
        onClose={() => setSelectedQuestion(null)}
        title="Question Details"
        size="lg"
      >
        {selectedQuestion && (
          <Stack gap="lg">
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(selectedQuestion.difficulty_tier)}>
                {selectedQuestion.difficulty_tier}
              </Badge>
              <Badge variant="secondary">
                {selectedQuestion.question_type.replace('_', ' ')}
              </Badge>
              {!selectedQuestion.is_active && (
                <Badge variant="outline" className="text-muted-foreground">
                  Inactive
                </Badge>
              )}
            </div>

            <div>
              <LabelText>Question</LabelText>
              <Text className="mt-1">{selectedQuestion.question_text}</Text>
            </div>

            {selectedQuestion.options && selectedQuestion.options.length > 0 && (
              <div>
                <LabelText>Options</LabelText>
                <Stack gap="sm" className="mt-2">
                  {selectedQuestion.options.map((opt, idx) => (
                    <div
                      key={opt.id || idx}
                      className={`p-3 rounded-lg border ${
                        opt.is_correct
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                          : 'border-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {opt.is_correct && (
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        )}
                        <Text size="sm">{opt.text}</Text>
                      </div>
                    </div>
                  ))}
                </Stack>
              </div>
            )}

            {selectedQuestion.explanation && (
              <div>
                <LabelText>Explanation</LabelText>
                <Text size="sm" className="mt-1 text-muted-foreground">
                  {selectedQuestion.explanation}
                </Text>
              </div>
            )}

            {selectedQuestion.hints && selectedQuestion.hints.length > 0 && (
              <div>
                <LabelText>Hints</LabelText>
                <Stack gap="xs" className="mt-2">
                  {selectedQuestion.hints.map((hint, idx) => (
                    <Text key={idx} size="sm" className="text-muted-foreground">
                      {idx + 1}. {hint}
                    </Text>
                  ))}
                </Stack>
              </div>
            )}

            <InfoPanel variant="info" title="Performance Stats">
              <Grid cols={3} gap="sm" className="text-sm">
                <div>
                  <Text size="sm" variant="muted">Shown</Text>
                  <Text className="font-semibold">{selectedQuestion.times_shown}x</Text>
                </div>
                <div>
                  <Text size="sm" variant="muted">Correct</Text>
                  <Text className="font-semibold">{selectedQuestion.times_correct}x</Text>
                </div>
                <div>
                  <Text size="sm" variant="muted">Success Rate</Text>
                  <Text className="font-semibold">
                    {getSuccessRate(selectedQuestion) !== null 
                      ? `${getSuccessRate(selectedQuestion)}%` 
                      : 'N/A'}
                  </Text>
                </div>
              </Grid>
            </InfoPanel>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingQuestion(selectedQuestion)
                  setSelectedQuestion(null)
                }}
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm('Delete this question? This cannot be undone.')) {
                    deleteMutation.mutate(selectedQuestion.id)
                  }
                }}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </Stack>
        )}
      </DrawerLayout>

      {/* Edit Question Modal */}
      <ModalLayout
        open={!!editingQuestion}
        onClose={() => setEditingQuestion(null)}
        title="Edit Question"
        size="xl"
      >
        {editingQuestion && (
          <Stack gap="lg">
            <div>
              <LabelText required>Question Text</LabelText>
              <Textarea
                value={editingQuestion.question_text}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, question_text: e.target.value })
                }
                rows={4}
                className="mt-2"
              />
            </div>

            {/* Options Editor */}
            {editingQuestion.options && editingQuestion.options.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <LabelText>Answer Options</LabelText>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOption = { id: crypto.randomUUID(), text: '', is_correct: false }
                      setEditingQuestion({
                        ...editingQuestion,
                        options: [...(editingQuestion.options || []), newOption]
                      })
                    }}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Option
                  </Button>
                </div>
                <Stack gap="sm">
                  {editingQuestion.options.map((option, idx) => (
                    <div key={option.id || idx} className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingQuestion.options!.map((o, i) => ({
                            ...o,
                            is_correct: i === idx ? !o.is_correct : (editingQuestion.question_type === 'multiple_choice' ? false : o.is_correct)
                          }))
                          const correct = updated.find(o => o.is_correct)
                          setEditingQuestion({
                            ...editingQuestion,
                            options: updated,
                            correct_answer: correct ? correct.text : editingQuestion.correct_answer
                          })
                        }}
                        className={`mt-2.5 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors ${
                          option.is_correct
                            ? 'bg-green-500 border-green-500'
                            : 'border-muted-foreground/50 hover:border-green-400'
                        }`}
                        title={option.is_correct ? 'Correct answer' : 'Mark as correct'}
                      />
                      <Input
                        value={option.text}
                        onChange={(e) => {
                          const updated = editingQuestion.options!.map((o, i) =>
                            i === idx ? { ...o, text: e.target.value } : o
                          )
                          const correct = updated.find(o => o.is_correct)
                          setEditingQuestion({
                            ...editingQuestion,
                            options: updated,
                            correct_answer: correct ? correct.text : editingQuestion.correct_answer
                          })
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1"
                      />
                      {editingQuestion.options!.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-0.5 h-8 w-8 flex-shrink-0"
                          onClick={() => {
                            const updated = editingQuestion.options!.filter((_, i) => i !== idx)
                            setEditingQuestion({ ...editingQuestion, options: updated })
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </Stack>
                <HelperText className="mt-1">Click the circle to mark the correct answer</HelperText>
              </div>
            )}

            {/* Correct Answer (for non-MCQ types) */}
            {(!editingQuestion.options || editingQuestion.options.length === 0) && (
              <div>
                <LabelText>Correct Answer</LabelText>
                <Input
                  value={editingQuestion.correct_answer || ''}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value })
                  }
                  className="mt-2"
                  placeholder="Enter the correct answer"
                />
              </div>
            )}

            <div>
              <LabelText>Difficulty Tier</LabelText>
              <Select
                value={editingQuestion.difficulty_tier}
                onValueChange={(value) =>
                  setEditingQuestion({ ...editingQuestion, difficulty_tier: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <LabelText>Explanation</LabelText>
              <Textarea
                value={editingQuestion.explanation || ''}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                }
                rows={3}
                className="mt-2"
                placeholder="Explain the correct answer..."
              />
            </div>

            {/* Hints Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <LabelText>Hints</LabelText>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingQuestion({
                      ...editingQuestion,
                      hints: [...(editingQuestion.hints || []), '']
                    })
                  }}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Hint
                </Button>
              </div>
              {editingQuestion.hints && editingQuestion.hints.length > 0 ? (
                <Stack gap="sm">
                  {editingQuestion.hints.map((hint, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="mt-2.5 text-xs text-muted-foreground font-medium flex-shrink-0 w-4">{idx + 1}.</span>
                      <Input
                        value={hint}
                        onChange={(e) => {
                          const updated = [...editingQuestion.hints!]
                          updated[idx] = e.target.value
                          setEditingQuestion({ ...editingQuestion, hints: updated })
                        }}
                        placeholder={`Hint ${idx + 1}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-0.5 h-8 w-8 flex-shrink-0"
                        onClick={() => {
                          const updated = editingQuestion.hints!.filter((_, i) => i !== idx)
                          setEditingQuestion({ ...editingQuestion, hints: updated })
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </Stack>
              ) : (
                <Text size="sm" variant="muted">No hints yet. Hints help students progressively.</Text>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingQuestion.is_active}
                  onCheckedChange={(checked) =>
                    setEditingQuestion({ ...editingQuestion, is_active: checked })
                  }
                />
                <Text size="sm">{tPilot('activeUsedInPracticeSets')}</Text>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateMutation.mutate(editingQuestion)}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Stack>
        )}
      </ModalLayout>
    </PageShell>
  )
}
