/**
 * Surface Components
 * Cards, panels, metric cards with consistent styling
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface SurfaceCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'bordered' | 'elevated' | 'muted'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
}

export function SurfaceCard({ 
  children, 
  className, 
  variant = 'default',
  padding = 'md',
  onClick
}: SurfaceCardProps) {
  const variantStyles = {
    default: 'bg-card border border-border shadow-sm',
    bordered: 'bg-card border-2 border-border',
    elevated: 'bg-card border border-border shadow-md',
    muted: 'bg-muted/30 border border-border/50',
  }
  
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  return (
    <div 
      className={cn(
        'rounded-lg',
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
  }
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  className?: string
}

export function MetricCard({ 
  label, 
  value, 
  icon: Icon,
  trend,
  variant = 'default',
  className
}: MetricCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    success: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
    warning: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900',
    error: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900',
    info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900',
  }
  
  const iconColorStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-orange-600 dark:text-orange-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
  }
  
  return (
    <div className={cn(
      'rounded-lg border p-6 transition-all hover:shadow-md',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className={cn('h-5 w-5', iconColorStyles[variant])} />}
      </div>
      
      <div className="space-y-1">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        
        {trend && (
          <p className="text-xs text-muted-foreground">
            <span className={cn(
              'font-medium',
              trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : ''
            )}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
            {' '}{trend.label}
          </p>
        )}
      </div>
    </div>
  )
}

interface InfoPanelProps {
  title?: string
  children: React.ReactNode
  icon?: LucideIcon
  variant?: 'default' | 'info' | 'success' | 'warning'
  className?: string
}

export function InfoPanel({ 
  title, 
  children, 
  icon: Icon,
  variant = 'default',
  className
}: InfoPanelProps) {
  const variantStyles = {
    default: 'bg-muted/30 border-l-muted-foreground/30',
    info: 'bg-blue-50/50 dark:bg-blue-950/10 border-l-blue-500',
    success: 'bg-green-50/50 dark:bg-green-950/10 border-l-green-500',
    warning: 'bg-orange-50/50 dark:bg-orange-950/10 border-l-orange-500',
  }
  
  return (
    <div className={cn(
      'rounded-lg border border-border/50 border-l-4 p-4',
      variantStyles[variant],
      className
    )}>
      {(title || Icon) && (
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className="h-4 w-4 text-foreground" />}
          {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
        </div>
      )}
      <div className="text-sm text-muted-foreground">
        {children}
      </div>
    </div>
  )
}

interface WellProps {
  children: React.ReactNode
  className?: string
}

export function Well({ children, className }: WellProps) {
  return (
    <div className={cn(
      'bg-muted/30 border border-border/50 rounded-lg p-6',
      className
    )}>
      {children}
    </div>
  )
}
