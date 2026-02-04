'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  FileText, 
  Plus,
  Sparkles,
  BookOpen,
  Clock,
  CheckCircle,
  Loader2,
  Download,
  Copy,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion } from 'framer-motion'

// Design System
import { PageShell, PageHeader, Section, Grid, Stack } from '@/design-system/layout'
import { MetricCard, SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { EmptyState, LoadingState } from '@/design-system/feedback'
import { ModalLayout } from '@/design-system/patterns/modal-layout'
import { DrawerLayout } from '@/design-system/patterns/drawer-layout'
import { LabelText, HelperText } from '@/design-system/typography'

interface QuestionOption {
  id?: string
  text: string
  is_correct?: boolean
  explanation?: string
}

interface AssessmentQuestion {
  id: string
  question_type: string
  question_text: string
  options?: QuestionOption[] | string[]
  correct_answer?: string
  explanation?: string
  difficulty: number
}

interface Assessment {
  id: string
  title: string
  topic: string
  question_count: number
  difficulty: number
  status: 'generating' | 'ready' | 'failed'
  created_at: string
  questions?: AssessmentQuestion[]
}

interface Course {
  id: string
  title: string
}

export default function InstructorAssessments() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const legacy = searchParams.get('legacy') === '1'

  useEffect(() => {
    if (!legacy) {
      router.replace('/instructor/assessments-hub?tab=templates')
    }
  }, [legacy, router])

  if (!legacy) {
    return (
      <PageShell maxWidth="lg">
        <LoadingState message="Redirecting to Practice sets..." />
      </PageShell>
    )
  }

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [difficulty, setDifficulty] = useState([5])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [previewAssessment, setPreviewAssessment] = useState<Assessment | null>(null)
  const queryClient = useQueryClient()

  const { data: assessments, isLoading } = useQuery<Assessment[]>({
    queryKey: ['instructor-assessments'],
    queryFn: async () => {
      try {
        const res = await api.get('/instructor/ai-assessments')
        return Array.isArray(res.data) ? res.data : (res.data?.assessments || [])
      } catch {
        return []
      }
    },
  })

  const { data: assessmentDetails } = useQuery<Assessment>({
    queryKey: ['assessment-details', previewAssessment?.id],
    queryFn: async () => {
      if (!previewAssessment?.id) return null
      const res = await api.get(`/instructor/ai-assessments/${previewAssessment.id}`)
      return res.data
    },
    enabled: !!previewAssessment?.id,
  })

  const { data: courses } = useQuery<Course[]>({
    queryKey: ['instructor-courses-simple'],
    queryFn: async () => {
      try {
        const res = await api.get('/instructor/courses')
        return Array.isArray(res.data) ? res.data : (res.data?.courses || [])
      } catch {
        return []
      }
    },
  })

  const handleCopy = (assessment: Assessment) => {
    const details = assessmentDetails?.id === assessment.id ? assessmentDetails : assessment
    const questions = details?.questions || []
    
    let text = `Assessment: ${assessment.title}\nTopic: ${assessment.topic}\nDifficulty: ${assessment.difficulty}/10\n\n`
    
    questions.forEach((q, i) => {
      text += `${i + 1}. ${q.question_text}\n`
      if (q.options) {
        q.options.forEach((opt, j) => {
          const optText = typeof opt === 'string' ? opt : opt.text
          const isCorrect = typeof opt === 'object' && opt.is_correct
          text += `   ${String.fromCharCode(65 + j)}. ${optText}${isCorrect ? ' ✓' : ''}\n`
        })
      }
      if (q.correct_answer) {
        text += `   Answer: ${q.correct_answer}\n`
      }
      text += '\n'
    })
    
    navigator.clipboard.writeText(text)
    toast.success('AI assessment copied to clipboard!')
  }

  const handleDownload = (assessment: Assessment) => {
    const details = assessmentDetails?.id === assessment.id ? assessmentDetails : assessment
    const data = JSON.stringify(details, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `assessment-${assessment.topic?.replace(/\s+/g, '-').toLowerCase() || assessment.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('AI assessment downloaded!')
  }

  const generateAssessment = useMutation({
    mutationFn: async () => {
      const res = await api.post('/llm/assess', {
        topic,
        content,
        question_count: questionCount,
        difficulty: difficulty[0],
      }, {
        params: { course_id: selectedCourse || undefined },
        timeout: 120000,
      })
      return res.data
    },
    onSuccess: () => {
      toast.success('AI assessment generation started!')
      setCreateModalOpen(false)
      setTopic('')
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['instructor-assessments'] })
    },
    onError: () => {
      toast.error('Failed to generate AI assessment')
    },
  })

  const allAssessments = assessments || []

  return (
    <PageShell maxWidth="2xl">
      <PageHeader
        title="AI assessments"
        description="Generate practice questions from your lesson content using AI"
        action={
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate AI assessment
          </Button>
        }
      />

      {/* Stats */}
      <Section>
        <Grid cols={3} gap="md">
          <MetricCard
            label="Total AI assessments"
            value={allAssessments.length}
            icon={FileText}
            variant="default"
          />
          <MetricCard
            label="Ready"
            value={allAssessments.filter(a => a.status === 'ready').length}
            icon={CheckCircle}
            variant="success"
          />
          <MetricCard
            label="Generating"
            value={allAssessments.filter(a => a.status === 'generating').length}
            icon={Clock}
            variant="warning"
          />
        </Grid>
      </Section>

      {/* Assessments List */}
      <Section>
        {isLoading ? (
          <LoadingState message="Loading AI assessments..." />
        ) : allAssessments.length === 0 ? (
          <SurfaceCard variant="muted" className="py-12">
            <EmptyState
              icon={FileText}
              title="No AI assessments yet"
              description="Generate your first AI assessment from lesson content"
              action={{
                label: 'Generate AI assessment',
                onClick: () => setCreateModalOpen(true)
              }}
            />
          </SurfaceCard>
        ) : (
          <Grid cols={3} gap="md">
            {allAssessments.map((assessment, index) => (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <SurfaceCard className="h-full flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg line-clamp-1 mb-1">
                        {assessment.title || assessment.topic}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {assessment.topic}
                      </p>
                    </div>
                    {assessment.status === 'ready' && (
                      <Badge className="bg-green-600 shrink-0">Ready</Badge>
                    )}
                    {assessment.status === 'generating' && (
                      <Badge variant="outline" className="text-yellow-600 shrink-0">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processing
                      </Badge>
                    )}
                    {assessment.status === 'failed' && (
                      <Badge variant="destructive" className="shrink-0">Failed</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {assessment.question_count} questions
                    </span>
                    <span>Difficulty {assessment.difficulty}/10</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-4">
                    Created {formatDistanceToNow(new Date(assessment.created_at), { addSuffix: true })}
                  </div>
                  
                  {assessment.status === 'ready' && (
                    <div className="flex gap-2 mt-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setPreviewAssessment(assessment)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopy(assessment)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(assessment)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </SurfaceCard>
              </motion.div>
            ))}
          </Grid>
        )}
      </Section>

      {/* Create Assessment Modal */}
      <ModalLayout
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Generate Practice Set"
        description="AI will create questions based on your topic and content"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => generateAssessment.mutate()}
              disabled={!topic || !selectedCourse || generateAssessment.isPending}
              className="gap-2"
            >
              {generateAssessment.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate
            </Button>
          </>
        }
      >
        <Stack gap="md">
          <div className="space-y-2">
            <LabelText required>Topic</LabelText>
            <Input
              placeholder="e.g., Python Lists and Dictionaries"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <LabelText required>Course</LabelText>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {(courses || []).map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <LabelText>Content (Optional)</LabelText>
            <Textarea
              placeholder="Paste lesson content, lecture notes, or leave empty for general questions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
            <HelperText>Add specific content to generate more targeted questions</HelperText>
          </div>

          {/* Advanced Options */}
          <div className="rounded-lg border border-border/50 bg-muted/20">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <span className="font-medium text-sm">Advanced Options</span>
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showAdvanced && (
              <div className="p-4 pt-0 space-y-4 border-t border-border/50">
                <div className="space-y-2">
                  <Label>Number of Questions: {questionCount}</Label>
                  <Slider
                    value={[questionCount]}
                    onValueChange={(v) => setQuestionCount(v[0])}
                    min={3}
                    max={20}
                    step={1}
                  />
                  <HelperText>3-20 questions</HelperText>
                </div>
                
                <div className="space-y-2">
                  <Label>Difficulty: {difficulty[0]}/10</Label>
                  <Slider
                    value={difficulty}
                    onValueChange={setDifficulty}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <HelperText>1 (Beginner) to 10 (Expert)</HelperText>
                </div>
              </div>
            )}
          </div>
        </Stack>
      </ModalLayout>

      {/* Preview Drawer */}
      <DrawerLayout
        open={!!previewAssessment}
        onClose={() => setPreviewAssessment(null)}
        title={previewAssessment?.title || previewAssessment?.topic || 'AI assessment preview'}
        description={`${previewAssessment?.question_count} questions • Difficulty ${previewAssessment?.difficulty}/10`}
        size="xl"
      >
        <ScrollArea className="h-full pr-4">
          <Stack gap="md">
            {(assessmentDetails?.questions || []).map((q, i) => {
              const typeLabels: Record<string, string> = {
                'multiple_choice': 'Multiple Choice',
                'short_answer': 'Short Answer',
                'true_false': 'True/False',
                'fill_in_blank': 'Fill in Blank',
                'code': 'Code',
              }
              return (
                <SurfaceCard key={q.id || i} padding="md">
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                      Q{i + 1}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {typeLabels[q.question_type] || q.question_type}
                    </Badge>
                  </div>
                  
                  <p className="font-medium text-base mb-3">{q.question_text}</p>
                  
                  {q.options && (
                    <div className="space-y-2">
                      {q.options.map((opt, j) => {
                        const optText = typeof opt === 'string' ? opt : opt.text
                        const isCorrect = typeof opt === 'object' && opt.is_correct
                        return (
                          <div 
                            key={j} 
                            className={`flex items-start gap-3 p-2 rounded-md ${
                              isCorrect ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900' : ''
                            }`}
                          >
                            <div className={`
                              flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium
                              ${isCorrect ? 'border-green-600 text-green-600 bg-green-100' : 'border-muted-foreground text-muted-foreground'}
                            `}>
                              {String.fromCharCode(65 + j)}
                            </div>
                            <span className={`text-sm ${isCorrect ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                              {optText}
                            </span>
                            {isCorrect && (
                              <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  
                  {q.correct_answer && !q.options && (
                    <div className="mt-2 p-2 rounded-md bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900">
                      <p className="text-sm text-green-600">
                        <strong>Answer:</strong> {q.correct_answer}
                      </p>
                    </div>
                  )}
                  
                  {q.explanation && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      {q.explanation}
                    </p>
                  )}
                </SurfaceCard>
              )
            })}
            {(!assessmentDetails?.questions || assessmentDetails.questions.length === 0) && (
              <LoadingState message="Loading questions..." />
            )}
          </Stack>
        </ScrollArea>
      </DrawerLayout>
    </PageShell>
  )
}
