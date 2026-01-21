'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Home, 
  Code, 
  BookOpen, 
  History, 
  X, 
  Settings, 
  User,
  Users,
  Trophy,
  Map,
  BarChart3,
  Bookmark,
  RefreshCcw,
  FileText,
  UsersRound,
  Search,
  CreditCard,
  PlusCircle,
  Shield,
  GraduationCap
} from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { useTranslations } from '@/lib/i18n'
import { XPBadge } from '@/components/XPBadge'
import { FEATURES } from '@/lib/feature-flags'

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { user } = useAuth()
  const t = useTranslations('nav')

  // Check if user is on instructor pages
  const isInstructorContext = pathname.startsWith('/instructor')
  // For instructors in instructor context, hide learner items
  const isInstructor = user?.role === 'instructor' || user?.role === 'admin'

  // Core learning items - hidden for instructors when in instructor panel
  const coreNavItems = (isInstructorContext && isInstructor) ? [] : [
    { href: '/', label: t('dashboard'), icon: Home },
    { href: '/courses', label: 'My Courses', icon: BookOpen },
    { href: '/practice', label: t('practice'), icon: Code },
    { href: '/attempts', label: t('attempts'), icon: History },
  ]

  // Instructor items - link directly to instructor panel
  const instructorNavItems = [
    { href: '/instructor', label: 'Instructor Panel', icon: GraduationCap },
  ]

  // Feature items - controlled by feature flags, hidden in instructor context
  const featureNavItems = (isInstructorContext && isInstructor) ? [] : [
    { href: '/learning-paths', label: 'Learning Paths', icon: Map, enabled: FEATURES.learningPaths },
    { href: '/communities', label: 'Communities', icon: Users, enabled: FEATURES.communities },
    { href: '/collaborate', label: 'Collaboration', icon: UsersRound, enabled: FEATURES.collaboration },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, enabled: FEATURES.leaderboard },
    { href: '/review', label: 'Spaced Review', icon: RefreshCcw, enabled: FEATURES.spacedRepetition },
    { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark, enabled: FEATURES.bookmarks },
    { href: '/study-guides', label: 'Study Guides', icon: FileText, enabled: FEATURES.studyGuides },
    { href: '/code-review', label: 'Code Review', icon: Code, enabled: FEATURES.aiCodeReview },
  ].filter(item => item.enabled)

  // User items - empty in instructor context since instructor layout has its own sidebar
  const userNavItems = (isInstructorContext && isInstructor) ? [] : [
    { href: '/analytics', label: 'My Analytics', icon: BarChart3, enabled: true },
    { href: '/profile', label: t('profile'), icon: User, enabled: FEATURES.profile },
    { href: '/pricing', label: 'Subscription', icon: CreditCard, enabled: FEATURES.subscription },
  ].filter(item => item.enabled)

  // For instructors in the instructor panel, don't render the main sidebar at all
  // since the instructor layout has its own dedicated sidebar
  const hideMainSidebar = isInstructorContext && isInstructor

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) { // Only close on mobile (< lg breakpoint)
      setSidebarOpen(false)
    }
  }, [pathname, setSidebarOpen])

  // For instructors in the instructor panel, don't render the main sidebar
  // The instructor layout has its own dedicated sidebar
  if (hideMainSidebar) {
    return null
  }

  return (
    <>
      {/* Mobile overlay - only show when sidebar is open on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform duration-200',
        // On mobile: hide by default, show when open
        // On desktop (lg+): always visible
        'lg:translate-x-0',
        !sidebarOpen && '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 lg:hidden">
            <span className="text-lg font-semibold">Menu</span>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Separator className="lg:hidden" />
          
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {/* Core Learning - only show if items exist */}
            {coreNavItems.length > 0 && (
              <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Learning</p>
            )}
            {coreNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      isActive && 'bg-secondary font-medium'
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}

            {/* Features - only show section if there are enabled features */}
            {featureNavItems.length > 0 && (
              <>
                <Separator className="my-3" />
                <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Features</p>
                {featureNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start text-sm',
                          isActive && 'bg-secondary font-medium'
                        )}
                        size="sm"
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  )
                })}
              </>
            )}

            {/* User - only show if there are items */}
            {userNavItems.length > 0 && (
              <>
                <Separator className="my-3" />
                <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Account</p>
                {userNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start',
                          isActive && 'bg-secondary font-medium'
                        )}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  )
                })}
              </>
            )}
            
            {/* Instructor Panel - for instructors and admins, not on instructor pages */}
            {isInstructor && !isInstructorContext && (
              <>
                <Separator className="my-3" />
                <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Teach</p>
                {instructorNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start',
                          isActive && 'bg-secondary font-medium'
                        )}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  )
                })}
              </>
            )}
            
            {/* Admin Dashboard - for admins only, hidden in demo mode */}
            {user?.role === 'admin' && FEATURES.adminPanel && (
              <>
                <Separator className="my-3" />
                <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Platform</p>
                <Link href="/admin">
                  <Button
                    variant={pathname.startsWith('/admin') ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      pathname.startsWith('/admin') && 'bg-secondary font-medium'
                    )}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {t('admin')}
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* XP Progress - hidden in demo mode */}
          {FEATURES.xpBadge && (
            <div className="p-4 border-t">
              <XPBadge variant="full" />
            </div>
          )}

          <div className="p-4 text-xs text-muted-foreground">
            <p>Mastery-based learning for real understanding.</p>
          </div>
        </div>
      </aside>
    </>
  )
}