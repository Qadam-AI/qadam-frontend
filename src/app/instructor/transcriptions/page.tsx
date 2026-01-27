'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { motion } from 'framer-motion'

// Design System
import { PageShell, PageHeader, Section, Grid, Stack } from '@/design-system/layout'
import { MetricCard, SurfaceCard } from '@/design-system/surfaces'
import { EmptyState, LoadingState } from '@/design-system/feedback'
import { ModalLayout } from '@/design-system/patterns/modal-layout'
import { LabelText, HelperText } from '@/design-system/typography'

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
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [sourceType, setSourceType] = useState<'youtube' | 'audio'>('youtube')
  const queryClient = useQueryClient()

  const { data: transcriptions, isLoading } = useQuery<Transcription[]>({
    queryKey: ['instructor-transcriptions'],
    queryFn: async () => {
      try {
        const res = await api.get('/instructor/transcriptions')
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
      setCreateModalOpen(false)
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

  const allTranscriptions = transcriptions || []

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <PageShell maxWidth="2xl">
      <PageHeader
        title="Video Transcriptions"
        description="Transcribe videos and audio for your lessons using AI"
        action={
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Transcription
          </Button>
        }
      />

      {/* Stats */}
      <Section>
        <Grid cols={3} gap="md">
          <MetricCard
            label="Total"
            value={allTranscriptions.length}
            icon={Brain}
            variant="default"
          />
          <MetricCard
            label="Completed"
            value={allTranscriptions.filter(t => t.status === 'completed').length}
            icon={CheckCircle}
            variant="success"
          />
          <MetricCard
            label="Processing"
            value={allTranscriptions.filter(t => t.status === 'processing').length}
            icon={Clock}
            variant="warning"
          />
        </Grid>
      </Section>

      {/* Transcriptions List */}
      <Section>
        {isLoading ? (
          <LoadingState message="Loading transcriptions..." />
        ) : allTranscriptions.length === 0 ? (
          <SurfaceCard variant="muted" className="py-12">
            <EmptyState
              icon={Brain}
              title="No transcriptions yet"
              description="Start by transcribing a YouTube video or audio file"
              action={{
                label: 'New Transcription',
                onClick: () => setCreateModalOpen(true)
              }}
            />
          </SurfaceCard>
        ) : (
          <Stack gap="sm">
            {allTranscriptions.map((transcription, index) => (
              <motion.div
                key={transcription.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <SurfaceCard className="hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted shrink-0">
                      {transcription.source_type === 'youtube' ? (
                        <Youtube className="h-5 w-5 text-red-500" />
                      ) : (
                        <FileAudio className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate mb-1">
                        {transcription.title || transcription.source_url}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(transcription.duration_seconds)}
                        </span>
                        <span>{transcription.language || 'Auto'}</span>
                        <span>{formatDistanceToNow(new Date(transcription.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    
                    <div className="shrink-0">
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
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
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
                        onClick={() => {
                          if (confirm('Delete this transcription?')) {
                            deleteTranscription.mutate(transcription.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </SurfaceCard>
              </motion.div>
            ))}
          </Stack>
        )}
      </Section>

      {/* Create Modal */}
      <ModalLayout
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Start Transcription"
        description="Transcribe a YouTube video or audio file using AI"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => startTranscription.mutate()}
              disabled={!url || startTranscription.isPending}
              className="gap-2"
            >
              {startTranscription.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              Start Transcription
            </Button>
          </>
        }
      >
        <Stack gap="md">
          <div className="space-y-2">
            <LabelText>Source Type</LabelText>
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
          
          <div className="space-y-2">
            <LabelText required>
              {sourceType === 'youtube' ? 'YouTube URL' : 'Audio File URL'}
            </LabelText>
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder={
                  sourceType === 'youtube' 
                    ? 'https://youtube.com/watch?v=...' 
                    : 'https://example.com/audio.mp3'
                }
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <HelperText>Transcription will start automatically</HelperText>
          </div>
        </Stack>
      </ModalLayout>
    </PageShell>
  )
}
