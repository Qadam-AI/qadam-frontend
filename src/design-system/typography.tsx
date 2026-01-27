/**
 * Typography Components
 * Consistent heading and text styles across instructor pages
 */

import React from 'react'
import { cn } from '@/lib/utils'

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  children: React.ReactNode
}

export function Heading({ 
  level = 1, 
  as, 
  className, 
  children, 
  ...props 
}: HeadingProps) {
  const Tag = as || (`h${level}` as keyof JSX.IntrinsicElements)
  
  const styles = {
    1: 'text-4xl font-bold tracking-tight',
    2: 'text-3xl font-bold tracking-tight',
    3: 'text-2xl font-semibold tracking-tight',
    4: 'text-xl font-semibold',
    5: 'text-lg font-semibold',
    6: 'text-base font-semibold',
  }
  
  return React.createElement(
    Tag,
    {
      className: cn(styles[level], className),
      ...props
    },
    children
  )
}

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  variant?: 'default' | 'muted' | 'subtle'
  weight?: 'normal' | 'medium' | 'semibold'
  as?: 'p' | 'span' | 'div'
  children: React.ReactNode
}

export function Text({ 
  size = 'base',
  variant = 'default',
  weight = 'normal',
  as = 'p',
  className,
  children,
  ...props
}: TextProps) {
  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }
  
  const variantStyles = {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    subtle: 'text-muted-foreground/70',
  }
  
  const weightStyles = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
  }
  
  return React.createElement(
    as,
    {
      className: cn(
        sizeStyles[size],
        variantStyles[variant],
        weightStyles[weight],
        className
      ),
      ...props
    },
    children
  )
}

// Label component for forms
interface LabelTextProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  children: React.ReactNode
}

export function LabelText({ required, className, children, ...props }: LabelTextProps) {
  return (
    <label 
      className={cn('text-sm font-medium text-foreground', className)} 
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  )
}

// Helper text for forms
export function HelperText({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)} {...props}>
      {children}
    </p>
  )
}

// Error text for forms
export function ErrorText({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-destructive', className)} {...props}>
      {children}
    </p>
  )
}
