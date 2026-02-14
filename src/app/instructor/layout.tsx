'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, type ComponentType } from 'react'
import { Navbar } from '../_components/navbar'
import { Footer } from '../_components/footer'
import { useUIStore } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  BookOpen, 
  Users, 
  Link2,
  FileText,
  Target,
  ClipboardCheck,
  LibraryBig,
  GitBranch,
  BarChart3,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n'

type NavItem = {
  key: string
  href: string
  icon: ComponentType<{ className?: string }>
  requiresCourse?: boolean
}

function InstructorSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tNav = useTranslations('pilotNav')
  const {
    sidebarOpen,
    setSidebarOpen,
    instructorMode,
    setInstructorMode,
    activeCourseId,
    setActiveCourseId,
  } = useUIStore()
  
  const courseIdFromPath = useMemo(() => {
    const match = pathname.match(/^\/instructor\/courses\/([^/]+)$/) || pathname.match(/^\/instructor\/courses\/([^/]+)\//)
    return match?.[1] ?? null
  }, [pathname])

  useEffect(() => {
    if (courseIdFromPath) {
      setActiveCourseId(courseIdFromPath)
    }
  }, [courseIdFromPath, setActiveCourseId])

  useEffect(() => {
    const nextMode = pathname.startsWith('/instructor/assessments-hub') || pathname.startsWith('/instructor/practice-links')
      ? 'teach'
      : pathname.startsWith('/instructor/mastery') || pathname.startsWith('/instructor/students') || pathname.startsWith('/instructor/question-analytics')
        ? 'review'
        : 'prepare'

    if (nextMode !== instructorMode) {
      setInstructorMode(nextMode)
    }
  }, [instructorMode, pathname, setInstructorMode])

  const navItems: NavItem[] = useMemo(() => {
    const conceptMapHref = activeCourseId
      ? `/instructor/courses/${activeCourseId}/concept-map`
      : '/instructor/courses'

    if (instructorMode === 'prepare') {
      return [
        { key: 'courses', href: '/instructor/courses', icon: BookOpen },
        { key: 'conceptMap', href: conceptMapHref, icon: GitBranch, requiresCourse: true },
        { key: 'questionBank', href: '/instructor/question-bank', icon: LibraryBig },
      ]
    }

    if (instructorMode === 'teach') {
      return [
        { key: 'practiceSets', href: '/instructor/assessments-hub?tab=templates', icon: FileText },
        { key: 'gradebook', href: '/instructor/assessments-hub?tab=runs', icon: ClipboardCheck },
        { key: 'practiceLinks', href: '/instructor/practice-links', icon: Link2 },
      ]
    }

    return [
      { key: 'students', href: '/instructor/students', icon: Users },
      { key: 'understanding', href: '/instructor/mastery', icon: Target },
      { key: 'questionAnalytics', href: '/instructor/question-analytics', icon: BarChart3 },
    ]
  }, [activeCourseId, instructorMode])

  const isActive = (item: NavItem) => {
    // Special-case assessments hub to support ?tab=templates|runs and detail routes.
    if (pathname.startsWith('/instructor/assessments-hub')) {
      if (pathname.startsWith('/instructor/assessments-hub/templates')) {
        return item.key === 'practiceSets'
      }
      if (pathname.startsWith('/instructor/assessments-hub/runs')) {
        return item.key === 'gradebook'
      }
      if (pathname === '/instructor/assessments-hub') {
        const tab = searchParams.get('tab') || 'templates'
        return (tab === 'runs' && item.key === 'gradebook') || (tab !== 'runs' && item.key === 'practiceSets')
      }
    }

    return pathname === item.href || pathname.startsWith(item.href + '/')
  }
  
  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [pathname, setSidebarOpen])
  
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-y-auto transition-transform duration-200",
        "lg:translate-x-0",
        !sidebarOpen && "-translate-x-full lg:translate-x-0"
      )}>
      <div className="p-5 flex flex-col h-full">
        {/* Mobile header */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <span className="text-lg font-semibold">{tNav('panelTitle')}</span>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Mode switcher */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2">{tNav('modesLabel')}</div>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-muted/40">
            {(['prepare', 'teach', 'review'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setInstructorMode(mode)
                  // Navigate to the first route of the selected mode
                  if (mode === 'prepare') {
                    router.push('/instructor/courses')
                  } else if (mode === 'teach') {
                    router.push('/instructor/assessments-hub?tab=templates')
                  } else if (mode === 'review') {
                    router.push('/instructor/students')
                  }
                }}
                className={cn(
                  'px-2 py-1.5 rounded-md text-xs font-semibold transition-colors',
                  instructorMode === mode
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tNav(`modes.${mode}`)}
              </button>
            ))}
          </div>

          {instructorMode === 'prepare' && !activeCourseId && (
            <div className="mt-2 text-xs text-muted-foreground">
              <Link href="/instructor/courses" className="hover:underline">
                {tNav('selectCourseHint')}
              </Link>
            </div>
          )}
        </div>
        
        {/* Main Navigation */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const disabled = Boolean(item.requiresCourse && !activeCourseId)
            const className = cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
              isActive(item)
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              disabled && 'opacity-60 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground'
            )

            if (disabled) {
              return (
                <div key={item.key} className={className} aria-disabled="true">
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tNav(`items.${item.key}`)}</span>
                </div>
              )
            }

            return (
              <Link key={item.key} href={item.href} className={className}>
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{tNav(`items.${item.key}`)}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
    </>
  )
}

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isHydrated) return

    if (!user) {
      router.push('/login')
    } else if (user.role !== 'instructor' && user.role !== 'admin') {
      router.push('/lessons')
    }
  }, [isHydrated, user, router])

  if (!isHydrated || !user || (user.role !== 'instructor' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1">
        <InstructorSidebar />
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}
