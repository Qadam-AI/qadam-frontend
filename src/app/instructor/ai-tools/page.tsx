'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Sparkles, Video, FileText, Brain, Wand2, Play,
  CheckCircle2, Clock, BookOpen, Lightbulb, Copy,
  Download, RefreshCw, Plus, Target, Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface TranscriptionResult {
  text: string
  language?: string
  duration_seconds?: number
  segments: { start: number; end: number; text: string }[]
  word_count?: number
  status: string
}

interface ContentAnalysis {
  summary?: string
  concepts: string[]
  key_points: string[]
  difficulty_estimate?: number
  word_count?: number
  reading_time_minutes?: number
  status: string
}

interface GeneratedQuestion {
  id: string
  type: string
  question: string
  options?: string[]
  answer?: string
  explanation?: string
  difficulty?: number
}

interface AssessmentResult {
  assessment_id: string
  topic: string
  difficulty: number
  questions: GeneratedQuestion[]
}

interface ProcessVideoResult {
  lesson_id: string
  video_url: string
  transcription?: TranscriptionResult
  analysis?: ContentAnalysis
  questions?: GeneratedQuestion[]
  steps: Record<string, boolean>
}

export default function InstructorAIToolsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('transcribe')
  
  // Transcription state
  const [videoUrl, setVideoUrl] = useState('')
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('auto')
  const [transcriptionResult, setTranscriptionResult] = useState<ProcessVideoResult | null>(null)
  
  // Assessment state
  const [assessmentForm, setAssessmentForm] = useState({
    topic: '',
    content: '',
    difficulty: 5,
    question_count: 5,
    question_types: ['multiple_choice', 'code'],
  })
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)
  
  // Content analysis state
  const [analysisContent, setAnalysisContent] = useState('')
  const [analysisTitle, setAnalysisTitle] = useState('')
  const [analysisResult, setAnalysisResult] = useState<ContentAnalysis | null>(null)

  // Fetch lessons for the dropdown
  const { data: courses } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const res = await api.get<{ id: string; title: string }[]>('/api/v1/instructor/courses')
      return res.data
    },
  })

  // Process video mutation
  const processVideoMutation = useMutation({
    mutationFn: async () => {
      // Use a placeholder lesson ID for demo
      const lessonId = '00000000-0000-0000-0000-000000000001'
      const res = await api.post<ProcessVideoResult>(`/api/v1/instructor/lessons/${lessonId}/process-video`, {
        video_url: videoUrl,
        language: transcriptionLanguage,
        generate_questions: true,
        question_count: 5,
      })
      return res.data
    },
    onSuccess: (result) => {
      toast.success('Video processed successfully!')
      setTranscriptionResult(result)
    },
    onError: () => {
      toast.error('Failed to process video')
    },
  })

  // Generate assessment mutation
  const generateAssessmentMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<AssessmentResult>('/api/v1/instructor/generate-assessment', {
        topic: assessmentForm.topic,
        content: assessmentForm.content,
        difficulty: assessmentForm.difficulty,
        question_count: assessmentForm.question_count,
        question_types: assessmentForm.question_types,
      })
      return res.data
    },
    onSuccess: (result) => {
      toast.success('Assessment generated!')
      setAssessmentResult(result)
    },
    onError: () => {
      toast.error('Failed to generate assessment')
    },
  })

  // Analyze content mutation
  const analyzeContentMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<ContentAnalysis>(`/api/v1/instructor/analyze-content`, null, {
        params: {
          content: analysisContent,
          title: analysisTitle || 'Content',
        },
      })
      return res.data
    },
    onSuccess: (result) => {
      toast.success('Content analyzed!')
      setAnalysisResult(result)
    },
    onError: () => {
      toast.error('Failed to analyze content')
    },
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-white"
      >
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Wand2 className="h-6 w-6" />
            <span className="text-lg font-medium text-white/80">Instructor Tools</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            AI-Powered Course Creation 🧙‍♂️
          </h1>
          <p className="text-white/80 text-lg max-w-2xl">
            Transcribe videos, analyze content, and generate assessments with AI.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      </motion.div>

      {/* Tools Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transcribe" className="gap-2">
            <Video className="h-4 w-4" />
            Video Transcription
          </TabsTrigger>
          <TabsTrigger value="assessment" className="gap-2">
            <Brain className="h-4 w-4" />
            Assessment Generator
          </TabsTrigger>
          <TabsTrigger value="analyze" className="gap-2">
            <FileText className="h-4 w-4" />
            Content Analysis
          </TabsTrigger>
        </TabsList>

        {/* Video Transcription Tab */}
        <TabsContent value="transcribe" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-500" />
                  Transcribe Video
                </CardTitle>
                <CardDescription>
                  Extract text from video lessons automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Video URL</Label>
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports YouTube, Vimeo, and direct video URLs
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={transcriptionLanguage} onValueChange={setTranscriptionLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                      <SelectItem value="uz">Uzbek</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => processVideoMutation.mutate()}
                  className="w-full gap-2"
                  disabled={processVideoMutation.isPending || !videoUrl}
                >
                  {processVideoMutation.isPending ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Process Video
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Transcription Result */}
            <div>
              {processVideoMutation.isPending ? (
                <Card>
                  <CardContent className="py-16">
                    <div className="text-center">
                      <div className="animate-pulse">
                        <Video className="h-16 w-16 mx-auto text-purple-500 mb-4" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Processing Video...</h3>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <p>1. Downloading video...</p>
                        <p>2. Extracting audio...</p>
                        <p>3. Transcribing...</p>
                        <p>4. Analyzing content...</p>
                      </div>
                      <Progress value={45} className="w-48 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              ) : transcriptionResult ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Transcription</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(transcriptionResult.transcription?.text || '')}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4 mb-4 text-sm">
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.round((transcriptionResult.transcription?.duration_seconds || 0) / 60)}m
                        </Badge>
                        <Badge variant="secondary">
                          {transcriptionResult.transcription?.word_count} words
                        </Badge>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-3 rounded bg-muted text-sm">
                        {transcriptionResult.transcription?.text}
                      </div>
                    </CardContent>
                  </Card>

                  {transcriptionResult.analysis && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-2">Key Concepts</p>
                          <div className="flex flex-wrap gap-2">
                            {transcriptionResult.analysis.concepts.map((concept, i) => (
                              <Badge key={i} variant="outline">{concept}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Key Points</p>
                          <ul className="space-y-1">
                            {transcriptionResult.analysis.key_points.map((point, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {transcriptionResult.questions && transcriptionResult.questions.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Generated Questions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {transcriptionResult.questions.map((q, i) => (
                          <div key={q.id} className="p-3 rounded bg-muted">
                            <p className="font-medium mb-2">{i + 1}. {q.question}</p>
                            {q.options && (
                              <div className="space-y-1 ml-4">
                                {q.options.map((opt, j) => (
                                  <p key={j} className="text-sm text-muted-foreground">
                                    {String.fromCharCode(65 + j)}. {opt}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">No Transcription Yet</h3>
                    <p className="text-muted-foreground">
                      Enter a video URL and click Process to get started
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Assessment Generator Tab */}
        <TabsContent value="assessment" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  Generate Assessment
                </CardTitle>
                <CardDescription>
                  Create AI-powered quizzes and coding challenges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input
                    placeholder="e.g., Python Lists and Dictionaries"
                    value={assessmentForm.topic}
                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, topic: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content / Context</Label>
                  <Textarea
                    placeholder="Paste lesson content or describe what students should know..."
                    value={assessmentForm.content}
                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Difficulty Level: {assessmentForm.difficulty}/10</Label>
                  <Slider
                    value={[assessmentForm.difficulty]}
                    onValueChange={([v]) => setAssessmentForm(prev => ({ ...prev, difficulty: v }))}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Number of Questions</Label>
                  <Select
                    value={String(assessmentForm.question_count)}
                    onValueChange={(v) => setAssessmentForm(prev => ({ ...prev, question_count: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 questions</SelectItem>
                      <SelectItem value="5">5 questions</SelectItem>
                      <SelectItem value="10">10 questions</SelectItem>
                      <SelectItem value="15">15 questions</SelectItem>
                      <SelectItem value="20">20 questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => generateAssessmentMutation.mutate()}
                  className="w-full gap-2"
                  disabled={generateAssessmentMutation.isPending || !assessmentForm.topic || !assessmentForm.content}
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
              </CardContent>
            </Card>

            {/* Assessment Result */}
            <div>
              {generateAssessmentMutation.isPending ? (
                <Card>
                  <CardContent className="py-16">
                    <div className="text-center">
                      <div className="animate-pulse">
                        <Brain className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Creating Assessment...</h3>
                      <p className="text-muted-foreground mb-4">Generating diverse question types</p>
                      <Progress value={60} className="w-48 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              ) : assessmentResult ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{assessmentResult.topic}</CardTitle>
                          <CardDescription>
                            {assessmentResult.questions.length} questions • Difficulty: {assessmentResult.difficulty}/10
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Export
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {assessmentResult.questions.map((q, i) => (
                        <motion.div
                          key={q.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-4 rounded-lg border"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline">{q.type}</Badge>
                            <Button variant="ghost" size="sm">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="font-medium mb-3">{i + 1}. {q.question}</p>
                          {q.options && (
                            <div className="space-y-2 ml-4 mb-3">
                              {q.options.map((opt, j) => (
                                <div key={j} className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                    {String.fromCharCode(65 + j)}
                                  </span>
                                  <span className="text-sm">{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {q.answer && (
                            <div className="p-2 rounded bg-green-50 dark:bg-green-900/20 text-sm">
                              <span className="font-medium text-green-700 dark:text-green-300">Answer: </span>
                              {q.answer}
                            </div>
                          )}
                          {q.explanation && (
                            <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-sm">
                              <span className="font-medium text-blue-700 dark:text-blue-300">💡 </span>
                              {q.explanation}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">No Assessment Yet</h3>
                    <p className="text-muted-foreground">
                      Enter a topic and content to generate questions
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Content Analysis Tab */}
        <TabsContent value="analyze" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  Analyze Content
                </CardTitle>
                <CardDescription>
                  Extract concepts, key points, and difficulty from text
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title (optional)</Label>
                  <Input
                    placeholder="e.g., Introduction to Machine Learning"
                    value={analysisTitle}
                    onChange={(e) => setAnalysisTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    placeholder="Paste your lesson content, lecture notes, or any educational text..."
                    value={analysisContent}
                    onChange={(e) => setAnalysisContent(e.target.value)}
                    rows={10}
                  />
                </div>

                <Button 
                  onClick={() => analyzeContentMutation.mutate()}
                  className="w-full gap-2"
                  disabled={analyzeContentMutation.isPending || !analysisContent}
                >
                  {analyzeContentMutation.isPending ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyze Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Result */}
            <div>
              {analyzeContentMutation.isPending ? (
                <Card>
                  <CardContent className="py-16">
                    <div className="text-center">
                      <div className="animate-pulse">
                        <FileText className="h-16 w-16 mx-auto text-green-500 mb-4" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Analyzing Content...</h3>
                      <p className="text-muted-foreground mb-4">Extracting concepts and key insights</p>
                      <Progress value={50} className="w-48 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              ) : analysisResult ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="py-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {analysisResult.word_count}
                        </div>
                        <p className="text-xs text-muted-foreground">Words</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {analysisResult.reading_time_minutes}m
                        </div>
                        <p className="text-xs text-muted-foreground">Read Time</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {analysisResult.difficulty_estimate}/10
                        </div>
                        <p className="text-xs text-muted-foreground">Difficulty</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Summary */}
                  {analysisResult.summary && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{analysisResult.summary}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Concepts */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-500" />
                        Key Concepts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.concepts.map((concept, i) => (
                          <Badge key={i} variant="secondary">{concept}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Key Points */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        Key Points
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisResult.key_points.map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">No Analysis Yet</h3>
                    <p className="text-muted-foreground">
                      Paste content and click Analyze to get insights
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
