'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles,
  Loader2,
  ChevronDown,
  Lightbulb,
  Bot
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { askAI, ChatMessage, ChatResponse } from '@/lib/api'
import { cn } from '@/lib/utils'

interface AIAssistantProps {
  context?: string
  lessonId?: string
  courseId?: string
  className?: string
}

export function AIAssistant({ context, lessonId, courseId, className }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response: ChatResponse = await askAI({
        message: userMessage.content,
        context,
        lesson_id: lessonId,
        course_id: courseId,
        history: messages.slice(-6) // Last 6 messages for context
      })

      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: response.response 
      }
      setMessages(prev => [...prev, assistantMessage])
      setSuggestedTopics(response.suggested_topics || [])
    } catch (error) {
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: "I'm having trouble connecting right now. Please try again in a moment."
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedTopic = (topic: string) => {
    setInput(`Tell me more about ${topic}`)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className={cn("fixed bottom-6 right-6 z-50", className)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        <AnimatePresence mode="wait">
          {!isOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Button
                onClick={() => setIsOpen(true)}
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Sparkles className="h-6 w-6" />
                <span className="sr-only">Open AI Assistant</span>
              </Button>
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[500px] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <span className="font-semibold">Qadam AI</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Beta</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Sparkles className="h-12 w-12 mb-4 text-blue-500" />
                  <h3 className="font-semibold text-foreground mb-1">Hi! I'm your AI tutor</h3>
                  <p className="text-sm">Ask me anything about programming or the current lesson.</p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {["What is a variable?", "Explain loops", "Help with functions"].map((q) => (
                      <Button
                        key={q}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setInput(q)
                          inputRef.current?.focus()
                        }}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex",
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        )}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Suggested Topics */}
            {suggestedTopics.length > 0 && (
              <div className="px-4 py-2 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Lightbulb className="h-3 w-3" />
                  <span>Related topics:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {suggestedTopics.slice(0, 3).map((topic, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleSuggestedTopic(topic)}
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
