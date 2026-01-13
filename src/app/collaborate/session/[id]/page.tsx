'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, Play, Eye, UserPlus, Crown, ArrowLeft,
  Monitor, Laptop, User, Circle, Video, Code,
  Copy, Share2, Settings, MessageSquare, X
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

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
  created_at: string
  is_active: boolean
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  host: <Crown className="h-4 w-4 text-yellow-500" />,
  driver: <Laptop className="h-4 w-4 text-blue-500" />,
  navigator: <Monitor className="h-4 w-4 text-green-500" />,
  observer: <Eye className="h-4 w-4 text-gray-500" />,
}

const ROLE_COLORS: Record<string, string> = {
  host: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  driver: 'bg-blue-100 text-blue-800 border-blue-200',
  navigator: 'bg-green-100 text-green-800 border-green-200',
  observer: 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const sessionId = params.id as string
  const [code, setCode] = useState('')
  const [chat, setChat] = useState<{ user: string; message: string; timestamp: Date }[]>([])
  const [chatMessage, setChatMessage] = useState('')
  const codeRef = useRef<HTMLTextAreaElement>(null)

  // Fetch session details
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      try {
        const res = await api.get(`/collaboration/sessions/${sessionId}`)
        return res.data as SessionDetail
      } catch (err: any) {
        console.error('Failed to fetch session:', err)
        throw err
      }
    },
    enabled: !!sessionId,
    refetchInterval: 5000, // Poll for updates
  })

  // Join session mutation
  const joinMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await api.post(`/collaboration/sessions/${sessionId}/join`, { role })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      toast.success('Joined session successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to join session')
    },
  })

  // Leave session mutation
  const leaveMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/collaboration/sessions/${sessionId}/leave`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      toast.success('Left session')
      router.push('/collaborate')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to leave session')
    },
  })

  // Update code mutation
  const updateCodeMutation = useMutation({
    mutationFn: async (newCode: string) => {
      await api.put(`/collaboration/sessions/${sessionId}/code`, { code: newCode })
    },
    onError: (error: any) => {
      toast.error('Failed to update code')
    },
  })

  // Set initial code when session loads
  useEffect(() => {
    if (session?.currentCode && !code) {
      setCode(session.currentCode)
    }
  }, [session?.currentCode])

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value
    setCode(newCode)
    // Debounce code updates
    const timeout = setTimeout(() => {
      updateCodeMutation.mutate(newCode)
    }, 500)
    return () => clearTimeout(timeout)
  }

  const handleSendChat = () => {
    if (!chatMessage.trim()) return
    setChat([...chat, { user: user?.name || 'You', message: chatMessage, timestamp: new Date() }])
    setChatMessage('')
    // TODO: Send via websocket
  }

  const copyInviteLink = () => {
    const url = `${window.location.origin}/collaborate/session/${sessionId}`
    navigator.clipboard.writeText(url)
    toast.success('Invite link copied!')
  }

  const isParticipant = session?.participants?.some(p => p.userId === user?.id)
  const currentRole = session?.participants?.find(p => p.userId === user?.id)?.role
  const isHost = session?.hostId === user?.id

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Skeleton className="h-[600px] w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This session may have ended or the link is invalid.
            </p>
            <Link href="/collaborate">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Collaborate
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/collaborate">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{session?.title || 'Collaboration Session'}</h1>
              {session?.is_active && (
                <Badge variant="default" className="bg-green-500">
                  <Circle className="h-2 w-2 mr-1 fill-current" />
                  Live
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {session?.type?.replace('_', ' ')} • {session?.language}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyInviteLink}>
            <Share2 className="h-4 w-4 mr-2" />
            Invite
          </Button>
          {isParticipant ? (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Leave Session
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={() => joinMutation.mutate('observer')}
              disabled={joinMutation.isPending}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Join
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Code Editor */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] overflow-hidden">
            <CardHeader className="py-3 px-4 border-b flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span className="font-medium">{session?.language || 'Code'}</span>
              </div>
              {currentRole && (
                <Badge variant="outline" className={ROLE_COLORS[currentRole]}>
                  {ROLE_ICONS[currentRole]}
                  <span className="ml-1 capitalize">{currentRole}</span>
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-56px)]">
              <textarea
                ref={codeRef}
                value={code}
                onChange={handleCodeChange}
                className="w-full h-full p-4 font-mono text-sm bg-zinc-950 text-zinc-100 resize-none focus:outline-none"
                placeholder="// Start coding here..."
                disabled={!isParticipant || currentRole === 'observer'}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Participants */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants ({session?.participants?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {session?.participants?.length === 0 && (
                <p className="text-sm text-muted-foreground">No participants yet</p>
              )}
              {session?.participants?.map((participant) => (
                <div 
                  key={participant.userId} 
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: participant.color }}
                    />
                    <span className="text-sm font-medium">{participant.username}</span>
                  </div>
                  <Badge variant="outline" className={ROLE_COLORS[participant.role]}>
                    {ROLE_ICONS[participant.role]}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat */}
          <Card className="h-[280px] flex flex-col">
            <CardHeader className="py-3 px-4 flex-shrink-0">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                {chat.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No messages yet
                  </p>
                )}
                {chat.map((msg, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">{msg.user}:</span>
                    <span className="ml-1 text-muted-foreground">{msg.message}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 text-sm border rounded-md"
                  disabled={!isParticipant}
                />
                <Button size="sm" onClick={handleSendChat} disabled={!isParticipant}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
