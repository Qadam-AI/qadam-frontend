'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Lightbulb,
  Code, Gauge, FileText, Shield, Zap, AlertTriangle,
  Target, Star, Clock, MemoryStick, TrendingUp
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface TestCaseResult {
  test_id: string
  name: string
  passed: boolean
  expected: any
  actual: any
  execution_time_ms: number
  error_message?: string
  is_hidden: boolean
  points: number
  partial_credit: number
}

interface CodeQualityMetrics {
  line_count: number
  function_count: number
  class_count: number
  max_nesting_depth: number
  cyclomatic_complexity: number
  naming_score: number
  consistency_score: number
  line_length_violations: number
  has_docstrings: boolean
  docstring_coverage: number
  comment_ratio: number
  uses_type_hints: boolean
  follows_pep8: boolean
  has_error_handling: boolean
  issues: string[]
  warnings: string[]
  suggestions: string[]
}

interface CriterionResult {
  type: string
  name: string
  score: number
  max_score: number
  weight: number
  weighted_score: number
  feedback: string
  passed: boolean
  details?: Record<string, any>
}

interface GradingResult {
  id: string
  attempt_id: string
  task_id: string
  user_id: string
  total_score: number
  passed: boolean
  criteria_results: CriterionResult[]
  test_results: TestCaseResult[]
  tests_passed: number
  tests_total: number
  code_quality?: CodeQualityMetrics
  total_execution_time_ms: number
  memory_used_mb: number
  overall_feedback: string
  improvement_suggestions: string[]
  ai_feedback?: string
  graded_at: string
}

interface AdvancedFeedbackPanelProps {
  result: GradingResult
  onGetHint?: () => void
  isLoadingHint?: boolean
  scaffoldedHint?: string | null
}

const CRITERIA_ICONS: Record<string, React.ReactNode> = {
  correctness: <Target className="h-4 w-4" />,
  code_quality: <Code className="h-4 w-4" />,
  efficiency: <Gauge className="h-4 w-4" />,
  documentation: <FileText className="h-4 w-4" />,
  best_practices: <Star className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  edge_cases: <AlertTriangle className="h-4 w-4" />,
}

const CRITERIA_COLORS: Record<string, string> = {
  correctness: 'text-blue-500',
  code_quality: 'text-purple-500',
  efficiency: 'text-green-500',
  documentation: 'text-yellow-500',
  best_practices: 'text-indigo-500',
  security: 'text-red-500',
  edge_cases: 'text-orange-500',
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-500'
  if (score >= 70) return 'text-blue-500'
  if (score >= 50) return 'text-yellow-500'
  return 'text-red-500'
}

function getProgressColor(score: number): string {
  if (score >= 90) return '[&>div]:bg-green-500'
  if (score >= 70) return '[&>div]:bg-blue-500'
  if (score >= 50) return '[&>div]:bg-yellow-500'
  return '[&>div]:bg-red-500'
}

export function AdvancedFeedbackPanel({ 
  result,
  onGetHint,
  isLoadingHint,
  scaffoldedHint
}: AdvancedFeedbackPanelProps) {
  const [showAllTests, setShowAllTests] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const hasCriteriaResults = result.criteria_results && result.criteria_results.length > 0
  const hasCodeQuality = result.code_quality != null
  const hasTestResults = result.test_results && result.test_results.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={result.passed ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-destructive bg-destructive/5'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {result.passed ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-emerald-600">All Tests Passed!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="text-destructive">
                    {result.tests_passed}/{result.tests_total} Tests Passed
                  </span>
                </>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`font-bold ${getScoreColor(result.total_score)}`}>
                {Math.round(result.total_score)}%
              </Badge>
              {result.total_execution_time_ms > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.round(result.total_execution_time_ms)}ms
                </Badge>
              )}
              {result.memory_used_mb > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <MemoryStick className="h-3 w-3" />
                  {result.memory_used_mb.toFixed(1)}MB
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabs for different result views */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="criteria" disabled={!hasCriteriaResults}>Criteria</TabsTrigger>
              <TabsTrigger value="tests" disabled={!hasTestResults}>Tests</TabsTrigger>
              <TabsTrigger value="quality" disabled={!hasCodeQuality}>Quality</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Overall Score Circle */}
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      className="text-muted"
                      strokeWidth="6"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="48"
                      cy="48"
                    />
                    <circle
                      className={getScoreColor(result.total_score).replace('text-', 'text-')}
                      strokeWidth="6"
                      strokeDasharray={`${result.total_score * 2.64} 264`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="48"
                      cy="48"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${getScoreColor(result.total_score)}`}>
                      {Math.round(result.total_score)}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
                  {result.overall_feedback && (
                    <p className="text-sm">{result.overall_feedback}</p>
                  )}
                </div>
              </div>

              {/* Quick Criteria Summary */}
              {hasCriteriaResults && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {result.criteria_results.map((criterion) => (
                    <div
                      key={criterion.type}
                      className={`p-3 rounded-lg border ${
                        criterion.passed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 
                        'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={CRITERIA_COLORS[criterion.type] || 'text-gray-500'}>
                          {CRITERIA_ICONS[criterion.type] || <Zap className="h-4 w-4" />}
                        </span>
                        <span className="text-xs font-medium truncate">{criterion.name}</span>
                      </div>
                      <p className={`text-lg font-bold ${getScoreColor(criterion.score)}`}>
                        {Math.round(criterion.score)}%
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Feedback */}
              {result.ai_feedback && (
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-purple-900 dark:text-purple-100 mb-1">AI Analysis</p>
                      <p className="text-sm text-purple-800 dark:text-purple-200">{result.ai_feedback}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Improvement Suggestions */}
              {result.improvement_suggestions && result.improvement_suggestions.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Improvement Suggestions
                  </p>
                  <ul className="space-y-1">
                    {result.improvement_suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hint Button */}
              {!result.passed && onGetHint && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onGetHint}
                    disabled={isLoadingHint}
                    className="gap-2"
                  >
                    <Lightbulb className="h-4 w-4" />
                    {isLoadingHint ? 'Getting hint...' : 'Get Hint'}
                  </Button>
                </div>
              )}

              {/* Scaffolded Hint */}
              {scaffoldedHint && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">Scaffolded Hint</p>
                      <p className="text-sm text-amber-800 dark:text-amber-200">{scaffoldedHint}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </TabsContent>

            {/* Criteria Tab */}
            <TabsContent value="criteria" className="mt-4 space-y-4">
              {result.criteria_results.map((criterion, index) => (
                <motion.div
                  key={criterion.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={CRITERIA_COLORS[criterion.type] || 'text-gray-500'}>
                        {CRITERIA_ICONS[criterion.type] || <Zap className="h-4 w-4" />}
                      </span>
                      <span className="font-medium">{criterion.name}</span>
                      <Badge variant={criterion.passed ? 'default' : 'destructive'} className="text-xs">
                        {criterion.passed ? 'Passed' : 'Needs Work'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${getScoreColor(criterion.score)}`}>
                        {Math.round(criterion.score)}%
                      </span>
                      <p className="text-xs text-muted-foreground">Weight: {Math.round(criterion.weight * 100)}%</p>
                    </div>
                  </div>
                  <Progress value={criterion.score} className={`h-2 mb-2 ${getProgressColor(criterion.score)}`} />
                  <p className="text-sm text-muted-foreground">{criterion.feedback}</p>
                </motion.div>
              ))}
            </TabsContent>

            {/* Tests Tab */}
            <TabsContent value="tests" className="mt-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">
                  {result.tests_passed} of {result.tests_total} tests passed
                </p>
                {result.test_results.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllTests(!showAllTests)}
                  >
                    {showAllTests ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                    {showAllTests ? 'Show Less' : 'Show All'}
                  </Button>
                )}
              </div>
              {(showAllTests ? result.test_results : result.test_results.slice(0, 5))
                .filter(t => !t.is_hidden)
                .map((test, index) => (
                <motion.div
                  key={test.test_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg border ${
                    test.passed 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {test.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium text-sm">{test.name}</span>
                    </div>
                    {test.execution_time_ms > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {test.execution_time_ms.toFixed(1)}ms
                      </Badge>
                    )}
                  </div>
                  {!test.passed && (
                    <div className="mt-2 text-sm space-y-1">
                      {test.expected !== undefined && (
                        <p className="text-muted-foreground">
                          Expected: <code className="text-xs bg-muted px-1 py-0.5 rounded">{JSON.stringify(test.expected)}</code>
                        </p>
                      )}
                      {test.actual !== undefined && (
                        <p className="text-muted-foreground">
                          Received: <code className="text-xs bg-muted px-1 py-0.5 rounded">{JSON.stringify(test.actual)}</code>
                        </p>
                      )}
                      {test.error_message && (
                        <p className="text-red-600 dark:text-red-400 text-xs">{test.error_message}</p>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </TabsContent>

            {/* Quality Tab */}
            <TabsContent value="quality" className="mt-4 space-y-4">
              {result.code_quality && (
                <>
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{result.code_quality.line_count}</p>
                      <p className="text-xs text-muted-foreground">Lines of Code</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{result.code_quality.function_count}</p>
                      <p className="text-xs text-muted-foreground">Functions</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className={`text-2xl font-bold ${result.code_quality.cyclomatic_complexity <= 5 ? 'text-green-500' : result.code_quality.cyclomatic_complexity <= 10 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {result.code_quality.cyclomatic_complexity.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Complexity</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{result.code_quality.max_nesting_depth}</p>
                      <p className="text-xs text-muted-foreground">Max Nesting</p>
                    </div>
                  </div>

                  {/* Quality Scores */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Naming Conventions</span>
                        <span className={getScoreColor(result.code_quality.naming_score * 100)}>
                          {Math.round(result.code_quality.naming_score * 100)}%
                        </span>
                      </div>
                      <Progress value={result.code_quality.naming_score * 100} className={`h-2 ${getProgressColor(result.code_quality.naming_score * 100)}`} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Code Consistency</span>
                        <span className={getScoreColor(result.code_quality.consistency_score * 100)}>
                          {Math.round(result.code_quality.consistency_score * 100)}%
                        </span>
                      </div>
                      <Progress value={result.code_quality.consistency_score * 100} className={`h-2 ${getProgressColor(result.code_quality.consistency_score * 100)}`} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Documentation Coverage</span>
                        <span className={getScoreColor(result.code_quality.docstring_coverage * 100)}>
                          {Math.round(result.code_quality.docstring_coverage * 100)}%
                        </span>
                      </div>
                      <Progress value={result.code_quality.docstring_coverage * 100} className={`h-2 ${getProgressColor(result.code_quality.docstring_coverage * 100)}`} />
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {result.code_quality.follows_pep8 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> PEP8 Compliant
                      </Badge>
                    )}
                    {result.code_quality.uses_type_hints && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Type Hints
                      </Badge>
                    )}
                    {result.code_quality.has_error_handling && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Error Handling
                      </Badge>
                    )}
                    {result.code_quality.has_docstrings && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Docstrings
                      </Badge>
                    )}
                  </div>

                  {/* Issues & Suggestions */}
                  {result.code_quality.issues.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2 text-red-600">Issues</p>
                      <ul className="space-y-1">
                        {result.code_quality.issues.map((issue, i) => (
                          <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                            <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.code_quality.warnings.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2 text-yellow-600">Warnings</p>
                      <ul className="space-y-1">
                        {result.code_quality.warnings.map((warning, i) => (
                          <li key={i} className="text-sm text-yellow-600 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.code_quality.suggestions.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2 text-blue-600">Suggestions</p>
                      <ul className="space-y-1">
                        {result.code_quality.suggestions.map((suggestion, i) => (
                          <li key={i} className="text-sm text-blue-600 flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}
