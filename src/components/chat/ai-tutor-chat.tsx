'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Send, Bot, User, Sparkles, Code, BookOpen, 
  Lightbulb, RefreshCw, Copy, Check, X, 
  Maximize2, Minimize2, MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'

// Types
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  context?: {
    conceptId?: string
    taskId?: string
    lessonId?: string
  }
  suggestions?: string[]
}

interface TutorChatProps {
  userId?: string
  conceptId?: string
  taskId?: string
  lessonId?: string
  initialMessage?: string
  className?: string
  isMinimized?: boolean
  onMinimize?: () => void
  onMaximize?: () => void
}

// AI Tutor Chat Component
export function AITutorChat({
  userId,
  conceptId,
  taskId,
  lessonId,
  initialMessage,
  className = '',
  isMinimized = false,
  onMinimize,
  onMaximize,
}: TutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Add initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greeting: ChatMessage = {
        id: 'greeting',
        role: 'assistant',
        content: initialMessage || "Hi! I'm your AI tutor. I can help you with coding concepts, explain errors, or guide you through problems. What would you like to learn today?",
        timestamp: new Date(),
        suggestions: [
          'Explain this concept',
          'Help me with my code',
          'Give me a hint',
          'Review my solution',
        ],
      }
      setMessages([greeting])
    }
  }, [initialMessage])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      context: { conceptId, taskId, lessonId },
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Create streaming assistant message
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      // Simulate streaming response (replace with actual API call)
      const response = await fetchAIResponse(content, { conceptId, taskId, lessonId })
      
      // Stream the response
      let streamedContent = ''
      for (const char of response) {
        streamedContent += char
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: streamedContent }
            : msg
        ))
        await new Promise(resolve => setTimeout(resolve, 15))
      }

      // Finalize message
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              isStreaming: false,
              suggestions: generateSuggestions(response),
            }
          : msg
      ))
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              content: "I'm sorry, I encountered an error. Please try again.",
              isStreaming: false,
            }
          : msg
      ))
      toast.error('Failed to get response from AI tutor')
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, conceptId, taskId, lessonId])

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // Copy message to clipboard
  const copyMessage = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Handle suggestion click
  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion)
  }

  // Render message content with markdown-like formatting
  const renderContent = (content: string) => {
    // Simple code block detection
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex}>{content.slice(lastIndex, match.index)}</span>
        )
      }

      // Add code block
      const language = match[1] || 'code'
      const code = match[2].trim()
      parts.push(
        <pre 
          key={match.index}
          className="my-2 p-3 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              {language}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              onClick={() => navigator.clipboard.writeText(code)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <code>{code}</code>
        </pre>
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(<span key={lastIndex}>{content.slice(lastIndex)}</span>)
    }

    return parts.length > 0 ? parts : content
  }

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={onMaximize}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </motion.div>
    )
  }

  return (
    <Card className={`flex flex-col h-[500px] ${className}`}>
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            AI Tutor
            {isLoading && (
              <Badge variant="secondary" className="ml-2 animate-pulse">
                Thinking...
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onMinimize}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden p-4 pt-2">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {message.role === 'assistant' ? (
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>

                  {/* Message Content */}
                  <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`
                        inline-block p-3 rounded-lg text-sm whitespace-pre-wrap
                        ${message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                        }
                      `}
                    >
                      {renderContent(message.content)}
                      {message.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                      )}
                    </div>

                    {/* Actions */}
                    {message.role === 'assistant' && !message.isStreaming && (
                      <div className="mt-1 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => copyMessage(message.id, message.content)}
                        >
                          {copiedId === message.id ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          Copy
                        </Button>
                      </div>
                    )}

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && !message.isStreaming && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleSuggestion(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="mt-4 flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="min-h-[44px] max-h-32 resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Floating Chat Button
export function FloatingChatButton({
  onClick,
  isOpen,
  hasUnread = false,
}: {
  onClick: () => void
  isOpen: boolean
  hasUnread?: boolean
}) {
  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        size="lg"
        className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
        onClick={onClick}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        )}
      </Button>
    </motion.div>
  )
}

// Full-page Chat Interface
export function FullPageChat({
  userId,
  conceptId,
  taskId,
}: {
  userId?: string
  conceptId?: string
  taskId?: string
}) {
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <AITutorChat
        userId={userId}
        conceptId={conceptId}
        taskId={taskId}
        className="h-[calc(100vh-200px)]"
      />
    </div>
  )
}

// Helper functions
async function fetchAIResponse(
  message: string, 
  context: { conceptId?: string; taskId?: string; lessonId?: string }
): Promise<string> {
  // TODO: Replace with actual API call
  // const response = await api.post('/ai/tutor/chat', { message, ...context })
  // return response.data.content

  // Simulated response for demo
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const responses = [
    "Great question! Let me explain this concept step by step.\n\nFirst, you need to understand that...",
    "I see what you're working on. Here's a hint:\n\n```python\n# Try using a loop\nfor item in items:\n    process(item)\n```\n\nThis pattern is very common in Python.",
    "That's a common mistake! The issue is that you're modifying the list while iterating over it. Try creating a copy first.",
    "Let me break this down:\n\n1. **Concept**: Understanding the basics\n2. **Application**: How to use it in practice\n3. **Examples**: Real-world scenarios\n\nWould you like me to elaborate on any of these?",
  ]
  
  return responses[Math.floor(Math.random() * responses.length)]
}

function generateSuggestions(response: string): string[] {
  // Generate contextual suggestions based on response
  const suggestions = [
    'Can you explain more?',
    'Show me an example',
    'What are common mistakes?',
  ]
  
  if (response.includes('code') || response.includes('```')) {
    suggestions.push('Review my code')
  }
  
  return suggestions.slice(0, 3)
}
