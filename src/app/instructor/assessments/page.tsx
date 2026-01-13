'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
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
  Eye
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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
        const res = await api.get('/instructor/assessments')
        // Handle both wrapped and direct array responses
        return Array.isArray(res.data) ? res.data : (res.data?.assessments || [])
      } catch {
        return []
      }
    },
  })

  // Fetch single assessment with questions for preview
  const { data: assessmentDetails } = useQuery<Assessment>({
    queryKey: ['assessment-details', previewAssessment?.id],
    queryFn: async () => {
      if (!previewAssessment?.id) return null
      const res = await api.get(`/instructor/assessments/${previewAssessment.id}`)
      return res.data
    },
    enabled: !!previewAssessment?.id,
  })

  const { data: courses } = useQuery<Course[]>({
    queryKey: ['instructor-courses-simple'],
    queryFn: async () => {
      try {
        const res = await api.get('/instructor/courses')
        // Handle both wrapped and direct array responses
        return Array.isArray(res.data) ? res.data : (res.data?.courses || [])
      } catch {
        return []
      }
    },
  })

  // Copy assessment to clipboard
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
    toast.success('Assessment copied to clipboard!')
  }

  // Download assessment as JSON
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
    toast.success('Assessment downloaded!')
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
        timeout: 120000, // 2 minute timeout for large assessments
      })
      return res.data
    },
    onSuccess: () => {
      toast.success('Assessment generation started!')
      setIsDialogOpen(false)
      setTopic('')
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['instructor-assessments'] })
    },
    onError: () => {
      toast.error('Failed to generate assessment')
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Assessments</h1>
          <p className="text-muted-foreground">Generate quizzes from your lesson content</p>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const allAssessments = assessments || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assessments</h1>
          <p className="text-muted-foreground">Generate quizzes from your lesson content</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate AI Assessment</DialogTitle>
              <DialogDescription>
                AI will create questions based on your topic and content
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Python Lists and Dictionaries"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="content">Content (optional)</Label>
                <Textarea
                  id="content"
                  placeholder="Paste lesson content, lecture notes, or leave empty for general questions..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="course">Link to Course (optional)</Label>
                <Select value={selectedCourse || 'none'} onValueChange={(v) => setSelectedCourse(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No course</SelectItem>
                    {(courses || []).map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Questions: {questionCount}</Label>
                  <Slider
                    value={[questionCount]}
                    onValueChange={(v) => setQuestionCount(v[0])}
                    min={3}
                    max={20}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Difficulty: {difficulty[0]}/10</Label>
                  <Slider
                    value={difficulty}
                    onValueChange={setDifficulty}
                    min={1}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => generateAssessment.mutate()}
                disabled={!topic || generateAssessment.isPending}
              >
                {generateAssessment.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allAssessments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {allAssessments.filter(a => a.status === 'ready').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Generating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {allAssessments.filter(a => a.status === 'generating').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessments Grid */}
      {allAssessments.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No assessments yet</h3>
          <p className="text-muted-foreground mb-4">
            Generate your first assessment from lesson content
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Assessment
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allAssessments.map((assessment) => (
            <Card key={assessment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{assessment.title || assessment.topic}</CardTitle>
                    <CardDescription>{assessment.topic}</CardDescription>
                  </div>
                  {assessment.status === 'ready' && (
                    <Badge className="bg-green-600">Ready</Badge>
                  )}
                  {assessment.status === 'generating' && (
                    <Badge variant="outline" className="text-yellow-600">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Generating
                    </Badge>
                  )}
                  {assessment.status === 'failed' && (
                    <Badge variant="destructive">Failed</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span>{assessment.question_count} questions</span>
                  <span>Difficulty {assessment.difficulty}/10</span>
                </div>
                <div className="text-xs text-muted-foreground mb-4">
                  Created {formatDistanceToNow(new Date(assessment.created_at), { addSuffix: true })}
                </div>
                {assessment.status === 'ready' && (
                  <div className="flex gap-2">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Sheet */}
      <Sheet open={!!previewAssessment} onOpenChange={(open) => !open && setPreviewAssessment(null)}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{previewAssessment?.title || previewAssessment?.topic}</SheetTitle>
            <SheetDescription>
              {previewAssessment?.question_count} questions • Difficulty {previewAssessment?.difficulty}/10
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-150px)] mt-4 pr-4">
            <div className="space-y-4">
              {(assessmentDetails?.questions || []).map((q, i) => {
                const typeLabels: Record<string, string> = {
                  'multiple_choice': 'Multiple Choice',
                  'short_answer': 'Short Answer',
                  'true_false': 'True/False',
                  'fill_in_blank': 'Fill in Blank',
                  'code': 'Code',
                }
                return (
                  <div key={q.id || i} className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium">{i + 1}. {q.question_text}</p>
                      <Badge variant="secondary" className="ml-2 flex-shrink-0 text-xs">
                        {typeLabels[q.question_type] || q.question_type}
                      </Badge>
                    </div>
                    {q.options && (
                      <div className="space-y-1 ml-4 mt-3">
                        {q.options.map((opt, j) => {
                          const optText = typeof opt === 'string' ? opt : opt.text
                          const isCorrect = typeof opt === 'object' && opt.is_correct
                          return (
                            <p key={j} className={`text-sm ${isCorrect ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                              {String.fromCharCode(65 + j)}. {optText}
                              {isCorrect && ' ✓'}
                            </p>
                          )
                        })}
                      </div>
                    )}
                    {q.correct_answer && !q.options && (
                      <p className="text-sm text-green-600 mt-2 ml-4">
                        Answer: {q.correct_answer}
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-xs text-muted-foreground mt-2 ml-4 italic">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                )
              })}
              {(!assessmentDetails?.questions || assessmentDetails.questions.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading questions...
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
