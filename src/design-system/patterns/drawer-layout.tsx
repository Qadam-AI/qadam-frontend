/**
 * Drawer Layout Pattern
 * Side sheet for details, forms, and contextual information
 */

import React from 'react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'

interface DrawerLayoutProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function DrawerLayout({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md'
}: DrawerLayoutProps) {
  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
  }
  
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className={cn('flex flex-col', sizeClasses[size])}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-6 -mx-6 px-6">
          {children}
        </div>
        
        {footer && (
          <SheetFooter className="flex-row justify-end gap-2 pt-6 border-t">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
