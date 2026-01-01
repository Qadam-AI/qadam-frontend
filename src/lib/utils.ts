import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function getMasteryLevel(value: number): { label: string; color: string } {
  if (value < 0.3) {
    return { label: 'Beginner', color: 'text-amber-600 border-amber-300 bg-amber-50' }
  }
  if (value < 0.7) {
    return { label: 'Intermediate', color: 'text-blue-600 border-blue-300 bg-blue-50' }
  }
  return { label: 'Advanced', color: 'text-emerald-600 border-emerald-300 bg-emerald-50' }
}
