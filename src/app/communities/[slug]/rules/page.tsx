'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  ArrowLeft, PlusCircle, Trash2, GripVertical, Loader2, Save,
  Zap, TrendingUp, Target, BookOpen, Trophy, Flame, Clock,
  Calendar, AlertTriangle, ShieldCheck, GraduationCap, CheckCircle2
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description?: string
}

interface Rule {
  id?: string
  type: string
  label: string
  description: string | null
  config: Record<string, any>
  is_required: boolean
  priority: number
}

interface RuleTemplate {
  type: string
  label: string
  description: string
  icon: any
  category: 'mastery' | 'behavioral' | 'time' | 'special'
  fields: {
    name: string
    type: 'number' | 'string' | 'date' | 'select' | 'multi-select' | 'course-picker'
    label: string
    description?: string
    required?: boolean
    min?: number
    max?: number
    options?: { value: string; label: string }[]
  }[]
}

const RULE_TEMPLATES: RuleTemplate[] = [
  {
    type: 'MIN_XP',
    label: 'Minimum XP',
    description: 'Require users to have earned a minimum amount of XP',
    icon: Zap,
    category: 'mastery',
    fields: [
      { name: 'value', type: 'number', label: 'Minimum XP', required: true, min: 0 },
    ],
  },
  {
    type: 'MIN_AVG_MASTERY',
    label: 'Average Mastery Level',
    description: 'Require a minimum average mastery percentage across all concepts',
    icon: TrendingUp,
    category: 'mastery',
    fields: [
      { name: 'value', type: 'number', label: 'Minimum Mastery %', required: true, min: 0, max: 100 },
    ],
  },
  {
    type: 'MIN_CONCEPT_MASTERY',
    label: 'Concept Mastery Count',
    description: 'Require mastery of a minimum number of concepts at a specified level',
    icon: Target,
    category: 'mastery',
    fields: [
      { name: 'count', type: 'number', label: 'Number of Concepts', required: true, min: 1 },
      { name: 'level', type: 'number', label: 'Mastery Level %', required: true, min: 0, max: 100 },
    ],
  },
  {
    type: 'REQUIRED_COURSES',
    label: 'Required Courses',
    description: 'Require completion of specific courses before joining',
    icon: BookOpen,
    category: 'mastery',
    fields: [
      { name: 'course_ids', type: 'course-picker', label: 'Select Required Courses', required: true },
    ],
  },
  {
    type: 'MIN_ACCURACY',
    label: 'Minimum Accuracy',
    description: 'Require a minimum accuracy percentage on task attempts',
    icon: Trophy,
    category: 'behavioral',
    fields: [
      { name: 'value', type: 'number', label: 'Minimum Accuracy %', required: true, min: 0, max: 100 },
    ],
  },
  {
    type: 'MIN_ATTEMPTS',
    label: 'Minimum Attempts',
    description: 'Require a minimum number of completed task attempts',
    icon: Target,
    category: 'behavioral',
    fields: [
      { name: 'value', type: 'number', label: 'Minimum Attempts', required: true, min: 0 },
    ],
  },
  {
    type: 'MIN_STREAK',
    label: 'Learning Streak',
    description: 'Require an active or historical learning streak',
    icon: Flame,
    category: 'behavioral',
    fields: [
      { name: 'value', type: 'number', label: 'Minimum Streak Days', required: true, min: 1 },
    ],
  },
  {
    type: 'MAX_INACTIVITY_DAYS',
    label: 'Recent Activity',
    description: 'Require activity within a specified number of days',
    icon: Clock,
    category: 'behavioral',
    fields: [
      { name: 'value', type: 'number', label: 'Max Days Since Last Activity', required: true, min: 1 },
    ],
  },
  {
    type: 'MAX_HINT_USAGE',
    label: 'Hint Usage Limit',
    description: 'Limit the percentage of tasks where hints were used',
    icon: AlertTriangle,
    category: 'behavioral',
    fields: [
      { name: 'value', type: 'number', label: 'Max Hint Usage %', required: true, min: 0, max: 100 },
    ],
  },
  {
    type: 'START_DATE',
    label: 'Opens On Date',
    description: 'Community opens for joining on a specific date',
    icon: Calendar,
    category: 'time',
    fields: [
      { name: 'date', type: 'date', label: 'Start Date', required: true },
    ],
  },
  {
    type: 'END_DATE',
    label: 'Closes On Date',
    description: 'Community closes for joining on a specific date',
    icon: Calendar,
    category: 'time',
    fields: [
      { name: 'date', type: 'date', label: 'End Date', required: true },
    ],
  },
  {
    type: 'MANUAL_APPROVAL',
    label: 'Manual Approval',
    description: 'Requires creator/moderator approval for all join requests',
    icon: ShieldCheck,
    category: 'special',
    fields: [],
  },
  {
    type: 'ENTRY_TEST',
    label: 'Entry Assessment',
    description: 'Require passing an assessment before joining',
    icon: GraduationCap,
    category: 'special',
    fields: [
      { name: 'test_id', type: 'string', label: 'Assessment ID', required: true },
      { name: 'min_score', type: 'number', label: 'Minimum Score %', required: true, min: 0, max: 100 },
    ],
  },
]

const CATEGORY_LABELS = {
  mastery: 'Mastery & Progress',
  behavioral: 'Behavior & Engagement',
  time: 'Time-Based',
  special: 'Special Requirements',
}

export default function CommunityRulesPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const slug = params.slug as string

  const [rules, setRules] = useState<Rule[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<RuleTemplate | null>(null)
  const [ruleConfig, setRuleConfig] = useState<Record<string, any>>({})
  const [ruleLabel, setRuleLabel] = useState('')
  const [isRequired, setIsRequired] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])

  // Fetch available courses for the course picker
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await api.get('/courses')
      return res.data
    },
  })

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', slug],
    queryFn: async () => {
      const res = await api.get(`/communities/${slug}`)
      // Transform backend rule format to frontend format
      const transformedRules = (res.data.rules || []).map((r: any) => ({
        id: r.id,
        type: r.rule_type?.toUpperCase() || r.type,
        label: r.name || r.label || RULE_TEMPLATES.find(t => t.type === (r.rule_type?.toUpperCase() || r.type))?.label || r.rule_type,
        description: r.description,
        config: r.config || {},
        is_required: r.is_required,
        priority: r.order || 0,
      }))
      setRules(transformedRules)
      return res.data
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (newRules: Rule[]) => {
      // Delete removed rules, update existing, add new
      const existingIds = community?.rules?.map((r: Rule) => r.id) || []
      const newIds = newRules.filter(r => r.id).map(r => r.id)
      
      // Delete removed
      const toDelete = existingIds.filter((id: string) => !newIds.includes(id))
      for (const id of toDelete) {
        await api.delete(`/communities/${slug}/rules/${id}`)
      }
      
      // Add new rules
      for (const rule of newRules.filter(r => !r.id)) {
        await api.post(`/communities/${slug}/rules`, {
          rule_type: rule.type.toLowerCase(), // Backend expects lowercase
          name: rule.label,
          description: rule.description,
          config: rule.config,
          is_required: rule.is_required,
          order: rule.priority || 0,
          is_enabled: true,
          is_automatic: true,
        })
      }
      
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', slug] })
      setHasChanges(false)
      toast.success('Rules Saved', { description: 'Membership rules have been updated.' })
    },
    onError: () => {
      toast.error('Failed to save', { description: 'Could not save rules.' })
    },
  })

  const addRule = () => {
    if (!selectedTemplate) return
    
    const newRule: Rule = {
      type: selectedTemplate.type,
      label: ruleLabel || selectedTemplate.label,
      description: selectedTemplate.description,
      config: ruleConfig,
      is_required: isRequired,
      priority: rules.length + 1,
    }
    
    setRules([...rules, newRule])
    setHasChanges(true)
    setShowAddDialog(false)
    resetForm()
  }

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const resetForm = () => {
    setSelectedTemplate(null)
    setRuleConfig({})
    setRuleLabel('')
    setIsRequired(true)
    setSelectedCourseIds([])
  }

  // When template changes to course picker, sync ruleConfig
  useEffect(() => {
    if (selectedTemplate?.type === 'REQUIRED_COURSES') {
      setRuleConfig(prev => ({
        ...prev,
        course_ids: selectedCourseIds.join(',')
      }))
    }
  }, [selectedCourseIds, selectedTemplate])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Skeleton className="h-8 w-1/3 mb-8" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href={`/communities/${slug}/manage`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Management
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Membership Rules
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure requirements that users must meet to join {community?.name}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAddDialog(true)}
            className="gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Add Rule
          </Button>
          <Button
            onClick={() => saveMutation.mutate(rules)}
            disabled={!hasChanges || saveMutation.isPending}
            className="gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Rules
          </Button>
        </div>
      </div>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Rules ({rules.length})</CardTitle>
          <CardDescription>
            Rules are evaluated in order. All required rules must pass for a user to be eligible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Rules Yet</h3>
              <p className="text-muted-foreground mb-4">
                Without rules, anyone can join. Add rules to gate membership.
              </p>
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <PlusCircle className="w-4 h-4" />
                Add Your First Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {rules.map((rule, index) => {
                  const template = RULE_TEMPLATES.find(t => t.type === rule.type)
                  const Icon = template?.icon || ShieldCheck
                  
                  return (
                    <motion.div
                      key={`${rule.type}-${index}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                    >
                      <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                      
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{rule.label}</h4>
                          {rule.is_required && (
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">{rule.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rule.type === 'REQUIRED_COURSES' && rule.config.course_ids ? (
                            <>
                              Courses: {rule.config.course_ids.split(',').map((id: string) => {
                                const course = courses.find(c => c.id === id.trim())
                                return course ? course.title : id.trim()
                              }).join(', ')}
                            </>
                          ) : (
                            Object.entries(rule.config).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No configuration'
                          )}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRule(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Rule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Membership Rule</DialogTitle>
            <DialogDescription>
              Select a rule type and configure its requirements
            </DialogDescription>
          </DialogHeader>

          {!selectedTemplate ? (
            <div className="space-y-6">
              {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
                const categoryRules = RULE_TEMPLATES.filter(t => t.category === category)
                if (categoryRules.length === 0) return null
                
                return (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">{label}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {categoryRules.map(template => {
                        const Icon = template.icon
                        const alreadyAdded = rules.some(r => r.type === template.type)
                        
                        return (
                          <button
                            key={template.type}
                            onClick={() => {
                              setSelectedTemplate(template)
                              setRuleLabel(template.label)
                            }}
                            disabled={alreadyAdded}
                            className={`p-4 rounded-lg border text-left transition-all ${
                              alreadyAdded
                                ? 'opacity-50 cursor-not-allowed bg-muted'
                                : 'hover:border-primary hover:bg-primary/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-primary" />
                              <div>
                                <p className="font-medium text-sm">{template.label}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {template.description}
                                </p>
                              </div>
                              {alreadyAdded && (
                                <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/50 flex items-center gap-4">
                <selectedTemplate.icon className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-medium">{selectedTemplate.label}</h3>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Rule Label</Label>
                  <Input
                    value={ruleLabel}
                    onChange={(e) => setRuleLabel(e.target.value)}
                    placeholder="Custom label for this rule"
                  />
                </div>

                {selectedTemplate.fields.map(field => (
                  <div key={field.name}>
                    <Label>{field.label} {field.required && '*'}</Label>
                    {field.type === 'number' && (
                      <Input
                        type="number"
                        min={field.min}
                        max={field.max}
                        value={ruleConfig[field.name] || ''}
                        onChange={(e) => setRuleConfig({
                          ...ruleConfig,
                          [field.name]: Number(e.target.value),
                        })}
                        placeholder={field.description}
                      />
                    )}
                    {field.type === 'string' && (
                      <Input
                        value={ruleConfig[field.name] || ''}
                        onChange={(e) => setRuleConfig({
                          ...ruleConfig,
                          [field.name]: e.target.value,
                        })}
                        placeholder={field.description}
                      />
                    )}
                    {field.type === 'date' && (
                      <Input
                        type="date"
                        value={ruleConfig[field.name] || ''}
                        onChange={(e) => setRuleConfig({
                          ...ruleConfig,
                          [field.name]: e.target.value,
                        })}
                      />
                    )}
                    {field.type === 'course-picker' && (
                      <div className="space-y-2 mt-2">
                        {courses.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No courses available</p>
                        ) : (
                          <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                            {courses.map((course) => (
                              <div key={course.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                                <Checkbox
                                  id={`course-${course.id}`}
                                  checked={selectedCourseIds.includes(course.id)}
                                  onCheckedChange={(checked: boolean | 'indeterminate') => {
                                    if (checked === true) {
                                      setSelectedCourseIds(prev => [...prev, course.id])
                                    } else {
                                      setSelectedCourseIds(prev => prev.filter(id => id !== course.id))
                                    }
                                  }}
                                />
                                <label htmlFor={`course-${course.id}`} className="flex-1 cursor-pointer">
                                  <p className="font-medium text-sm">{course.title}</p>
                                  {course.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">{course.description}</p>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                        {selectedCourseIds.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {selectedCourseIds.map(id => {
                              const course = courses.find(c => c.id === id)
                              return course ? (
                                <Badge key={id} variant="secondary" className="text-xs">
                                  {course.title}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    {field.description && field.type !== 'course-picker' && (
                      <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <Label>Required Rule</Label>
                    <p className="text-xs text-muted-foreground">
                      If required, users must meet this rule to join
                    </p>
                  </div>
                  <Switch checked={isRequired} onCheckedChange={setIsRequired} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedTemplate ? (
              <>
                <Button variant="outline" onClick={resetForm}>
                  Back
                </Button>
                <Button onClick={addRule}>
                  Add Rule
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>You have unsaved changes</span>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate(rules)}
            disabled={saveMutation.isPending}
          >
            Save Now
          </Button>
        </div>
      )}
    </div>
  )
}
