'use client'

import { useState, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useLLMService } from '@/hooks/useLLMService'
import { useUploadAccess } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FileText, Wand2, CheckCircle2, AlertCircle, 
  RefreshCw, Edit2, Trash2, Plus, ArrowRight,
  Upload, File, FileType, Crown, CheckCircle, X,
  Sparkles, BookOpen, Info
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion } from 'framer-motion'

// Design System
import { 
  PageShell, 
  PageHeader,
  Section,
  Stack
} from '@/design-system/layout'
import { 
  SurfaceCard, 
  InfoPanel 
} from '@/design-system/surfaces'
import { 
  EmptyState, 
  ErrorState, 
  LoadingState 
} from '@/design-system/feedback'
import { Stepper, Step } from '@/design-system/patterns/stepper'
import { LabelText, HelperText } from '@/design-system/typography'

// All available task types
const ALL_TASK_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice', icon: CheckCircle },
  { value: 'short_answer', label: 'Short Answer', icon: FileText },
  { value: 'true_false', label: 'True/False', icon: CheckCircle },
  { value: 'fill_blank', label: 'Fill in the Blank', icon: Edit2 },
  { value: 'matching', label: 'Matching', icon: ArrowRight },
  { value: 'ordering', label: 'Ordering/Sequencing', icon: ArrowRight },
  { value: 'definition', label: 'Definition', icon: BookOpen },
  { value: 'example', label: 'Provide Example', icon: Sparkles },
  { value: 'comparison', label: 'Compare & Contrast', icon: ArrowRight },
  { value: 'calculation', label: 'Calculation/Math', icon: FileText },
  { value: 'case_study', label: 'Case Study', icon: FileText },
  { value: 'practical', label: 'Practical Application', icon: Wand2 },
  { value: 'reflection', label: 'Reflection', icon: FileText },
  { value: 'coding', label: 'Coding (Programmingonly)', icon: FileText },
] as const

// Types
interface ExtractedConcept {
  id: string
  name: string
  description: string
  prerequisites: string[]
  difficulty: number
  selected: boolean
  edited: boolean
  allowedTaskTypes?: string[]
}

interface ContentAnalysis {
  summary?: string
  concepts: ExtractedConcept[]
  key_points: string[]
  difficulty_estimate?: number
  word_count?: number
  reading_time_minutes?: number
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

const MAX_FILE_SIZE = 50 * 1024 * 1024

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ContentStructuringPage() {
  const { isAvailable: llmAvailable, isChecking: llmChecking, refresh: refreshLLM, message: llmStatusMessage } = useLLMService()
  const { hasUploadAccess, maxSizeBytes, isLoading: uploadAccessLoading } = useUploadAccess()
  
  // Workflow state
  type WorkflowStep = 'input' | 'review' | 'done'
  const [currentStepId, setCurrentStepId] = useState<WorkflowStep>('input')
  const [inputMode, setInputMode] = useState<'text' | 'file' | 'url'>('text')
  
  // Course selection
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  
  // Content input
  const [content, setContent] = useState('')
  const [contentTitle, setContentTitle] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
  
  // File upload
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // Analysis
  const [analysisResult, setAnalysisResult] = useState<ContentAnalysis | null>(null)
  const [concepts, setConcepts] = useState<ExtractedConcept[]>([])
  const [editingConcept, setEditingConcept] = useState<string | null>(null)

  // Fetch instructor courses
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
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Unsupported file type. Please upload PDF, PPTX, or DOCX.')
      return
    }
    
    const maxSize = maxSizeBytes || MAX_FILE_SIZE
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is ${formatFileSize(maxSize)}.`)
      return
    }

    setUploadedFile({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
    })

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
      const extractedConcepts: ExtractedConcept[] = result.concepts.map((name, i) => ({
        id: `concept-${i}`,
        name: typeof name === 'string' ? name : (name as any).name || 'Unnamed',
        description: typeof name === 'string' ? '' : (name as any).description || '',
        prerequisites: [],
        difficulty: result.difficulty_estimate || 5,
        selected: true,
        edited: false,
      }))
      setConcepts(extractedConcepts)
      setCurrentStepId('review')
    },
    onError: () => {
      toast.error('Failed to analyze content. Please try again.')
    },
  })

  // Approve concepts mutation
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
          allowed_task_types: c.allowedTaskTypes,
        })),
        content: content,
        generate_questions: false,
      })
      return res.data
    },
    onSuccess: (result: any) => {
      toast.success(`Saved ${result.concepts.length} concepts! Ready for practice generation.`)
      setCurrentStepId('done')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to save concepts.')
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
    toast.success('Concept removed')
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
    setEditingConcept(newConcept.id)
  }

  const resetFlow = () => {
    setCurrentStepId('input')
    setContent('')
    setContentTitle('')
    setResourceUrl('')
    setUploadedFile(null)
    setAnalysisResult(null)
    setConcepts([])
  }

  const approvedCount = concepts.filter(c => c.selected).length

  // Stepper configuration
  const steps: Step[] = [
    { id: 'input', label: 'Add Material', description: 'Paste or upload content' },
    { id: 'review', label: 'Review Concepts', description: 'Edit AI suggestions' },
    { id: 'done', label: 'Complete', description: 'Concepts saved' },
  ]

  const completedSteps = currentStepId === 'review' ? ['input'] : currentStepId === 'done' ? ['input', 'review'] : []

  return (
    <PageShell maxWidth="xl">
      <PageHeader
        title="Content Structuring"
        description="Extract key concepts from your lesson materials. Review and refine them before generating practice questions."
      />

      {/* Course Selection */}
      <SurfaceCard variant="muted">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <LabelText className="mb-2">Target Course</LabelText>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select a course"} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedCourseId && (
              <HelperText className="mt-1.5">Choose which course these concepts belong to</HelperText>
            )}
          </div>
          {courses.length === 0 && !coursesLoading && (
            <Link href="/instructor/courses/new">
              <Button variant="outline" size="sm">Create Course</Button>
            </Link>
          )}
        </div>
      </SurfaceCard>

      {/* Service Status Alert */}
      {!llmAvailable && !llmChecking && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-4">
            <span>{llmStatusMessage || "Content analysis service is offline."}</span>
            <Button variant="outline" size="sm" onClick={refreshLLM} className="bg-background shrink-0">
              <RefreshCw className="h-3 w-3 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stepper */}
      <div className="flex justify-center">
        <Stepper 
          steps={steps}
          currentStep={currentStepId}
          completedSteps={completedSteps}
          variant="compact"
        />
      </div>

      {/* Step 1: Content Input */}
      {currentStepId === 'input' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Section>
            <SurfaceCard>
              <Stack gap="lg">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Add Lesson Material</h3>
                  <p className="text-sm text-muted-foreground">
                    Paste text, upload a file, or link to a resource. We'll identify key concepts for you.
                  </p>
                </div>

                <div className="space-y-2">
                  <LabelText>Lesson Title (Optional)</LabelText>
                  <Input
                    placeholder="e.g., Introduction to React Hooks"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                  />
                </div>

                <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as typeof inputMode)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger 
                      value="file" 
                      className="gap-2"
                      disabled={!hasUploadAccess && !uploadAccessLoading}
                    >
                      <Upload className="h-4 w-4" />
                      File
                      {!hasUploadAccess && !uploadAccessLoading && <Crown className="h-3 w-3 text-amber-500" />}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="url" 
                      className="gap-2"
                      disabled={!hasUploadAccess && !uploadAccessLoading}
                    >
                      <BookOpen className="h-4 w-4" />
                      URL
                      {!hasUploadAccess && !uploadAccessLoading && <Crown className="h-3 w-3 text-amber-500" />}
                    </TabsTrigger>
                  </TabsList>

                  {/* Text Input */}
                  <TabsContent value="text" className="space-y-3 mt-6">
                    <Textarea
                      placeholder="Paste your lesson content, notes, or transcript here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={16}
                      className="font-mono text-sm resize-none"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Plain text, Markdown supported</span>
                      <span>{content.length > 0 ? `${content.length} characters` : ''}</span>
                    </div>
                  </TabsContent>

                  {/* File Upload */}
                  <TabsContent value="file" className="mt-6">
                    {!hasUploadAccess && !uploadAccessLoading ? (
                      <div className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg p-8 text-center bg-amber-50/50 dark:bg-amber-950/20">
                        <Crown className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Pro Feature</h3>
                        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                          Upload PDF, PPTX, and DOCX files to extract content automatically.
                        </p>
                        <Link href="/pricing">
                          <Button className="gap-2">
                            <Crown className="h-4 w-4" />
                            Upgrade to Pro
                          </Button>
                        </Link>
                      </div>
                    ) : (
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
                          <>
                            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="font-medium mb-1">
                              {isDragging ? 'Drop file here' : 'Drag and drop your file'}
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">or</p>
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
                              PDF, PPTX, DOCX • Max {formatFileSize(maxSizeBytes || MAX_FILE_SIZE)}
                            </p>
                          </>
                        ) : (
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
                                      {formatFileSize(uploadedFile.size)} • {FILE_TYPE_LABELS[uploadedFile.type]}
                                    </p>
                                  </div>
                                </div>
                              )
                            })()}

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

                            {uploadedFile.status === 'done' && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Text extracted successfully
                              </Badge>
                            )}

                            {uploadedFile.status === 'error' && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{uploadedFile.error}</AlertDescription>
                              </Alert>
                            )}

                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setUploadedFile(null)
                                if (uploadedFile.status === 'error') setContent('')
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* URL Input */}
                  <TabsContent value="url" className="space-y-3 mt-6">
                    {!hasUploadAccess && !uploadAccessLoading ? (
                      <div className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg p-8 text-center bg-amber-50/50 dark:bg-amber-950/20">
                        <Crown className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Pro Feature</h3>
                        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                          Import content from YouTube, Google Docs, and other online resources.
                        </p>
                        <Link href="/pricing">
                          <Button className="gap-2">
                            <Crown className="h-4 w-4" />
                            Upgrade to Pro
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <>
                        <Input
                          placeholder="https://youtube.com/watch?v=..."
                          value={resourceUrl}
                          onChange={(e) => setResourceUrl(e.target.value)}
                        />
                        <HelperText>Supported: YouTube videos, Google Docs, public web pages</HelperText>
                        <Button disabled className="w-full">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Import from URL
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">Coming soon</p>
                      </>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    onClick={() => analyzeContentMutation.mutate()}
                    disabled={analyzeContentMutation.isPending || !content.trim() || !llmAvailable || !selectedCourseId}
                    size="lg"
                    className="min-w-[200px]"
                  >
                    {analyzeContentMutation.isPending ? (
                      <>
                        <Wand2 className="h-4 w-4 animate-pulse mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Extract Concepts
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </Stack>
            </SurfaceCard>
          </Section>
        </motion.div>
      )}

      {/* Step 2: Review Concepts */}
      {currentStepId === 'review' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Stack gap="lg">
            {analysisResult?.summary && (
              <InfoPanel variant="info" title="Content Summary">
                <p className="leading-relaxed">{analysisResult.summary}</p>
              </InfoPanel>
            )}

            <Section
              title="Extracted Concepts"
              description="Review and refine the concepts we identified. Edit names, descriptions, or add new ones."
              action={
                <Button onClick={addConcept} variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Concept
                </Button>
              }
            >
              {concepts.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No concepts found"
                  description="The analysis didn't extract any concepts. Try adding them manually."
                  action={{ label: 'Add Concept', onClick: addConcept }}
                />
              ) : (
                <div className="space-y-3">
                  {concepts.map((concept) => (
                    <SurfaceCard 
                      key={concept.id}
                      variant={editingConcept === concept.id ? 'bordered' : 'default'}
                      className="group hover:shadow-md transition-all"
                    >
                      {editingConcept === concept.id ? (
                        <Stack gap="md">
                          <div className="space-y-2">
                            <LabelText required>Concept Name</LabelText>
                            <Input
                              value={concept.name}
                              onChange={(e) => updateConcept(concept.id, { name: e.target.value })}
                              placeholder="e.g., React useState Hook"
                              autoFocus
                            />
                          </div>
                          <div className="space-y-2">
                            <LabelText>Description</LabelText>
                            <Textarea
                              value={concept.description}
                              onChange={(e) => updateConcept(concept.id, { description: e.target.value })}
                              placeholder="What does this concept cover?"
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <LabelText>Question Types for This Concept</LabelText>
                            <HelperText>Select which types of questions to generate. If none selected, uses default types.</HelperText>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-lg bg-muted/30">
                              {ALL_TASK_TYPES.map(taskType => {
                                const isSelected = concept.allowedTaskTypes?.includes(taskType.value) ?? false
                                return (
                                  <button
                                    key={taskType.value}
                                    type="button"
                                    onClick={() => {
                                      const current = concept.allowedTaskTypes || []
                                      const updated = isSelected
                                        ? current.filter(t => t !== taskType.value)
                                        : [...current, taskType.value]
                                      updateConcept(concept.id, { allowedTaskTypes: updated.length > 0 ? updated : undefined })
                                    }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
                                      isSelected 
                                        ? 'bg-primary text-primary-foreground shadow-sm' 
                                        : 'bg-background hover:bg-accent text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    <CheckCircle className={`h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-30'}`} />
                                    {taskType.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Remove this concept?')) {
                                  deleteConcept(concept.id)
                                  setEditingConcept(null)
                                }
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => setEditingConcept(null)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                          </div>
                        </Stack>
                      ) : (
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{concept.name}</h3>
                              {concept.edited && (
                                <Badge variant="outline" className="text-xs">Edited</Badge>
                              )}
                            </div>
                            {concept.description && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {concept.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setEditingConcept(concept.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </SurfaceCard>
                  ))}
                </div>
              )}
            </Section>

            <InfoPanel variant="success" icon={Info}>
              <strong>What happens next:</strong> After saving, these concepts will be added to your course. 
              You can then generate practice questions from the Assessments page.
            </InfoPanel>

            <div className="flex justify-between pt-6 border-t">
              <Button variant="ghost" onClick={resetFlow}>
                Start Over
              </Button>
              
              <Button 
                onClick={() => approveConceptsMutation.mutate()}
                disabled={approvedCount === 0 || approveConceptsMutation.isPending}
                size="lg"
                className="min-w-[200px]"
              >
                {approveConceptsMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save {approvedCount} {approvedCount === 1 ? 'Concept' : 'Concepts'}
                  </>
                )}
              </Button>
            </div>
          </Stack>
        </motion.div>
      )}

      {/* Step 3: Done */}
      {currentStepId === 'done' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <SurfaceCard variant="elevated" className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            
            <h2 className="text-2xl font-bold mb-3">Concepts Saved!</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {approvedCount} {approvedCount === 1 ? 'concept has' : 'concepts have'} been added to your course. 
              Generate practice questions next.
            </p>
            
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={resetFlow}>
                Add More Content
              </Button>
              <Link href={`/instructor/courses/${selectedCourseId}`}>
                <Button>
                  Go to Course
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </SurfaceCard>
        </motion.div>
      )}
    </PageShell>
  )
}
