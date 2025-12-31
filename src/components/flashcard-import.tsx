'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  Upload, Plus, FileText, Check, AlertCircle, Brain,
  Sparkles, X
} from 'lucide-react'
import { toast } from 'sonner'

interface FlashcardInput {
  front: string
  back: string
  hint?: string
  tags: string[]
  difficulty: number
}

interface FlashcardImportProps {
  userId: string
  onImportComplete?: () => void
}

export function FlashcardImport({ userId, onImportComplete }: FlashcardImportProps) {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [importMode, setImportMode] = useState<'manual' | 'bulk' | 'ai'>('manual')
  const [manualCard, setManualCard] = useState<FlashcardInput>({
    front: '',
    back: '',
    hint: '',
    tags: [],
    difficulty: 5,
  })
  const [bulkText, setBulkText] = useState('')
  const [aiTopic, setAiTopic] = useState('')
  const [tagInput, setTagInput] = useState('')

  // Import single flashcard
  const importSingleMutation = useMutation({
    mutationFn: async (card: FlashcardInput) => {
      const res = await api.post('/api/v1/llm/spaced-repetition/items/add', {
        user_id: userId,
        ...card,
      })
      return res.data
    },
    onSuccess: () => {
      toast.success('Flashcard added!')
      queryClient.invalidateQueries({ queryKey: ['spaced-repetition'] })
      setManualCard({ front: '', back: '', hint: '', tags: [], difficulty: 5 })
      onImportComplete?.()
    },
    onError: () => {
      toast.error('Failed to add flashcard')
    },
  })

  // Bulk import flashcards
  const bulkImportMutation = useMutation({
    mutationFn: async (text: string) => {
      // Parse Q: A: format
      const cards: FlashcardInput[] = []
      const lines = text.split('\n').filter(l => l.trim())
      
      let currentCard: Partial<FlashcardInput> = {}
      
      for (const line of lines) {
        if (line.startsWith('Q:') || line.startsWith('Question:')) {
          if (currentCard.front && currentCard.back) {
            cards.push({
              front: currentCard.front,
              back: currentCard.back,
              tags: [],
              difficulty: 5,
            })
          }
          currentCard = { front: line.replace(/^(Q:|Question:)\s*/, '') }
        } else if (line.startsWith('A:') || line.startsWith('Answer:')) {
          currentCard.back = line.replace(/^(A:|Answer:)\s*/, '')
        }
      }
      
      // Add last card
      if (currentCard.front && currentCard.back) {
        cards.push({
          front: currentCard.front,
          back: currentCard.back,
          tags: [],
          difficulty: 5,
        })
      }

      if (cards.length === 0) {
        throw new Error('No valid flashcards found. Use Q: and A: format.')
      }

      // Import each card
      const res = await api.post('/api/v1/llm/spaced-repetition/items/import', {
        user_id: userId,
        items: cards,
      })
      return { count: cards.length, data: res.data }
    },
    onSuccess: (result) => {
      toast.success(`Imported ${result.count} flashcards!`)
      queryClient.invalidateQueries({ queryKey: ['spaced-repetition'] })
      setBulkText('')
      setIsOpen(false)
      onImportComplete?.()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to import flashcards')
    },
  })

  // AI generate flashcards
  const aiGenerateMutation = useMutation({
    mutationFn: async (topic: string) => {
      const res = await api.post('/api/v1/llm/study-guides/flashcards/generate', {
        content: topic,
        count: 10,
      })
      return res.data
    },
    onSuccess: (data) => {
      toast.success(`Generated ${data.flashcards?.length || 0} flashcards!`)
      queryClient.invalidateQueries({ queryKey: ['spaced-repetition'] })
      setAiTopic('')
      setIsOpen(false)
      onImportComplete?.()
    },
    onError: () => {
      toast.error('Failed to generate flashcards')
    },
  })

  const addTag = () => {
    if (tagInput.trim() && !manualCard.tags.includes(tagInput.trim())) {
      setManualCard(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setManualCard(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Flashcards
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Flashcards</DialogTitle>
          <DialogDescription>
            Add flashcards manually, import in bulk, or generate with AI.
          </DialogDescription>
        </DialogHeader>

        {/* Mode Selector */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <Button
            variant={importMode === 'manual' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setImportMode('manual')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Manual
          </Button>
          <Button
            variant={importMode === 'bulk' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setImportMode('bulk')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Bulk
          </Button>
          <Button
            variant={importMode === 'ai' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setImportMode('ai')}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generate
          </Button>
        </div>

        {/* Manual Mode */}
        {importMode === 'manual' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Question (Front)</Label>
              <Textarea
                placeholder="What is the capital of France?"
                value={manualCard.front}
                onChange={(e) => setManualCard(prev => ({ ...prev, front: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Answer (Back)</Label>
              <Textarea
                placeholder="Paris"
                value={manualCard.back}
                onChange={(e) => setManualCard(prev => ({ ...prev, back: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Hint (optional)</Label>
              <Input
                placeholder="It's also known as the City of Light"
                value={manualCard.hint}
                onChange={(e) => setManualCard(prev => ({ ...prev, hint: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="geography"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {manualCard.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {manualCard.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={String(manualCard.difficulty)}
                onValueChange={(v) => setManualCard(prev => ({ ...prev, difficulty: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Very Easy</SelectItem>
                  <SelectItem value="3">3 - Easy</SelectItem>
                  <SelectItem value="5">5 - Medium</SelectItem>
                  <SelectItem value="7">7 - Hard</SelectItem>
                  <SelectItem value="10">10 - Very Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Bulk Mode */}
        {importMode === 'bulk' && (
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">Format:</p>
              <pre className="text-blue-600 dark:text-blue-400">
{`Q: What is Python?
A: A programming language

Q: What is a variable?
A: A container for storing data`}
              </pre>
            </div>

            <div className="space-y-2">
              <Label>Paste your flashcards</Label>
              <Textarea
                placeholder="Q: Question here
A: Answer here

Q: Another question
A: Another answer"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={10}
              />
            </div>
          </div>
        )}

        {/* AI Mode */}
        {importMode === 'ai' && (
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-sm">
              <p className="text-purple-700 dark:text-purple-300">
                <Sparkles className="h-4 w-4 inline mr-2" />
                Describe a topic and AI will generate flashcards for you.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Topic or Content</Label>
              <Textarea
                placeholder="Python data structures including lists, dictionaries, sets, and tuples. Focus on methods and common operations."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                rows={5}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          {importMode === 'manual' && (
            <Button
              onClick={() => importSingleMutation.mutate(manualCard)}
              disabled={!manualCard.front || !manualCard.back || importSingleMutation.isPending}
            >
              {importSingleMutation.isPending ? 'Adding...' : 'Add Flashcard'}
            </Button>
          )}
          {importMode === 'bulk' && (
            <Button
              onClick={() => bulkImportMutation.mutate(bulkText)}
              disabled={!bulkText.trim() || bulkImportMutation.isPending}
            >
              {bulkImportMutation.isPending ? 'Importing...' : 'Import All'}
            </Button>
          )}
          {importMode === 'ai' && (
            <Button
              onClick={() => aiGenerateMutation.mutate(aiTopic)}
              disabled={!aiTopic.trim() || aiGenerateMutation.isPending}
              className="gap-2"
            >
              {aiGenerateMutation.isPending ? (
                'Generating...'
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FlashcardImport
