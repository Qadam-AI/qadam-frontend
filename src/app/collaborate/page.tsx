'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Users, Plus, Code, Play, Eye, UserPlus, 
  Copy, Link as LinkIcon, Crown, Sparkles,
  Monitor, Laptop, User, Circle, Video
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Session {
  id: string
  type: string
  title: string
  host_id: string
  participant_count: number
  max_participants: number
  is_active: boolean
  created_at: string
  join_url: string
}

interface SessionDetail {
  id: string
  type: string
  title: string
  description?: string
  hostId: string
  language: string
  currentCode: string
  version: number
  participants: Participant[]
}

interface Participant {
  userId: string
  username: string
  role: 'host' | 'driver' | 'navigator' | 'observer'
  color: string
  isActive: boolean
  cursorPosition?: {
    line: number
    column: number
  }
}

const SESSION_TYPES = [
  { value: 'pair_programming', label: 'Pair Programming', icon: <Users className="h-4 w-4" />, description: 'Work together on code with driver/navigator roles' },
  { value: 'code_review', label: 'Code Review', icon: <Eye className="h-4 w-4" />, description: 'Review and discuss code changes together' },
  { value: 'live_coding', label: 'Live Coding', icon: <Play className="h-4 w-4" />, description: 'Live coding session with observers' },
  { value: 'interview', label: 'Technical Interview', icon: <Video className="h-4 w-4" />, description: 'Conduct a mock technical interview' },
]

const ROLE_ICONS: Record<string, React.ReactNode> = {
  host: <Crown className="h-4 w-4 text-yellow-500" />,
  driver: <Laptop className="h-4 w-4 text-blue-500" />,
  navigator: <Monitor className="h-4 w-4 text-green-500" />,
  observer: <Eye className="h-4 w-4 text-gray-500" />,
}

export default function CollaboratePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({
    title: '',
    type: 'pair_programming',
    language: 'python',
    initial_code: '',
    max_participants: 5,
  })

  // Fetch active sessions
  const { data: sessions, isLoading: loadingSessions, refetch } = useQuery({
    queryKey: ['collaboration-sessions'],
    queryFn: async () => {
      const res = await api.get<Session[]>('/api/v1/collaboration/sessions')
      return res.data
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  })

  // Fetch selected session detail
  const { data: sessionDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['collaboration-session', selectedSession],
    queryFn: async () => {
      const res = await api.get<SessionDetail>(`/api/v1/collaboration/sessions/${selectedSession}`)
      return res.data
    },
    enabled: !!selectedSession,
  })

  // Create session mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      const res = await api.post<Session>('/api/v1/collaboration/sessions', data)
      return res.data
    },
    onSuccess: (session) => {
      toast.success('Session created!')
      queryClient.invalidateQueries({ queryKey: ['collaboration-sessions'] })
      setIsCreateOpen(false)
      setSelectedSession(session.id)
    },
    onError: () => {
      toast.error('Failed to create session')
    },
  })

  const handleCreate = () => {
    if (!createForm.title.trim()) {
      toast.error('Please enter a session title')
      return
    }
    createMutation.mutate(createForm)
  }

  const copyJoinLink = (session: Session) => {
    const url = `${window.location.origin}/collaborate/join/${session.id}`
    navigator.clipboard.writeText(url)
    toast.success('Join link copied!')
  }

  const mySessions = sessions?.filter(s => s.host_id === user?.id) || []
  const otherSessions = sessions?.filter(s => s.host_id !== user?.id) || []

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header - Clean style like Courses page */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-start"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Code Together</h1>
          <p className="text-muted-foreground mt-2">
            Join or create real-time collaboration sessions for pair programming, code reviews, and more.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Collaboration Session</DialogTitle>
              <DialogDescription>
                Start a new session and invite others to join.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Algorithm Practice Session"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Session Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SESSION_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      variant={createForm.type === type.value ? 'default' : 'outline'}
                      className="justify-start gap-2 h-auto py-3"
                      onClick={() => setCreateForm(prev => ({ ...prev, type: type.value }))}
                    >
                      {type.icon}
                      <div className="text-left">
                        <p className="font-medium text-sm">{type.label}</p>
                        <p className="text-xs text-muted-foreground hidden md:block">
                          {type.description}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={createForm.language}
                    onValueChange={(v) => setCreateForm(prev => ({ ...prev, language: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Participants</Label>
                  <Select
                    value={String(createForm.max_participants)}
                    onValueChange={(v) => setCreateForm(prev => ({ ...prev, max_participants: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleCreate} 
                className="w-full" 
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Session'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sessions List */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Sessions</TabsTrigger>
              <TabsTrigger value="my">My Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-4">
              {loadingSessions ? (
                [...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))
              ) : sessions?.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">No Active Sessions</h3>
                    <p className="text-muted-foreground mb-4">
                      Be the first to create a collaboration session!
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Session
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                sessions?.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={`cursor-pointer hover:border-primary/50 transition-colors ${
                        selectedSession === session.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedSession(session.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Code className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{session.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="secondary" className="capitalize">
                                  {session.type?.replace('_', ' ') || 'Session'}
                                </Badge>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {session.participant_count}/{session.max_participants}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                copyJoinLink(session)
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Link href={`/collaborate/session/${session.id}`}>
                              <Button size="sm" className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                Join
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </TabsContent>

            <TabsContent value="my" className="mt-4 space-y-4">
              {mySessions.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first collaboration session!
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Session
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                mySessions.map((session) => (
                  <Card key={session.id} className="cursor-pointer hover:border-primary/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                            <Crown className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{session.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {session.participant_count} participant(s)
                            </p>
                          </div>
                        </div>
                        <Link href={`/collaborate/session/${session.id}`}>
                          <Button size="sm" className="gap-2">
                            <Play className="h-4 w-4" />
                            Resume
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Session Details Sidebar */}
        <div className="space-y-6">
          {selectedSession && sessionDetail ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{sessionDetail.title}</CardTitle>
                  <CardDescription className="capitalize">
                    {sessionDetail.type?.replace('_', ' ') || 'Session'} • {sessionDetail.language || 'Code'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Participants</p>
                    <div className="space-y-2">
                      {sessionDetail.participants?.map((participant) => (
                        <div
                          key={participant.userId}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                        >
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: participant.color }}
                          />
                          <span className="flex-1 text-sm">{participant.username}</span>
                          {ROLE_ICONS[participant.role]}
                          <Badge variant="outline" className="text-xs capitalize">
                            {participant.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Link href={`/collaborate/session/${selectedSession}`}>
                    <Button className="w-full gap-2">
                      <Play className="h-4 w-4" />
                      Join Session
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a session to view details</p>
              </CardContent>
            </Card>
          )}

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium text-sm">Create or Join</p>
                  <p className="text-xs text-muted-foreground">Start a new session or join an existing one</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 font-bold text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">Pick a Role</p>
                  <p className="text-xs text-muted-foreground">Driver writes code, Navigator guides</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium text-sm">Code Together</p>
                  <p className="text-xs text-muted-foreground">See cursors and changes in real-time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
