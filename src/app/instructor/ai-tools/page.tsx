'use client'

import { useState, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useLLMService, LLM_MESSAGES } from '@/hooks/useLLMService'
import { useUploadAccess, UPGRADE_MESSAGES } from '@/hooks/useSubscription'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Info, Shield, Eye, Check, X, Upload, File,
  FileType, Crown, Lock, CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { PilotBanner } from '@/components/feature-gate'
import { MVP_MESSAGES } from '@/lib/feature-flags'
import Link from 'next/link'

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

interface QuestionOption {
  id?: string
  text: string
  is_correct?: boolean
  explanation?: string
}

interface GeneratedQuestion {
  id: string
  type: string
  question: string
  options?: (string | QuestionOption)[]
  answer?: string
  explanation?: string
  concept_id?: string
}

interface AssessmentResult {
  assessment_id: string
  questions: GeneratedQuestion[]
}

interface UploadedFile {
  file: File
  name: string
  size: number
  type: string
  status: 'pending' | 'uploading' | 'extracting' | 'done' | 'error'
  progress: number
  extractedText?: string
  error?: string
}

// File type helpers
const FILE_TYPE_ICONS: Record<string, typeof FileText> = {
  'application/pdf': FileText,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': FileType,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
}

const FILE_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ContentStructuringPage() {
  const { isAvailable: llmAvailable, isChecking: llmChecking, refresh: refreshLLM, message: llmStatusMessage } = useLLMService()
  const { hasUploadAccess, maxSizeBytes, isLoading: uploadAccessLoading } = useUploadAccess()
  
  // Workflow state
  const [currentStep, setCurrentStep] = useState<'input' | 'review' | 'generate'>('input')
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text')
  
  // Course selection state
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  
  // Content input state
  const [content, setContent] = useState('')
  const [contentTitle, setContentTitle] = useState('')
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // Analysis result state
  const [analysisResult, setAnalysisResult] = useState<ContentAnalysis | null>(null)
  const [concepts, setConcepts] = useState<ExtractedConcept[]>([])
  const [editingConcept, setEditingConcept] = useState<string | null>(null)
  
  // Assessment state
  const [questionCount, setQuestionCount] = useState(5)
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)

  // Fetch instructor's courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const res = await api.get<{ id: string; title: string }[]>('/instructor/courses')
      return res.data
    },
  })

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await api.post('/uploads/extract-text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setUploadedFile(prev => prev ? { ...prev, progress, status: 'uploading' } : null)
        },
      })
      return res.data
    },
    onSuccess: (data) => {
      setUploadedFile(prev => prev ? {
        ...prev,
        status: 'done',
        progress: 100,
        extractedText: data.extracted_text,
      } : null)
      setContent(data.extracted_text)
      toast.success(`Extracted ${data.word_count.toLocaleString()} words from ${data.filename}`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to upload file'
      setUploadedFile(prev => prev ? { ...prev, status: 'error', error: message } : null)
      toast.error(message)
    },
  })

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Unsupported file type. Please upload PDF, PPTX, or DOCX.')
      return
    }
    
    // Validate file size
    const maxSize = maxSizeBytes || MAX_FILE_SIZE
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is ${formatFileSize(maxSize)}.`)
      return
    }

    // Set initial file state
    setUploadedFile({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
    })

    // Start upload
    uploadFileMutation.mutate(file)
  }, [maxSizeBytes, uploadFileMutation])

  // Analyze content mutation
  const analyzeContentMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<ContentAnalysis>(`/instructor/analyze-content`, null, {
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

  // Approve concepts mutation - saves concepts and auto-generates question pool
  const approveConceptsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCourseId) {
        throw new Error('Please select a course first')
      }
      const approvedConcepts = concepts.filter(c => c.selected)
      const res = await api.post(`/instructor/courses/${selectedCourseId}/concepts/approve`, {
        concepts: approvedConcepts.map(c => ({
          name: c.name,
          description: c.description,
          prerequisites: c.prerequisites,
          difficulty: c.difficulty,
        })),
        content: content,
      })
      return res.data
    },
    onSuccess: (result: any) => {
      const totalQuestions = result.concepts.reduce((sum: number, c: any) => sum + c.questions_generated, 0)
      toast.success(`Saved ${result.concepts.length} concepts and generated ${totalQuestions} practice questions!`)
      setCurrentStep('generate')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to save concepts. Please try again.')
    },
  })

  // Generate assessment mutation
  const generateAssessmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCourseId) {
        throw new Error('Please select a course first')
      }
      const approvedConcepts = concepts.filter(c => c.selected)
      const res = await api.post<AssessmentResult>(`/instructor/courses/${selectedCourseId}/generate-assessment`, {
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
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate assessment. Please try again.')
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
    <div className="space-y-8 max-w-4xl mx-auto py-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Content Assistant</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Transform your lesson materials into structured concepts and practice questions.
        </p>
      </div>

      {/* Course Selection */}
      <Card className="border-none shadow-sm bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-base font-medium mb-1.5 block">Select Course</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder={coursesLoading ? "Loading..." : "Choose a course"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(courses.length === 0 && !coursesLoading) && (
              <div className="shrink-0 pt-6">
                <Link href="/instructor/courses" className="text-primary hover:underline text-sm font-medium">Create a course</Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert Only */}
      {!llmAvailable && !llmChecking && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Unavailable</AlertTitle>
          <AlertDescription className="flex items-center gap-4 mt-2">
            <span>{llmStatusMessage || "The content assistant is currently offline."}</span>
            <Button variant="outline" size="sm" onClick={() => refreshLLM()} className="bg-background">
              <RefreshCw className="h-3 w-3 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Clean Stepper */}
      <div className="flex items-center w-full max-w-2xl mx-auto mb-8">
        <StepIndicator 
          step={1} 
          label="Lesson Content" 
          active={currentStep === 'input'}
          completed={currentStep !== 'input'}
        />
        <div className={`flex-1 h-[2px] mx-4 ${currentStep !== 'input' ? 'bg-primary' : 'bg-muted'}`} />
        <StepIndicator 
          step={2} 
          label="Review Concepts" 
          active={currentStep === 'review'}
          completed={currentStep === 'generate'}
        />
        <div className={`flex-1 h-[2px] mx-4 ${currentStep === 'generate' ? 'bg-primary' : 'bg-muted'}`} />
        <StepIndicator 
          step={3} 
          label="Create Practice" 
          active={currentStep === 'generate'}
          completed={!!assessmentResult}
        />
      </div>

      {/* Step 1: Content Input */}
      {currentStep === 'input' && (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">1</div>
              Add Lesson Material
            </CardTitle>
            <CardDescription className="text-base pt-1">
              Paste your lesson text, transcript, or notes. We'll identify the key concepts for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="space-y-2">
              <Label>Lesson Title (Optional)</Label>
              <Input
                placeholder="e.g., Introduction to Python Variables"
                value={contentTitle}
                onChange={(e) => setContentTitle(e.target.value)}
              />
            </div>

            {/* Input Mode Tabs */}
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'text' | 'file')}>
              <TabsList className="grid w-full grid-cols-2 bg-muted/40">
                <TabsTrigger value="text" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Text / Notes
                </TabsTrigger>
                <TabsTrigger 
                  value="file" 
                  className="gap-2"
                  disabled={!hasUploadAccess && !uploadAccessLoading}
                >
                  <Upload className="h-4 w-4" />
                  File Upload
                  {!hasUploadAccess && !uploadAccessLoading && (
                    <Crown className="h-3 w-3 text-amber-500" />
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Text Input Tab */}
              <TabsContent value="text" className="space-y-3 mt-6">
                <Label>Lesson Content</Label>
                <Textarea
                  placeholder="Paste content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={16}
                  className="font-mono text-sm resize-none bg-muted/20"
                />
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                   <span>Supported: Text, Markdown</span>
                   <span>{content.length > 0 ? `${content.length} chars` : ''}</span>
                </div>
              </TabsContent>

              {/* File Upload Tab */}
              <TabsContent value="file" className="space-y-4 mt-4">
                {!hasUploadAccess && !uploadAccessLoading ? (
                  /* Upgrade CTA for free users */
                  <div className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg p-8 text-center bg-amber-50/50 dark:bg-amber-950/20">
                    <Crown className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Pro Feature</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                      {UPGRADE_MESSAGES.fileUploadCTA}
                    </p>
                    <Link href="/pricing">
                      <Button className="gap-2">
                        <Crown className="h-4 w-4" />
                        Upgrade to Pro
                      </Button>
                    </Link>
                  </div>
                ) : (
                  /* File upload dropzone for Pro+ users */
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                      isDragging 
                        ? 'border-primary bg-primary/5' 
                        : uploadedFile?.status === 'error'
                        ? 'border-destructive bg-destructive/5'
                        : uploadedFile?.status === 'done'
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDragging(false)
                      const file = e.dataTransfer.files[0]
                      if (file) handleFileSelect(file)
                    }}
                  >
                    {!uploadedFile ? (
                      /* Empty state - no file selected */
                      <>
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="font-medium mb-1">
                          {isDragging ? 'Drop your file here' : 'Drag and drop your file'}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          or click to browse
                        </p>
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          accept=".pdf,.pptx,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileSelect(file)
                          }}
                        />
                        <label htmlFor="file-upload">
                          <Button variant="outline" className="cursor-pointer" asChild>
                            <span>
                              <File className="h-4 w-4 mr-2" />
                              Choose File
                            </span>
                          </Button>
                        </label>
                        <p className="text-xs text-muted-foreground mt-4">
                          Supported: PDF, PPTX, DOCX • Max {formatFileSize(maxSizeBytes || MAX_FILE_SIZE)}
                        </p>
                      </>
                    ) : (
                      /* File selected/uploading/done state */
                      <div className="space-y-4">
                        {(() => {
                          const FileIcon = FILE_TYPE_ICONS[uploadedFile.type] || FileText
                          return (
                            <div className="flex items-center justify-center gap-3">
                              <FileIcon className={`h-10 w-10 ${
                                uploadedFile.status === 'done' 
                                  ? 'text-green-500' 
                                  : uploadedFile.status === 'error'
                                  ? 'text-destructive'
                                  : 'text-primary'
                              }`} />
                              <div className="text-left">
                                <p className="font-medium">{uploadedFile.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatFileSize(uploadedFile.size)} • {FILE_TYPE_LABELS[uploadedFile.type] || 'File'}
                                </p>
                              </div>
                            </div>
                          )
                        })()}

                        {/* Progress bar */}
                        {(uploadedFile.status === 'uploading' || uploadedFile.status === 'extracting') && (
                          <div className="space-y-2">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${uploadedFile.progress}%` }}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {uploadedFile.status === 'uploading' 
                                ? `Uploading... ${uploadedFile.progress}%`
                                : 'Extracting text...'}
                            </p>
                          </div>
                        )}

                        {/* Success state */}
                        {uploadedFile.status === 'done' && (
                          <div className="space-y-2">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Text extracted successfully
                            </Badge>
                          </div>
                        )}

                        {/* Error state */}
                        {uploadedFile.status === 'error' && (
                          <Alert variant="destructive" className="text-left">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{uploadedFile.error}</AlertDescription>
                          </Alert>
                        )}

                        {/* Action buttons */}
                        <div className="flex justify-center gap-2">
                          {uploadedFile.status === 'done' || uploadedFile.status === 'error' ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setUploadedFile(null)
                                if (uploadedFile.status === 'error') setContent('')
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove File
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-end pt-2 pb-6 px-6">
            <Button 
              onClick={() => analyzeContentMutation.mutate()}
              className="px-8 min-w-[200px]"
              disabled={analyzeContentMutation.isPending || !content.trim() || !llmAvailable}
            >
              {analyzeContentMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  Review Concepts 
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Concept Review */}
      {currentStep === 'review' && (
        <div className="space-y-8 max-w-3xl mx-auto">
          {/* Summary Card - Simplified */}
          {analysisResult?.summary && (
            <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/20 p-6 rounded-lg border-l-4 border-primary/30">
               <h4 className="font-semibold text-foreground m-0 mb-2">Lesson Summary</h4>
               <p className="m-0 text-muted-foreground">{analysisResult.summary}</p>
            </div>
          )}

          <div className="space-y-4">
             <div className="flex items-center justify-between pb-2 border-b">
                <div>
                   <h2 className="text-2xl font-bold tracking-tight">Key Concepts</h2>
                   <p className="text-muted-foreground text-sm mt-1">
                      Review the concepts extracted from your lesson. Edit to refine.
                   </p>
                </div>
                <Button 
                   onClick={addConcept} 
                   variant="outline" 
                   size="sm"
                   className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Concept
                </Button>
             </div>

              {/* Concepts List - Editorial Style */}
              <div className="space-y-4">
                {concepts.map((concept) => (
                  <Card 
                    key={concept.id}
                    className={`border transition-all ${
                      editingConcept === concept.id 
                        ? 'ring-2 ring-primary/20 border-primary' 
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <CardContent className="p-5">
                        {editingConcept === concept.id ? (
                          <div className="space-y-3">
                            <Input
                              value={concept.name}
                              onChange={(e) => updateConcept(concept.id, { name: e.target.value })}
                              className="font-semibold text-lg"
                              autoFocus
                              placeholder="Concept Name"
                            />
                            <Textarea
                              value={concept.description}
                              onChange={(e) => updateConcept(concept.id, { description: e.target.value })}
                              placeholder="Description logic..."
                              rows={3}
                            />
                            <div className="flex justify-end gap-2 pt-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => deleteConcept(concept.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                Delete
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => setEditingConcept(null)}
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="group relative">
                             <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                   <h3 className="font-semibold text-lg">{concept.name}</h3>
                                   <p className="text-muted-foreground leading-relaxed">{concept.description}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => setEditingConcept(concept.id)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                             </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                ))}
              </div>
          </div>
          
          <div className="flex justify-between pt-8 border-t">
              <Button variant="ghost" onClick={() => setCurrentStep('input')}>
                 Back to Content
              </Button>
              
              <Button 
                onClick={() => approveConceptsMutation.mutate()}
                disabled={approvedCount === 0 || approveConceptsMutation.isPending || !selectedCourseId}
                className="px-8 min-w-[200px]"
              >
                {approveConceptsMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue to Practice 
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
          </div>
        </div>
      )}

      {/* Step 3: Generate Assessment */}
      {currentStep === 'generate' && (
        <div className="space-y-8 max-w-3xl mx-auto">
          
          {/* Approved Concept Summary */}
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="pt-6 flex justify-between items-center">
               <div className="space-y-1">
                 <h3 className="font-semibold text-foreground">Concepts Ready</h3>
                 <p className="text-sm text-muted-foreground">
                   {approvedCount} concepts approved for practice generation.
                 </p>
               </div>
               <Button variant="outline" size="sm" onClick={() => setCurrentStep('review')}>
                 Edit Concepts
               </Button>
            </CardContent>
          </Card>

          {/* Generation Configuration */}
          <div className="space-y-6">
              <div>
                 <h2 className="text-2xl font-bold tracking-tight">Create Practice Set</h2>
                 <p className="text-muted-foreground text-lg mt-2">
                    Generate questions based on the approved concepts to test student understanding.
                 </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-base">Number of Questions</Label>
                      <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 questions (Quick Check)</SelectItem>
                          <SelectItem value="5">5 questions (Standard)</SelectItem>
                          <SelectItem value="10">10 questions (Deep Dive)</SelectItem>
                          <SelectItem value="15">15 questions (Exam Prep)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-4">
                      <Label className="text-base">Question Types</Label> 
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground p-3 bg-muted/30 rounded-md">
                         <span className="bg-background px-2 py-1 rounded border shadow-sm">Multiple Choice</span>
                         <span className="bg-background px-2 py-1 rounded border shadow-sm">Short Answer</span>
                         <span className="bg-background px-2 py-1 rounded border shadow-sm">True/False</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                     <Button 
                        onClick={() => generateAssessmentMutation.mutate()}
                        disabled={generateAssessmentMutation.isPending || !llmAvailable || !selectedCourseId}
                        size="lg"
                        className="w-full md:w-auto min-w-[200px]"
                      >
                        {generateAssessmentMutation.isPending ? (
                          <>
                            <Sparkles className="h-4 w-4 animate-spin mr-2" />
                            Generating Questions...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Practice Set
                          </>
                        )}
                      </Button>
                  </div>
                </CardContent>
              </Card>
          </div>

          {/* Generated Assessment Preview */}
          {assessmentResult && (
            <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-bold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Generated Questions
                 </h3>
                 <Badge variant="outline">{assessmentResult.questions.length} Questions</Badge>
              </div>

              <div className="space-y-4">
                  {assessmentResult.questions.map((q, i) => {
                    const typeLabels: Record<string, string> = {
                      'multiple_choice': 'Multiple Choice',
                      'short_answer': 'Short Answer',
                      'true_false': 'True/False',
                      'fill_in_blank': 'Fill in Blank',
                      'code': 'Code',
                      'problem_solving': 'Problem Solving',
                    }
                    const typeLabel = typeLabels[q.type] || q.type
                    
                    return (
                    <Card key={q.id} className="overflow-hidden">
                      <CardContent className="p-5">
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-1 rounded">Q{i + 1}</span>
                            <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>
                          </div>
                          
                          <p className="font-medium text-lg mb-4">{q.question}</p>
                          
                          {q.options && (
                            <div className="space-y-2 pl-1">
                              {q.options.map((opt, j) => {
                                const optText = typeof opt === 'string' ? opt : opt.text
                                const isCorrect = typeof opt === 'object' && opt.is_correct
                                return (
                                  <div 
                                    key={j} 
                                    className={`flex items-start gap-3 p-2 rounded-md ${isCorrect ? 'bg-green-50 dark:bg-green-900/10' : ''}`}
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
                                      <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                      </CardContent>
                    </Card>
                    )
                  })}
              </div>

              <div className="flex justify-center pt-8 pb-12">
                 <Button variant="outline" className="mr-4" onClick={() => setAssessmentResult(null)}>
                    Discard
                 </Button>
                 <Button onClick={() => window.location.href = `/instructor/courses/${selectedCourseId}/content`}>
                    Save and Exit
                 </Button>
              </div>
            </div>
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
    <div className={`flex items-center gap-2 ${active ? 'text-primary' : completed ? 'text-primary/70' : 'text-muted-foreground/60'}`}>
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
        ${active ? 'bg-primary text-primary-foreground ring-4 ring-primary/10' : 
          completed ? 'bg-primary/20 text-primary' : 
          'bg-muted text-muted-foreground'}
      `}>
        {completed ? <Check className="h-4 w-4" /> : step}
      </div>
      <span className={`text-sm font-medium hidden sm:inline ${active ? 'text-foreground' : ''}`}>{label}</span>
    </div>
  )
}


