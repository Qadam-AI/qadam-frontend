/**
 * Layout Components
 * Consistent page structure for all instructor pages
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PageShellProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export function PageShell({ children, className, maxWidth = '2xl' }: PageShellProps) {
  const maxWidthClasses = {
    md: 'max-w-3xl',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  }
  
  return (
    <div className={cn('w-full', maxWidthClasses[maxWidth], 'mx-auto px-6 py-8 space-y-8', className)}>
      {children}
    </div>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  backHref?: string
  backLabel?: string
}

export function PageHeader({ 
  title, 
  description, 
  action, 
  backHref,
  backLabel = 'Back'
}: PageHeaderProps) {
  const router = useRouter()
  
  return (
    <div className="space-y-4 pb-6 border-b border-border/40">
      {backHref && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push(backHref)}
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-lg text-muted-foreground max-w-3xl">
              {description}
            </p>
          )}
        </div>
        
        {action && (
          <div className="shrink-0 pt-1">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}

interface SectionProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
  action?: React.ReactNode
}

export function Section({ 
  children, 
  className,
  title,
  description,
  action
}: SectionProps) {
  return (
    <section className={cn('space-y-6', className)}>
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title && (
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      
      {children}
    </section>
  )
}

interface GridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Grid({ children, cols = 3, gap = 'md', className }: GridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }
  
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  }
  
  return (
    <div className={cn('grid', colClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  )
}

interface StackProps {
  children: React.ReactNode
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Stack({ children, gap = 'md', className }: StackProps) {
  const gapClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  }
  
  return (
    <div className={cn(gapClasses[gap], className)}>
      {children}
    </div>
  )
}
