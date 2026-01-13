'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useLLMService, LLM_MESSAGES } from '@/hooks/useLLMService'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FileText, Brain, Wand2, CheckCircle2, BookOpen, 
  Lightbulb, AlertCircle, Target, RefreshCw, 
  Sparkles, Edit2, Trash2, Plus, ArrowRight,
  Info, Shield, Eye, Check, X
} from 'lucide-react'
import { toast } from 'sonner'
import { PilotBanner } from '@/components/feature-gate'
import { MVP_MESSAGES } from '@/lib/feature-flags'

// Types for the Path B flow
interface ExtractedConcept {
  id: string
  name: string
  description: string
  prerequisites: string[]
  difficulty: number
  selected: boolean  // For instructor review
  edited: boolean    // Track if instructor modified it
}

interface ContentAnalysis {
  summary?: string
  concepts: ExtractedConcept[]
  key_points: string[]
  difficulty_estimate?: number
  word_count?: number
  reading_time_minutes?: number
  lesson_mapping?: { concept: string; relevance: number }[]
}

interface GeneratedQuestion {
  id: string
  type: string
  question: string
  options?: string[]
  answer?: string
  explanation?: string
  concept_id?: string
}

interface AssessmentResult {
  assessment_id: string
  questions: GeneratedQuestion[]
}

export default function ContentStructuringPage() {
  const { isAvailable: llmAvailable, isChecking: llmChecking, refresh: refreshLLM } = useLLMService()
  
  // Workflow state
  const [currentStep, setCurrentStep] = useState<'input' | 'review' | 'generate'>('input')
  
  // Content input state
  const [content, setContent] = useState('')
  const [contentTitle, setContentTitle] = useState('')
  
  // Analysis result state
  const [analysisResult, setAnalysisResult] = useState<ContentAnalysis | null>(null)
  const [concepts, setConcepts] = useState<ExtractedConcept[]>([])
  const [editingConcept, setEditingConcept] = useState<string | null>(null)
  
  // Assessment state
  const [questionCount, setQuestionCount] = useState(5)
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)

  // Analyze content mutation
  const analyzeContentMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<ContentAnalysis>(`/api/v1/instructor/analyze-content`, null, {
        params: {
          content: content,
          title: contentTitle || 'Lesson Content',
        },
      })
      return res.data
    },
    onSuccess: (result) => {
      toast.success('Content analyzed! Review the suggested concepts below.')
      setAnalysisResult(result)
      // Transform concepts to include review state
      const extractedConcepts: ExtractedConcept[] = result.concepts.map((name, i) => ({
        id: `concept-${i}`,
        name: typeof name === 'string' ? name : (name as any).name || 'Unnamed',
        description: typeof name === 'string' ? '' : (name as any).description || '',
        prerequisites: [],
        difficulty: result.difficulty_estimate || 5,
        selected: true,  // Selected by default
        edited: false,
      }))
      setConcepts(extractedConcepts)
      setCurrentStep('review')
    },
    onError: () => {
      toast.error('Failed to analyze content. Please try again.')
    },
  })

  // Generate assessment mutation
  const generateAssessmentMutation = useMutation({
    mutationFn: async () => {
      const approvedConcepts = concepts.filter(c => c.selected)
      const res = await api.post<AssessmentResult>('/api/v1/instructor/generate-assessment', {
        topic: approvedConcepts.map(c => c.name).join(', '),
        content: content,
        difficulty: 5,
        question_count: questionCount,
        question_types: ['multiple_choice', 'short_answer'],
        concepts: approvedConcepts.map(c => c.name),
      })
      return res.data
    },
    onSuccess: (result) => {
      toast.success('Assessment generated from your approved concepts!')
      setAssessmentResult(result)
    },
    onError: () => {
      toast.error('Failed to generate assessment. Please try again.')
    },
  })

  // Concept management
  const toggleConcept = (id: string) => {
    setConcepts(prev => prev.map(c => 
      c.id === id ? { ...c, selected: !c.selected } : c
    ))
  }

  const updateConcept = (id: string, updates: Partial<ExtractedConcept>) => {
    setConcepts(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates, edited: true } : c
    ))
  }

  const deleteConcept = (id: string) => {
    setConcepts(prev => prev.filter(c => c.id !== id))
  }

  const addConcept = () => {
    const newConcept: ExtractedConcept = {
      id: `concept-${Date.now()}`,
      name: 'New Concept',
      description: '',
      prerequisites: [],
      difficulty: 5,
      selected: true,
      edited: true,
    }
    setConcepts(prev => [...prev, newConcept])
  }

  const approvedCount = concepts.filter(c => c.selected).length

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Pilot Banner */}
      <PilotBanner />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Structuring</h1>
        <p className="text-muted-foreground mt-1">
          {MVP_MESSAGES.description}
        </p>
      </div>

      {/* LLM Service Status */}
      {!llmAvailable && !llmChecking && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analysis Service Unavailable</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{LLM_MESSAGES.unavailable}</span>
            <Button variant="outline" size="sm" onClick={() => refreshLLM()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Workflow Steps Indicator */}
      <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
        <StepIndicator 
          step={1} 
          label="Add Content" 
          active={currentStep === 'input'}
          completed={currentStep !== 'input'}
        />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepIndicator 
          step={2} 
          label="Review Concepts" 
          active={currentStep === 'review'}
          completed={currentStep === 'generate'}
        />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepIndicator 
          step={3} 
          label="Generate Assessment" 
          active={currentStep === 'generate'}
          completed={!!assessmentResult}
        />
      </div>

      {/* Step 1: Content Input */}
      {currentStep === 'input' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Step 1: Add Your Content
                </CardTitle>
                <CardDescription>
                  Paste lesson text, notes, or transcript. AI will suggest concepts for your review.
                </CardDescription>
              </div>
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                {MVP_MESSAGES.instructorControl}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Why this step exists */}
            <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                <strong>Why this step:</strong> We analyze your content to extract potential concepts. 
                Nothing is published until you review and approve.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Content Title (optional)</Label>
              <Input
                placeholder="e.g., Introduction to Python Variables"
                value={contentTitle}
                onChange={(e) => setContentTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Lesson Content *</Label>
              <Textarea
                placeholder="Paste your lesson content here...&#10;&#10;This can be:&#10;• Text from slides&#10;• Lecture notes&#10;• Video transcript&#10;• Chapter from a textbook"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {content.length} characters • ~{Math.ceil(content.split(/\s+/).filter(Boolean).length / 200)} min read
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              {MVP_MESSAGES.manualTrigger}
            </p>
            <Button 
              onClick={() => analyzeContentMutation.mutate()}
              className="gap-2"
              disabled={analyzeContentMutation.isPending || !content.trim() || !llmAvailable}
            >
              {analyzeContentMutation.isPending ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Analyze Content
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Concept Review */}
      {currentStep === 'review' && (
        <div className="space-y-6">
          {/* Summary Card */}
          {analysisResult?.summary && (
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Content Summary
                </h4>
                <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Step 2: Review Suggested Concepts
                  </CardTitle>
                  <CardDescription>
                    These concepts were extracted from your content. Review, edit, or remove before approving.
                  </CardDescription>
                </div>
                <Badge className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  <Eye className="h-3 w-3" />
                  {MVP_MESSAGES.aiSuggests}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Why this step exists */}
              <Alert className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                <Info className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-700 dark:text-purple-300 text-sm">
                  <strong>Why this step:</strong> AI suggestions are not always accurate. 
                  You are the expert — rename, merge, or delete concepts as needed.
                </AlertDescription>
              </Alert>

              {/* Concepts List */}
              <div className="space-y-3">
                {concepts.map((concept) => (
                  <div 
                    key={concept.id}
                    className={`p-4 rounded-lg border transition-all ${
                      concept.selected 
                        ? 'border-primary/50 bg-primary/5' 
                        : 'border-muted bg-muted/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={concept.selected}
                        onCheckedChange={() => toggleConcept(concept.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        {editingConcept === concept.id ? (
                          <div className="space-y-2">
                            <Input
                              value={concept.name}
                              onChange={(e) => updateConcept(concept.id, { name: e.target.value })}
                              className="font-medium"
                              autoFocus
                            />
                            <Textarea
                              value={concept.description}
                              onChange={(e) => updateConcept(concept.id, { description: e.target.value })}
                              placeholder="Add a description..."
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => setEditingConcept(null)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Done
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{concept.name}</h4>
                              {concept.edited && (
                                <Badge variant="outline" className="text-xs">Modified</Badge>
                              )}
                            </div>
                            {concept.description && (
                              <p className="text-sm text-muted-foreground mt-1">{concept.description}</p>
                            )}
                          </>
                        )}
                      </div>
                      {editingConcept !== concept.id && (
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingConcept(concept.id)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteConcept(concept.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add Concept Button */}
                <Button 
                  variant="outline" 
                  className="w-full border-dashed gap-2"
                  onClick={addConcept}
                >
                  <Plus className="h-4 w-4" />
                  Add Custom Concept
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentStep('input')}
                >
                  Back to Content
                </Button>
                <span className="text-sm text-muted-foreground">
                  {approvedCount} of {concepts.length} concepts selected
                </span>
              </div>
              <Button 
                onClick={() => setCurrentStep('generate')}
                disabled={approvedCount === 0}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve & Continue
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Step 3: Generate Assessment */}
      {currentStep === 'generate' && (
        <div className="space-y-6">
          {/* Approved Concepts Summary */}
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <h4 className="font-medium mb-3 flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                Approved Concepts ({approvedCount})
              </h4>
              <div className="flex flex-wrap gap-2">
                {concepts.filter(c => c.selected).map((c) => (
                  <Badge key={c.id} variant="secondary" className="gap-1">
                    <BookOpen className="h-3 w-3" />
                    {c.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-green-500" />
                    Step 3: Generate Assessment
                  </CardTitle>
                  <CardDescription>
                    Create practice questions from your approved concepts. Students will practice these to build mastery.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {MVP_MESSAGES.instructorControl}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Why this step exists */}
              <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                <Info className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300 text-sm">
                  <strong>Why this step:</strong> Questions are generated based on the concepts you approved. 
                  This ensures assessments align with your intended learning objectives.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Questions</Label>
                  <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 questions</SelectItem>
                      <SelectItem value="5">5 questions</SelectItem>
                      <SelectItem value="10">10 questions</SelectItem>
                      <SelectItem value="15">15 questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Question Types</Label>
                  <div className="text-sm text-muted-foreground pt-2">
                    Multiple choice, short answer
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentStep('review')}
              >
                Back to Review
              </Button>
              <Button 
                onClick={() => generateAssessmentMutation.mutate()}
                disabled={generateAssessmentMutation.isPending || !llmAvailable}
                className="gap-2"
              >
                {generateAssessmentMutation.isPending ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Assessment
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Generated Assessment Preview */}
          {assessmentResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Assessment Generated
                </CardTitle>
                <CardDescription>
                  {assessmentResult.questions.length} questions ready for student practice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessmentResult.questions.map((q, i) => (
                    <div key={q.id} className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium">{i + 1}. {q.question}</p>
                        <Badge variant="outline" className="ml-2 flex-shrink-0">
                          {q.type}
                        </Badge>
                      </div>
                      {q.options && (
                        <div className="space-y-1 ml-4 mt-3">
                          {q.options.map((opt, j) => (
                            <p key={j} className="text-sm text-muted-foreground">
                              {String.fromCharCode(65 + j)}. {opt}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  These questions will be available for student practice. You can edit or regenerate anytime.
                </p>
              </CardFooter>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// Step indicator component
function StepIndicator({ 
  step, 
  label, 
  active, 
  completed 
}: { 
  step: number
  label: string
  active: boolean
  completed: boolean
}) {
  return (
    <div className={`flex items-center gap-2 ${active ? 'text-primary' : completed ? 'text-green-600' : 'text-muted-foreground'}`}>
      <div className={`
        w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium
        ${active ? 'bg-primary text-primary-foreground' : 
          completed ? 'bg-green-600 text-white' : 
          'bg-muted text-muted-foreground'}
      `}>
        {completed ? <Check className="h-4 w-4" /> : step}
      </div>
      <span className="text-sm font-medium hidden sm:inline">{label}</span>
    </div>
  )
}
