/**
 * Design Tokens for Instructor Experience
 * 
 * Premium, calm, minimal design language
 * Benchmark: Canva clarity + Notion calm + Linear crispness
 */

// Spacing Scale (Tailwind-compatible, 4px base)
export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
} as const

// Border Radius
export const radius = {
  none: '0',
  sm: '0.375rem',   // 6px - buttons, badges
  md: '0.5rem',     // 8px - cards, inputs
  lg: '0.75rem',    // 12px - modals, drawers
  xl: '1rem',       // 16px - large surfaces
  full: '9999px',   // pills, avatars
} as const

// Shadows (soft, premium)
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const

// Typography Scale
export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
  sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
  base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
  lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
  xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
} as const

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

// Semantic Color Tokens (use CSS vars for theme support)
export const colors = {
  // Status colors
  success: 'rgb(34, 197, 94)',      // green-500
  warning: 'rgb(251, 146, 60)',     // orange-400
  error: 'rgb(239, 68, 68)',        // red-500
  info: 'rgb(59, 130, 246)',        // blue-500
  
  // Subtle status backgrounds
  successBg: 'rgb(240, 253, 244)',  // green-50
  warningBg: 'rgb(255, 247, 237)',  // orange-50
  errorBg: 'rgb(254, 242, 242)',    // red-50
  infoBg: 'rgb(239, 246, 255)',     // blue-50
} as const

// Z-index layers
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1200,
  popover: 1300,
  toast: 1400,
} as const

// Transitions
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const

// Container widths
export const containerWidth = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1440px',  // Primary target width
} as const
