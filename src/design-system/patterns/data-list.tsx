/**
 * Data List Pattern
 * Calm alternative to dense tables for displaying records
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { MoreHorizontal, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface DataListItem {
  id: string
  icon?: LucideIcon
  iconColor?: string
  title: string
  description?: string
  meta?: string
  badge?: React.ReactNode
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'destructive'
  }>
}

interface DataListProps {
  items: DataListItem[]
  onItemClick?: (id: string) => void
  className?: string
  emptyMessage?: string
}

export function DataList({ 
  items, 
  onItemClick,
  className,
  emptyMessage = 'No items to display'
}: DataListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }
  
  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => (
        <DataListItemComponent
          key={item.id}
          item={item}
          onClick={onItemClick ? () => onItemClick(item.id) : undefined}
        />
      ))}
    </div>
  )
}

function DataListItemComponent({ 
  item, 
  onClick 
}: { 
  item: DataListItem
  onClick?: () => void
}) {
  const Icon = item.icon
  
  return (
    <div className={cn(
      'group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all',
      onClick && 'cursor-pointer hover:border-primary/50 hover:shadow-sm'
    )}>
      {Icon && (
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted',
          item.iconColor
        )}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      
      <div 
        className="flex-1 min-w-0"
        onClick={onClick}
      >
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-foreground truncate">
            {item.title}
          </h3>
          {item.badge}
        </div>
        
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}
        
        {item.meta && (
          <p className="text-xs text-muted-foreground/70 mt-1">
            {item.meta}
          </p>
        )}
      </div>
      
      {item.actions && item.actions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {item.actions.map((action, index) => (
              <DropdownMenuItem
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  action.onClick()
                }}
                className={cn(
                  action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                )}
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
