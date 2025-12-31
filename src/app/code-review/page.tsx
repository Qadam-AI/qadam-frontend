'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Code2, Sparkles, AlertTriangle, AlertCircle, Info,
  CheckCircle2, Shield, Zap, Bug, Lightbulb, Copy,
  ChevronDown, ChevronUp, FileCode
} from 'lucide-react'
import { toast } from 'sonner'

interface CodeIssue {
  severity: 'error' | 'warning' | 'info' | 'security'
  category: string
  message: string
  line?: number
  suggestion?: string
  code_snippet?: string
}

interface CodeReviewResult {
  overall_score: number
  issues: CodeIssue[]
  suggestions: string[]
  summary: string
  metrics: {
    line_count?: number
    complexity?: number
    maintainability?: number
    [key: string]: number | undefined
  }
}

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
]

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case 'security': return <Shield className="h-4 w-4 text-purple-500" />
    default: return <Info className="h-4 w-4 text-blue-500" />
  }
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'error': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'warning': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'security': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  }
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-500'
  if (score >= 60) return 'text-yellow-500'
  return 'text-red-500'
}

export default function CodeReviewPage() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [context, setContext] = useState('')
  const [result, setResult] = useState<CodeReviewResult | null>(null)
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null)

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<CodeReviewResult>('/api/v1/llm/code-review/review', {
        code,
        language,
        context: context || undefined,
      })
      return res.data
    },
    onSuccess: (data) => {
      toast.success('Code review completed!')
      setResult(data)
    },
    onError: () => {
      toast.error('Failed to review code')
    },
  })

  const handleReview = () => {
    if (!code.trim()) {
      toast.error('Please enter some code to review')
      return
    }
    reviewMutation.mutate()
  }

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const issuesByCategory = result?.issues.reduce((acc, issue) => {
    acc[issue.category] = acc[issue.category] || []
    acc[issue.category].push(issue)
    return acc
  }, {} as Record<string, CodeIssue[]>) || {}

  const errorCount = result?.issues.filter(i => i.severity === 'error').length || 0
  const warningCount = result?.issues.filter(i => i.severity === 'warning').length || 0
  const securityCount = result?.issues.filter(i => i.severity === 'security').length || 0

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 p-8 text-white"
      >
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="h-6 w-6" />
            <span className="text-lg font-medium text-white/80">AI Code Review</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Get Instant Code Feedback 🔍
          </h1>
          <p className="text-white/80 text-lg max-w-2xl">
            Analyze your code for bugs, security issues, and best practices with AI-powered review.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Code Input */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-blue-500" />
                Your Code
              </CardTitle>
              <CardDescription>
                Paste your code below for AI-powered analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Code</Label>
                <Textarea
                  placeholder={`# Paste your ${language} code here...\ndef example():\n    pass`}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Context (optional)</Label>
                <Textarea
                  placeholder="Describe what this code should do, any specific concerns..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleReview}
                className="w-full gap-2"
                disabled={reviewMutation.isPending}
              >
                {reviewMutation.isPending ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Review Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {reviewMutation.isPending ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="animate-pulse">
                    <Code2 className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Analyzing Your Code...</h3>
                  <p className="text-muted-foreground mb-4">Checking patterns, security, and best practices</p>
                  <Progress value={66} className="w-48 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ) : result ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Score Card */}
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                      <div className={`text-4xl font-bold ${getScoreColor(result.overall_score)}`}>
                        {result.overall_score}/100
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-red-500">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-xl font-bold">{errorCount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Errors</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-yellow-500">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xl font-bold">{warningCount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Warnings</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-500">
                          <Shield className="h-4 w-4" />
                          <span className="text-xl font-bold">{securityCount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Security</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{result.summary}</p>
                </CardContent>
              </Card>

              {/* Issues */}
              <Tabs defaultValue="all">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="all">
                    All Issues ({result.issues.length})
                  </TabsTrigger>
                  <TabsTrigger value="errors">
                    Errors ({errorCount})
                  </TabsTrigger>
                  <TabsTrigger value="suggestions">
                    Suggestions ({result.suggestions.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4 space-y-3">
                  <AnimatePresence>
                    {result.issues.map((issue, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="overflow-hidden">
                          <div 
                            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setExpandedIssue(expandedIssue === index ? null : index)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                {getSeverityIcon(issue.severity)}
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                                      {issue.severity}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {issue.category}
                                    </Badge>
                                    {issue.line && (
                                      <span className="text-xs text-muted-foreground">
                                        Line {issue.line}
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-medium">{issue.message}</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                {expandedIssue === index ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedIssue === index && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t"
                              >
                                <div className="p-4 space-y-3 bg-muted/30">
                                  {issue.code_snippet && (
                                    <div>
                                      <p className="text-sm font-medium mb-2">Code:</p>
                                      <div className="relative">
                                        <pre className="p-3 rounded bg-slate-900 text-slate-100 text-sm overflow-x-auto">
                                          {issue.code_snippet}
                                        </pre>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="absolute top-2 right-2"
                                          onClick={() => copyCode(issue.code_snippet!)}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  {issue.suggestion && (
                                    <div className="p-3 rounded bg-green-50 dark:bg-green-900/20">
                                      <p className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2 mb-1">
                                        <Lightbulb className="h-4 w-4" />
                                        Suggestion
                                      </p>
                                      <p className="text-sm text-green-600 dark:text-green-400">
                                        {issue.suggestion}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="errors" className="mt-4 space-y-3">
                  {result.issues
                    .filter(i => i.severity === 'error')
                    .map((issue, index) => (
                      <Card key={index}>
                        <CardContent className="py-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                            <div>
                              <p className="font-medium">{issue.message}</p>
                              {issue.line && (
                                <p className="text-sm text-muted-foreground">Line {issue.line}</p>
                              )}
                              {issue.suggestion && (
                                <p className="text-sm text-green-600 mt-2">💡 {issue.suggestion}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {errorCount === 0 && (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                        <p className="font-medium">No Errors Found!</p>
                        <p className="text-sm text-muted-foreground">Your code has no critical errors</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="suggestions" className="mt-4 space-y-3">
                  {result.suggestions.map((suggestion, index) => (
                    <Card key={index}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                          <p>{suggestion}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>

              {/* Metrics */}
              {result.metrics && Object.keys(result.metrics).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(result.metrics).map(([key, value]) => (
                        <div key={key} className="text-center p-3 rounded-lg bg-muted/50">
                          <div className="text-2xl font-bold">{value}</div>
                          <p className="text-xs text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Code2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No Review Yet</h3>
                <p className="text-muted-foreground">
                  Paste your code and click Review to get AI-powered feedback!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
