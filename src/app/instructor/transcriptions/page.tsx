'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Brain, 
  Plus,
  Youtube,
  FileAudio,
  Link,
  Clock,
  CheckCircle,
  Loader2,
  Download,
  Eye,
  Trash2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'
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
import { Label } from '@/components/ui/label'

interface Transcription {
  id: string
  title: string
  source_url?: string
  source_type: 'youtube' | 'audio' | 'video'
  status: 'processing' | 'completed' | 'failed'
  duration_seconds?: number
  language?: string
  text?: string
  created_at: string
}

export default function InstructorTranscriptions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [sourceType, setSourceType] = useState<'youtube' | 'audio'>('youtube')
  const queryClient = useQueryClient()

  const { data: transcriptions, isLoading } = useQuery<Transcription[]>({
    queryKey: ['instructor-transcriptions'],
    queryFn: async () => {
      try {
        const res = await api.get('/instructor/transcriptions')
        // Handle both wrapped and direct array responses
        return Array.isArray(res.data) ? res.data : (res.data?.transcriptions || [])
      } catch {
        return []
      }
    },
  })

  const startTranscription = useMutation({
    mutationFn: async () => {
      const res = await api.post('/llm/transcribe', {
        video_url: url,
        language: 'auto',
      })
      return res.data
    },
    onSuccess: () => {
      toast.success('Transcription started!')
      setIsDialogOpen(false)
      setUrl('')
      queryClient.invalidateQueries({ queryKey: ['instructor-transcriptions'] })
    },
    onError: () => {
      toast.error('Failed to start transcription')
    },
  })

  const deleteTranscription = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/instructor/transcriptions/${id}`)
    },
    onSuccess: () => {
      toast.success('Transcription deleted')
      queryClient.invalidateQueries({ queryKey: ['instructor-transcriptions'] })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Video Transcriptions</h1>
          <p className="text-muted-foreground">Transcribe videos and audio for your lessons</p>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const allTranscriptions = transcriptions || []

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Video Transcriptions</h1>
          <p className="text-muted-foreground">Transcribe videos and audio for your lessons</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Transcription
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Transcription</DialogTitle>
              <DialogDescription>
                Transcribe a YouTube video or audio file using AI
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Source Type</Label>
                <Select 
                  value={sourceType} 
                  onValueChange={(v) => setSourceType(v as 'youtube' | 'audio')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">
                      <div className="flex items-center gap-2">
                        <Youtube className="h-4 w-4 text-red-500" />
                        YouTube Video
                      </div>
                    </SelectItem>
                    <SelectItem value="audio">
                      <div className="flex items-center gap-2">
                        <FileAudio className="h-4 w-4 text-blue-500" />
                        Audio URL
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="url">
                  {sourceType === 'youtube' ? 'YouTube URL' : 'Audio File URL'}
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="url"
                    placeholder={
                      sourceType === 'youtube' 
                        ? 'https://youtube.com/watch?v=...' 
                        : 'https://example.com/audio.mp3'
                    }
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => startTranscription.mutate()}
                disabled={!url || startTranscription.isPending}
              >
                {startTranscription.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Start Transcription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transcriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allTranscriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {allTranscriptions.filter(t => t.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {allTranscriptions.filter(t => t.status === 'processing').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transcriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transcriptions</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allTranscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No transcriptions yet. Start by transcribing a YouTube video.
                </TableCell>
              </TableRow>
            ) : (
              allTranscriptions.map((transcription) => (
                <TableRow key={transcription.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transcription.source_type === 'youtube' ? (
                        <Youtube className="h-4 w-4 text-red-500" />
                      ) : (
                        <FileAudio className="h-4 w-4 text-blue-500" />
                      )}
                      <div className="truncate max-w-[200px]">
                        {transcription.title || transcription.source_url}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {transcription.status === 'completed' && (
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" /> Completed
                      </Badge>
                    )}
                    {transcription.status === 'processing' && (
                      <Badge variant="outline" className="text-yellow-600">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Processing
                      </Badge>
                    )}
                    {transcription.status === 'failed' && (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDuration(transcription.duration_seconds)}</TableCell>
                  <TableCell>{transcription.language || 'Auto'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(transcription.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {transcription.status === 'completed' && (
                        <>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteTranscription.mutate(transcription.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
