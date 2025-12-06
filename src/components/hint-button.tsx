'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, ChevronRight, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getHint, HintResponse } from '@/lib/api'
import { cn } from '@/lib/utils'

interface HintButtonProps {
  taskPrompt: string
  userCode: string
  failures?: { name?: string; expected?: string; received?: string }[]
  concept?: string
  className?: string
}

export function HintButton({ 
  taskPrompt, 
  userCode, 
  failures = [], 
  concept,
  className 
}: HintButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [hints, setHints] = useState<HintResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleGetHint = async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const response = await getHint({
        task_prompt: taskPrompt,
        user_code: userCode,
        failures,
        hint_level: currentLevel,
        concept
      })

      setHints(prev => [...prev, response])
      setCurrentLevel(prev => Math.min(prev + 1, 5))
      setIsOpen(true)
    } catch (error) {
      console.error('Failed to get hint:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setHints([])
    setCurrentLevel(1)
    setIsOpen(false)
  }

  const remainingHints = 5 - hints.length

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        onClick={handleGetHint}
        disabled={isLoading || hints.length >= 5}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Lightbulb className="h-4 w-4" />
        )}
        <span>
          {hints.length === 0 
            ? 'Get Hint' 
            : `More Hints (${remainingHints} left)`
          }
        </span>
      </Button>

      <AnimatePresence>
        {isOpen && hints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 left-0 w-80 bg-background border rounded-lg shadow-lg overflow-hidden z-10"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b">
              <div className="flex items-center gap-2 text-amber-600 font-medium">
                <Lightbulb className="h-4 w-4" />
                <span>Hints ({hints.length}/5)</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="max-h-60 overflow-y-auto p-4 space-y-3">
              {hints.map((hint, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-3"
                >
                  <div className={cn(
                    "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    i === hints.length - 1 
                      ? "bg-amber-500 text-white" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{hint.hint}</p>
                    {hint.encouragement && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {hint.encouragement}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {hints.length < 5 && (
              <div className="p-3 border-t bg-muted/50">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={handleGetHint}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Get Next Hint</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {hints.length === 5 && (
              <div className="p-3 border-t bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  You've used all hints! Try to solve it now.
                </p>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Reset Hints
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
