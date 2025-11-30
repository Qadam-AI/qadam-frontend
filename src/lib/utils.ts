import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function getMasteryLevel(mastery: number): {
  label: string
  color: string
} {
  if (mastery < 0.3) {
    return { label: 'Beginner', color: 'text-amber-600' }
  } else if (mastery < 0.7) {
    return { label: 'Intermediate', color: 'text-blue-600' }
  } else {
    return { label: 'Advanced', color: 'text-emerald-600' }
  }
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(d)
}

