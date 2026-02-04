'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

// Design System
import { PageShell, Section, Stack, Grid } from '@/design-system/layout'
import { SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { Heading, Text, LabelText, HelperText } from '@/design-system/typography'

interface Course {
  id: string
  title: string
}

interface Concept {
  id: string
  name: string
}

export default function NewPracticeSetPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('course_id')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('quiz')
  const [questionCount, setQuestionCount] = useState(10)
  const [timeLimit, setTimeLimit] = useState<number | null>(30)
  const [hasTimeLimit, setHasTimeLimit] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState(courseId || '')
  
  // Question types
  const [allowMcq, setAllowMcq] = useState(true)
  const [allowShortAnswer, setAllowShortAnswer] = useState(false)
  const [allowCode, setAllowCode] = useState(false)
  
  // Difficulty distribution
  const [easyPercent, setEasyPercent] = useState(30)
  const [mediumPercent, setMediumPercent] = useState(50)
  const [hardPercent, setHardPercent] = useState(20)
  
  // Grading
  const [passThreshold, setPassThreshold] = useState<number | null>(70)
  const [showResultsMode, setShowResultsMode] = useState('after_close')
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false)
  const [retakePolicy, setRetakePolicy] = useState('none')
  const [maxAttempts, setMaxAttempts] = useState(1)
  
  // Coverage
  const [coverageMode, setCoverageMode] = useState<'lessons' | 'concepts'>('lessons')
  const [selectedLessons, setSelectedLessons] = useState<string[]>([])
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([])

  // Fetch courses
  const { data: courses } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const res = await api.get<Course[]>('/instructor/courses')
      return res.data
    }
  })

  // Fetch lessons for selected course
  const { data: lessons } = useQuery({
    queryKey: ['course-lessons', selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return []
      const res = await api.get<any[]>(`/instructor/courses/${selectedCourse}/lessons`)
      return res.data
    },
    enabled: !!selectedCourse
  })

  // Fetch concepts for selected course
  const { data: concepts } = useQuery({
    queryKey: ['course-concepts', selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return []
      const res = await api.get<Concept[]>(`/instructor/courses/${selectedCourse}/concepts`)
      return res.data
    },
    enabled: !!selectedCourse
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCourse) {
        throw new Error('Please select a course')
      }

      const allowedTypes = []
      if (allowMcq) allowedTypes.push('mcq')
      if (allowShortAnswer) allowedTypes.push('short_answer')
      if (allowCode) allowedTypes.push('code')

      if (allowedTypes.length === 0) {
        throw new Error('Select at least one question type')
      }

      // Validate coverage selection
      if (coverageMode === 'lessons' && selectedLessons.length === 0) {
        throw new Error('Please select at least one lesson')
      }
      if (coverageMode === 'concepts' && selectedConcepts.length === 0) {
        throw new Error('Please select at least one concept')
      }

      // Normalize difficulty distribution
      const total = easyPercent + mediumPercent + hardPercent
      const distribution = {
        easy: easyPercent / total,
        medium: mediumPercent / total,
        hard: hardPercent / total
      }

      // Build coverage weights (equal weight for selected items)
      const coverageWeights: Record<string, number> = {}
      const selectedIds = coverageMode === 'lessons' ? selectedLessons : selectedConcepts
      const weight = 1 / selectedIds.length
      selectedIds.forEach(id => {
        coverageWeights[id] = weight
      })

      const payload = {
        title,
        description: description || undefined,
        type,
        question_count: questionCount,
        time_limit_minutes: hasTimeLimit ? timeLimit : null,
        allowed_question_types: allowedTypes,
        difficulty_distribution: distribution,
        coverage_mode: coverageMode,
        coverage_weights: coverageWeights,
        pass_threshold: passThreshold,
        show_results_mode: showResultsMode,
        show_correct_answers: showCorrectAnswers,
        retake_policy: retakePolicy,
        max_attempts: maxAttempts
      }

      const res = await api.post(`/instructor/assessments/templates?course_id=${selectedCourse}`, payload)
      return res.data
    },
    onSuccess: () => {
      toast.success('Practice set created successfully')
      router.push('/instructor/assessments-hub?tab=templates')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create practice set')
    }
  })

  // Auto-adjust difficulty sliders
  useEffect(() => {
    const total = easyPercent + mediumPercent + hardPercent
    if (total !== 100) {
      // Auto-adjust medium to make it sum to 100
      const newMedium = 100 - easyPercent - hardPercent
      if (newMedium >= 0 && newMedium <= 100) {
        setMediumPercent(newMedium)
      }
    }
  }, [easyPercent, hardPercent])

  const distributionTotal = easyPercent + mediumPercent + hardPercent
  const isValidDistribution = distributionTotal === 100

  return (
    <PageShell maxWidth="2xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Link href="/instructor/assessments-hub?tab=templates">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Practice sets
            </Button>
          </Link>
          <Heading level={1}>Create practice set</Heading>
          <Text variant="muted" className="mt-2">
            Set up a practice set. When you’re ready, publish it to students to start collecting grades.
          </Text>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-8">
          {/* Basic Information */}
          <Section title="Basic Information">
            <SurfaceCard>
              <Stack gap="lg">
                <div>
                  <LabelText required>Course</LabelText>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <LabelText required>Title</LabelText>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Week 3 Quiz"
                    required
                  />
                </div>

                <div>
                  <LabelText>Description</LabelText>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description of what this practice set covers"
                    rows={3}
                  />
                </div>

                <Grid cols={2} gap="md">
                  <div>
                    <LabelText required>Practice set type</LabelText>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="midterm">Midterm</SelectItem>
                        <SelectItem value="final">Final Exam</SelectItem>
                        <SelectItem value="mock">Mock Exam</SelectItem>
                        <SelectItem value="placement">Placement Test</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <LabelText required>Number of Questions</LabelText>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      required
                    />
                  </div>
                </Grid>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <LabelText>Time Limit</LabelText>
                    <Switch checked={hasTimeLimit} onCheckedChange={setHasTimeLimit} />
                  </div>
                  {hasTimeLimit && (
                    <>
                      <Input
                        type="number"
                        min={1}
                        value={timeLimit || ''}
                        onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                        placeholder="Minutes"
                      />
                      <HelperText>Students must complete within this time</HelperText>
                    </>
                  )}
                  {!hasTimeLimit && (
                    <HelperText>No time limit - students can take as long as needed</HelperText>
                  )}
                </div>
              </Stack>
            </SurfaceCard>
          </Section>

          {/* Coverage Selection */}
          <Section title="Content Coverage" description="Select which lessons/concepts to include questions from">
            <SurfaceCard>
              <Stack gap="lg">
                <div>
                  <LabelText required>Coverage Mode</LabelText>
                  <Select value={coverageMode} onValueChange={(v: any) => {
                    setCoverageMode(v)
                    setSelectedLessons([])
                    setSelectedConcepts([])
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lessons">By Lessons</SelectItem>
                      <SelectItem value="concepts">By Concepts</SelectItem>
                    </SelectContent>
                  </Select>
                  <HelperText>
                    {coverageMode === 'lessons' 
                      ? 'Questions will be selected from the question bank filtered by chosen lessons' 
                      : 'Questions will be selected from the question bank filtered by chosen concepts'}
                  </HelperText>
                </div>

                {/* Lesson Selection */}
                {coverageMode === 'lessons' && (
                  <div>
                    <LabelText required>Select Lessons</LabelText>
                    {!selectedCourse ? (
                      <InfoPanel
                        icon={AlertCircle}
                        variant="info"
                        title="Select a course first"
                        description="Please select a course above to see available lessons"
                      />
                    ) : !lessons || lessons.length === 0 ? (
                      <InfoPanel
                        icon={AlertCircle}
                        variant="warning"
                        title="No lessons found"
                        description="This course doesn't have any lessons yet. Add lessons to the course first."
                      />
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                          <Switch
                            checked={selectedLessons.length === lessons.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLessons(lessons.map(l => l.id))
                              } else {
                                setSelectedLessons([])
                              }
                            }}
                          />
                          <Text size="sm" className="font-semibold">Select All ({lessons.length})</Text>
                        </div>
                        {lessons.map(lesson => (
                          <div key={lesson.id} className="flex items-center gap-2 py-1">
                            <Switch
                              checked={selectedLessons.includes(lesson.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedLessons([...selectedLessons, lesson.id])
                                } else {
                                  setSelectedLessons(selectedLessons.filter(id => id !== lesson.id))
                                }
                              }}
                            />
                            <Text size="sm">{lesson.title}</Text>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedLessons.length > 0 && (
                      <Text size="sm" variant="muted" className="mt-2">
                        {selectedLessons.length} lesson(s) selected - questions will be randomly selected from these lessons
                      </Text>
                    )}
                  </div>
                )}

                {/* Concept Selection */}
                {coverageMode === 'concepts' && (
                  <div>
                    <LabelText required>Select Concepts</LabelText>
                    {!selectedCourse ? (
                      <InfoPanel
                        icon={AlertCircle}
                        variant="info"
                        title="Select a course first"
                        description="Please select a course above to see available concepts"
                      />
                    ) : !concepts || concepts.length === 0 ? (
                      <InfoPanel
                        icon={AlertCircle}
                        variant="warning"
                        title="No concepts found"
                        description="This course doesn't have any concepts yet. Add concepts to the course first."
                      />
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                          <Switch
                            checked={selectedConcepts.length === concepts.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedConcepts(concepts.map(c => c.id))
                              } else {
                                setSelectedConcepts([])
                              }
                            }}
                          />
                          <Text size="sm" className="font-semibold">Select All ({concepts.length})</Text>
                        </div>
                        {concepts.map(concept => (
                          <div key={concept.id} className="flex items-center gap-2 py-1">
                            <Switch
                              checked={selectedConcepts.includes(concept.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedConcepts([...selectedConcepts, concept.id])
                                } else {
                                  setSelectedConcepts(selectedConcepts.filter(id => id !== concept.id))
                                }
                              }}
                            />
                            <Text size="sm">{concept.name}</Text>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedConcepts.length > 0 && (
                      <Text size="sm" variant="muted" className="mt-2">
                        {selectedConcepts.length} concept(s) selected - questions will be randomly selected from these concepts
                      </Text>
                    )}
                  </div>
                )}
              </Stack>
            </SurfaceCard>
          </Section>

          {/* Question Configuration */}
          <Section title="Question Configuration">
            <SurfaceCard>
              <Stack gap="lg">
                <div>
                  <LabelText required>Allowed Question Types</LabelText>
                  <HelperText className="mb-3">Select at least one type</HelperText>
                  <Stack gap="sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <Text className="font-medium">Multiple Choice</Text>
                        <Text size="sm" variant="muted">Auto-graded</Text>
                      </div>
                      <Switch checked={allowMcq} onCheckedChange={setAllowMcq} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Text className="font-medium">Short Answer</Text>
                        <Text size="sm" variant="muted">Manual grading required</Text>
                      </div>
                      <Switch checked={allowShortAnswer} onCheckedChange={setAllowShortAnswer} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Text className="font-medium">Code</Text>
                        <Text size="sm" variant="muted">Manual grading required</Text>
                      </div>
                      <Switch checked={allowCode} onCheckedChange={setAllowCode} />
                    </div>
                  </Stack>
                </div>

                <div>
                  <LabelText>Difficulty Distribution</LabelText>
                  <HelperText className="mb-4">
                    Distribution must total 100% • Current: {distributionTotal}%
                  </HelperText>
                  
                  <Stack gap="md">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Text size="sm">Easy</Text>
                        <Badge variant="secondary">{easyPercent}%</Badge>
                      </div>
                      <Slider
                        value={[easyPercent]}
                        onValueChange={([v]) => setEasyPercent(v)}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Text size="sm">Medium</Text>
                        <Badge variant="secondary">{mediumPercent}%</Badge>
                      </div>
                      <Slider
                        value={[mediumPercent]}
                        onValueChange={([v]) => setMediumPercent(v)}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Text size="sm">Hard</Text>
                        <Badge variant="secondary">{hardPercent}%</Badge>
                      </div>
                      <Slider
                        value={[hardPercent]}
                        onValueChange={([v]) => setHardPercent(v)}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                  </Stack>

                  {!isValidDistribution && (
                    <InfoPanel icon={AlertCircle} title="Invalid Distribution" variant="warning" className="mt-3">
                      <Text size="sm">Total must equal 100%. Adjust the sliders.</Text>
                    </InfoPanel>
                  )}
                </div>
              </Stack>
            </SurfaceCard>
          </Section>

          {/* Grading & Results */}
          <Section title="Grading & Results">
            <SurfaceCard>
              <Stack gap="lg">
                <Grid cols={2} gap="md">
                  <div>
                    <LabelText>Pass Threshold (%)</LabelText>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={passThreshold || ''}
                      onChange={(e) => setPassThreshold(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="e.g., 70"
                    />
                    <HelperText>Leave empty for no pass/fail</HelperText>
                  </div>

                  <div>
                    <LabelText>Show Results</LabelText>
                    <Select value={showResultsMode} onValueChange={setShowResultsMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediately after submission</SelectItem>
                        <SelectItem value="after_close">After practice set closes</SelectItem>
                        <SelectItem value="manual_release">Manual release only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Grid>

                <div className="flex items-center justify-between">
                  <div>
                    <Text className="font-medium">Show Correct Answers</Text>
                    <Text size="sm" variant="muted">Display correct answers when showing results</Text>
                  </div>
                  <Switch checked={showCorrectAnswers} onCheckedChange={setShowCorrectAnswers} />
                </div>

                <Grid cols={2} gap="md">
                  <div>
                    <LabelText>Retake Policy</LabelText>
                    <Select value={retakePolicy} onValueChange={setRetakePolicy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No retakes</SelectItem>
                        <SelectItem value="one_retake">One retake allowed</SelectItem>
                        <SelectItem value="multiple">Multiple retakes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {retakePolicy !== 'none' && (
                    <div>
                      <LabelText>Max Attempts</LabelText>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={maxAttempts}
                        onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
                      />
                    </div>
                  )}
                </Grid>
              </Stack>
            </SurfaceCard>
          </Section>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !isValidDistribution || !selectedCourse || !title}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {createMutation.isPending ? 'Creating...' : 'Create practice set'}
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  )
}
