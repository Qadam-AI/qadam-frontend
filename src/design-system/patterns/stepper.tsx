/**
 * Stepper Pattern
 * Multi-step flow indicator with progress
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface Step {
  id: string
  label: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: string
  completedSteps: string[]
  className?: string
  variant?: 'default' | 'compact'
}

export function Stepper({ 
  steps, 
  currentStep, 
  completedSteps,
  className,
  variant = 'default'
}: StepperProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep)
  
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = step.id === currentStep
          const isUpcoming = index > currentIndex
          
          return (
            <React.Fragment key={step.id}>
              <div className={cn(
                'flex items-center gap-2',
                isUpcoming && 'opacity-40'
              )}>
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                  isUpcoming && 'bg-muted text-muted-foreground'
                )}>
                  {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={cn(
                  'text-sm font-medium hidden sm:inline',
                  isCurrent && 'text-foreground',
                  !isCurrent && 'text-muted-foreground'
                )}>
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className={cn(
                  'h-[2px] w-12 transition-colors',
                  completedSteps.includes(steps[index + 1].id) || index < currentIndex
                    ? 'bg-primary'
                    : 'bg-muted'
                )} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }
  
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = step.id === currentStep
          const isUpcoming = index > currentIndex
          
          return (
            <li key={step.id} className="relative">
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    'absolute left-4 top-10 -bottom-4 w-0.5 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )} 
                  aria-hidden="true"
                />
              )}
              
              <div className="group relative flex items-start">
                <span className="flex h-9 items-center">
                  <span className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    isUpcoming && 'bg-muted text-muted-foreground'
                  )}>
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </span>
                </span>
                
                <span className="ml-4 flex min-w-0 flex-col">
                  <span className={cn(
                    'text-sm font-medium',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="text-xs text-muted-foreground">
                      {step.description}
                    </span>
                  )}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
