'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BookOpen, Sparkles, FileText, Download, Copy,
  Lightbulb, CheckCircle2, AlertTriangle, GraduationCap,
  Clock, Brain, ChevronRight, Plus
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Flashcard {
  id: string
  front: string
  back: string
  hint?: string
  tags: string[]
  difficulty: number
}

interface Section {
  id: string
  title: string
  order: number
  content: string
  key_points: string[]
  examples: { title: string, code?: string, explanation: string }[]
  tips: string[]
  common_mistakes: string[]
}

interface StudyGuide {
  id: string
  title: string
  description: string
  format: string
  sections: Section[]
  flashcards: Flashcard[]
  learning_objectives: string[]
  estimated_study_time_hours: number
}

const FORMATS = [
  { value: 'comprehensive', label: 'Comprehensive', description: 'Full study guide with all sections', icon: <BookOpen className="h-5 w-5" /> },
  { value: 'quick_reference', label: 'Quick Reference', description: 'Condensed key points only', icon: <FileText className="h-5 w-5" /> },
  { value: 'flashcards', label: 'Flashcards Only', description: 'Generate flashcards for review', icon: <Brain className="h-5 w-5" /> },
  { value: 'exam_prep', label: 'Exam Prep', description: 'Focus on common questions', icon: <GraduationCap className="h-5 w-5" /> },
]

export default function StudyGuidesPage() {
  const { user } = useAuth()
  const [generatedGuide, setGeneratedGuide] = useState<StudyGuide | null>(null)
  const [activeSection, setActiveSection] = useState(0)
  const [form, setForm] = useState({
    title: '',
    content: '',
    format: 'comprehensive',
    concepts: '',
    include_flashcards: true,
    include_practice: true,
    difficulty_level: 5,
  })

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await api.post<StudyGuide>('/api/v1/llm/study-guides/generate', {
        ...data,
        concepts: data.concepts.split(',').map(c => c.trim()).filter(Boolean),
      })
      return res.data
    },
    onSuccess: (guide) => {
      toast.success('Study guide generated!')
      setGeneratedGuide(guide)
    },
    onError: () => {
      toast.error('Failed to generate study guide')
    },
  })

  const handleGenerate = () => {
    if (!form.title.trim()) {
      toast.error('Please enter a title')
      return
    }
    if (!form.content.trim()) {
      toast.error('Please enter some content or topic')
      return
    }
    generateMutation.mutate(form)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Study Guides</h1>
        <p className="text-muted-foreground mt-2">
          Generate comprehensive study guides, flashcards, and exam prep materials from any content.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generator Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Generate Study Guide
              </CardTitle>
              <CardDescription>
                Enter your content or topic to generate study materials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Python Data Structures"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content / Topic</Label>
                <Textarea
                  id="content"
                  placeholder="Paste lesson content, notes, or describe the topic you want to study..."
                  value={form.content}
                  onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <Select
                  value={form.format}
                  onValueChange={(v) => setForm(prev => ({ ...prev, format: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        <div className="flex items-center gap-2">
                          {f.icon}
                          <span>{f.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="concepts">Key Concepts (optional)</Label>
                <Input
                  id="concepts"
                  placeholder="lists, dictionaries, tuples"
                  value={form.concepts}
                  onChange={(e) => setForm(prev => ({ ...prev, concepts: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Comma-separated list of concepts to focus on</p>
              </div>

              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <Select
                  value={String(form.difficulty_level)}
                  onValueChange={(v) => setForm(prev => ({ ...prev, difficulty_level: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Beginner (1-3)</SelectItem>
                    <SelectItem value="5">Intermediate (4-6)</SelectItem>
                    <SelectItem value="8">Advanced (7-10)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGenerate}
                className="w-full gap-2"
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Study Guide
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/review">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  Spaced Repetition
                </Button>
              </Link>
              <Link href="/learning-paths">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <ChevronRight className="h-4 w-4 text-blue-500" />
                  Learning Paths
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <GraduationCap className="h-4 w-4 text-green-500" />
                  My Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Generated Guide */}
        <div className="lg:col-span-2">
          {generateMutation.isPending ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="animate-pulse">
                    <Sparkles className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Generating Your Study Guide...</h3>
                  <p className="text-muted-foreground mb-4">This may take a moment</p>
                  <Progress value={33} className="w-48 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ) : generatedGuide ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Guide Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{generatedGuide.title}</CardTitle>
                      <CardDescription>{generatedGuide.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {generatedGuide.format.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {generatedGuide.estimated_study_time_hours}h
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Learning Objectives */}
                  <div className="mb-4">
                    <p className="font-medium text-sm mb-2">Learning Objectives</p>
                    <ul className="space-y-1">
                      {generatedGuide.learning_objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Sections Tabs */}
              <Tabs defaultValue="sections">
                <TabsList>
                  <TabsTrigger value="sections">
                    Sections ({generatedGuide.sections.length})
                  </TabsTrigger>
                  <TabsTrigger value="flashcards">
                    Flashcards ({generatedGuide.flashcards.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sections" className="mt-4 space-y-4">
                  {generatedGuide.sections.map((section, index) => (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                              {section.order}
                            </span>
                            {section.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-muted-foreground">{section.content}</p>

                          {section.key_points.length > 0 && (
                            <div>
                              <p className="font-medium text-sm mb-2 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                                Key Points
                              </p>
                              <ul className="space-y-1">
                                {section.key_points.map((point, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {section.tips.length > 0 && (
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                              <p className="font-medium text-sm mb-1 text-green-700 dark:text-green-300">💡 Tips</p>
                              <ul className="space-y-1">
                                {section.tips.map((tip, i) => (
                                  <li key={i} className="text-sm text-green-600 dark:text-green-400">{tip}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {section.common_mistakes.length > 0 && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                              <p className="font-medium text-sm mb-1 text-red-700 dark:text-red-300 flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4" />
                                Common Mistakes
                              </p>
                              <ul className="space-y-1">
                                {section.common_mistakes.map((mistake, i) => (
                                  <li key={i} className="text-sm text-red-600 dark:text-red-400">{mistake}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </TabsContent>

                <TabsContent value="flashcards" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedGuide.flashcards.map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="h-full">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-2">
                              <Badge variant="outline" className="text-xs">
                                Difficulty: {card.difficulty}/10
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(`Q: ${card.front}\nA: ${card.back}`)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Question</p>
                                <p className="font-medium">{card.front}</p>
                              </div>
                              <div className="border-t pt-3">
                                <p className="text-xs text-muted-foreground mb-1">Answer</p>
                                <p className="text-sm">{card.back}</p>
                              </div>
                              {card.hint && (
                                <div className="p-2 rounded bg-amber-50 dark:bg-amber-900/20">
                                  <p className="text-xs text-amber-700 dark:text-amber-300">💡 {card.hint}</p>
                                </div>
                              )}
                              {card.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {card.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {generatedGuide.flashcards.length > 0 && (
                    <div className="mt-6 text-center">
                      <Link href="/review">
                        <Button className="gap-2">
                          <Brain className="h-4 w-4" />
                          Add to Spaced Repetition
                        </Button>
                      </Link>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No Study Guide Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Enter your content and generate a personalized study guide!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
