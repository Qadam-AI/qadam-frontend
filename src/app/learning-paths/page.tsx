'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Route, Sparkles, Target, Clock, ChevronRight, CheckCircle2,
  Circle, Play, BookOpen, Trophy, Zap, GraduationCap, Plus,
  MapPin, Flag, Star
} from 'lucide-react'
import { toast } from 'sonner'

interface Milestone {
  id: string
  skill_name: string
  position: number
  estimated_hours: number
  concepts: string[]
  progress?: number
}

interface LearningPath {
  id: string
  title: string
  description: string
  total_hours: number
  milestones: Milestone[]
  skill_sequence: string[]
  progress?: number
}

interface Role {
  name: string
  skills: string[]
}

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']

export default function LearningPathsPage() {
  const { user } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null)
  const [form, setForm] = useState({
    target_role: '',
    target_skills: '',
    current_skills: '',
    weekly_hours: 10,
    learning_style: 'balanced',
  })

  // Fetch user's learning paths
  const { data: userPaths, isLoading: pathsLoading, refetch } = useQuery({
    queryKey: ['learning-paths', user?.id],
    queryFn: async () => {
      const res = await api.get<{ paths: LearningPath[], total: number }>(
        `/api/v1/llm/learning-paths/user/${user?.id}`
      )
      return res.data
    },
    enabled: !!user?.id,
  })

  // Fetch available roles
  const { data: rolesData } = useQuery({
    queryKey: ['learning-path-roles'],
    queryFn: async () => {
      const res = await api.get<{ roles: Record<string, string[]> }>('/api/v1/llm/learning-paths/roles')
      return res.data
    },
  })

  // Generate path mutation
  const generateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await api.post<LearningPath>('/api/v1/llm/learning-paths/generate', {
        user_id: user?.id,
        target_role: data.target_role || null,
        target_skills: data.target_skills.split(',').map(s => s.trim()).filter(Boolean),
        current_skills: data.current_skills.split(',').map(s => s.trim()).filter(Boolean),
        weekly_hours: data.weekly_hours,
        learning_style: data.learning_style,
      })
      return res.data
    },
    onSuccess: (path) => {
      toast.success('Learning path generated!')
      setSelectedPath(path)
      setIsDialogOpen(false)
      refetch()
    },
    onError: () => {
      toast.error('Failed to generate learning path')
    },
  })

  const handleGenerate = () => {
    if (!form.target_role && !form.target_skills.trim()) {
      toast.error('Please select a target role or enter target skills')
      return
    }
    generateMutation.mutate(form)
  }

  const roles = rolesData?.roles ? Object.keys(rolesData.roles) : []

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white"
      >
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Route className="h-6 w-6" />
              <span className="text-lg font-medium text-white/80">Learning Paths</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Your Journey to Mastery 🚀
            </h1>
            <p className="text-white/80 text-lg max-w-2xl">
              AI-generated personalized learning paths tailored to your goals and current skills.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-purple-600 hover:bg-white/90 gap-2">
                <Plus className="h-4 w-4" />
                New Path
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Learning Path</DialogTitle>
                <DialogDescription>
                  Generate a personalized learning path based on your goals
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Target Role (optional)</Label>
                  <Select
                    value={form.target_role}
                    onValueChange={(v) => setForm(prev => ({ ...prev, target_role: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a career role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Skills</Label>
                  <Input
                    placeholder="python, machine learning, data science"
                    value={form.target_skills}
                    onChange={(e) => setForm(prev => ({ ...prev, target_skills: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Skills you want to learn (comma-separated)</p>
                </div>

                <div className="space-y-2">
                  <Label>Current Skills</Label>
                  <Input
                    placeholder="python basics, html, css"
                    value={form.current_skills}
                    onChange={(e) => setForm(prev => ({ ...prev, current_skills: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Skills you already have (comma-separated)</p>
                </div>

                <div className="space-y-2">
                  <Label>Weekly Study Hours</Label>
                  <Select
                    value={String(form.weekly_hours)}
                    onValueChange={(v) => setForm(prev => ({ ...prev, weekly_hours: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 hours/week</SelectItem>
                      <SelectItem value="10">10 hours/week</SelectItem>
                      <SelectItem value="15">15 hours/week</SelectItem>
                      <SelectItem value="20">20 hours/week</SelectItem>
                      <SelectItem value="30">30+ hours/week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Learning Style</Label>
                  <Select
                    value={form.learning_style}
                    onValueChange={(v) => setForm(prev => ({ ...prev, learning_style: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="project_based">Project Based</SelectItem>
                      <SelectItem value="theory_first">Theory First</SelectItem>
                      <SelectItem value="hands_on">Hands On</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="gap-2">
                  {generateMutation.isPending ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Path
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-pink-400/20 blur-3xl" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Paths List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Route className="h-5 w-5 text-purple-500" />
            My Learning Paths
          </h2>

          {pathsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : userPaths?.paths.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Route className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">No learning paths yet</p>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Path
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {userPaths?.paths.map((path) => (
                <motion.div
                  key={path.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all ${
                      selectedPath?.id === path.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                    onClick={() => setSelectedPath(path)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium truncate">{path.title}</h3>
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {path.total_hours}h
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        {path.milestones.length} milestones
                      </p>
                      <Progress value={path.progress || 0} className="h-2" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Demo Path for visualization */}
          {selectedPath && (
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Skill Sequence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedPath.skill_sequence.map((skill, i) => (
                    <Badge key={i} variant="outline" className="gap-1">
                      <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center">
                        {i + 1}
                      </span>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Path Detail / Roadmap */}
        <div className="lg:col-span-2">
          {generateMutation.isPending ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="animate-pulse">
                    <Sparkles className="h-16 w-16 mx-auto text-purple-500 mb-4" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Creating Your Learning Path...</h3>
                  <p className="text-muted-foreground mb-4">Analyzing skills and generating roadmap</p>
                  <Progress value={45} className="w-48 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ) : selectedPath ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Path Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Route className="h-5 w-5 text-purple-500" />
                        {selectedPath.title}
                      </CardTitle>
                      <CardDescription className="mt-2">{selectedPath.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{selectedPath.total_hours}h</div>
                      <p className="text-sm text-muted-foreground">Total time</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Start</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-green-500 via-purple-500 to-pink-500" />
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-pink-500" />
                      <span className="text-sm">Goal</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Milestones */}
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-purple-500 to-pink-500" />

                <div className="space-y-6">
                  {selectedPath.milestones.map((milestone, index) => {
                    const isFirst = index === 0
                    const isLast = index === selectedPath.milestones.length - 1
                    const progress = milestone.progress || 0
                    const isComplete = progress >= 100
                    const isInProgress = progress > 0 && progress < 100

                    return (
                      <motion.div
                        key={milestone.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative pl-16"
                      >
                        {/* Milestone dot */}
                        <div className={`absolute left-6 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isComplete 
                            ? 'bg-green-500 border-green-500' 
                            : isInProgress 
                              ? 'bg-purple-500 border-purple-500' 
                              : 'bg-background border-muted-foreground/30'
                        }`}>
                          {isComplete && <CheckCircle2 className="h-3 w-3 text-white" />}
                          {isInProgress && <Play className="h-2 w-2 text-white fill-white" />}
                        </div>

                        <Card className={`transition-all ${isInProgress ? 'ring-2 ring-purple-500' : ''}`}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge 
                                  variant={isComplete ? 'default' : 'secondary'}
                                  className={`${isComplete ? 'bg-green-500' : ''}`}
                                >
                                  {isFirst ? '🚀 Start' : isLast ? '🏆 Goal' : `Step ${milestone.position}`}
                                </Badge>
                                <CardTitle className="text-lg">{milestone.skill_name}</CardTitle>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {milestone.estimated_hours}h
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Concepts */}
                            <div>
                              <p className="text-sm font-medium mb-2">Concepts to Learn:</p>
                              <div className="flex flex-wrap gap-2">
                                {milestone.concepts.map((concept, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {concept}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Progress */}
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>

                            {/* Action Button */}
                            <div className="flex justify-end">
                              {isComplete ? (
                                <Button variant="outline" size="sm" className="gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  Completed
                                </Button>
                              ) : isInProgress ? (
                                <Button size="sm" className="gap-2">
                                  <Play className="h-4 w-4" />
                                  Continue
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" className="gap-2" disabled>
                                  <Circle className="h-4 w-4" />
                                  Locked
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Route className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No Path Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Create a new learning path or select one from the list to view your roadmap.
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Learning Path
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
