'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Activity,
  Settings,
  Menu,
  X,
  Brain,
  Blocks,
  MessageSquare,
  BarChart3,
  UsersRound,
  CreditCard,
  Trophy,
  Home
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTranslations } from '@/lib/i18n'

interface NavItem {
  titleKey: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    titleKey: 'overview',
    href: '/admin',
    icon: <LayoutDashboard className="h-5 w-5" />
  },
  {
    titleKey: 'users',
    href: '/admin/users',
    icon: <Users className="h-5 w-5" />
  },
  {
    titleKey: 'messages',
    href: '/admin/messages',
    icon: <MessageSquare className="h-5 w-5" />
  },
  {
    titleKey: 'courses',
    href: '/admin/courses',
    icon: <Blocks className="h-5 w-5" />
  },
  {
    titleKey: 'concepts',
    href: '/admin/concepts',
    icon: <Brain className="h-5 w-5" />
  },
  {
    titleKey: 'communities',
    href: '/admin/communities',
    icon: <UsersRound className="h-5 w-5" />
  },
  {
    titleKey: 'subscriptions',
    href: '/admin/subscriptions',
    icon: <CreditCard className="h-5 w-5" />
  },
  {
    titleKey: 'gamification',
    href: '/admin/gamification',
    icon: <Trophy className="h-5 w-5" />
  },
  {
    titleKey: 'analyticsNav',
    href: '/admin/analytics',
    icon: <BarChart3 className="h-5 w-5" />
  },
  {
    titleKey: 'events',
    href: '/admin/events',
    icon: <FileText className="h-5 w-5" />
  },
  {
    titleKey: 'settings',
    href: '/admin/llm',
    icon: <Settings className="h-5 w-5" />
  },
  {
    titleKey: 'backToLearner',
    href: '/',
    icon: <Home className="h-5 w-5" />
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const t = useTranslations('admin')
  const tNav = useTranslations('nav')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (user?.role !== 'admin' && user?.role !== 'instructor') {
      // Redirect non-admins/instructors back to dashboard
      router.push('/')
    }
  }, [isAuthenticated, user, router])

  // Don't render admin layout for non-admins/instructors
  if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-bold">{t('title')}</h1>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {item.icon}
                {t(item.titleKey)}
              </Link>
            )
          })}
        </nav>
        <Separator />
        <div className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <ThemeToggle />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            asChild
          >
            <Link href="/">{tNav('dashboard')}</Link>
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r bg-background">
            <div className="flex h-16 items-center justify-between px-6">
              <h1 className="text-xl font-bold">{t('title')}</h1>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Separator />
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {item.icon}
                    {t(item.titleKey)}
                  </Link>
                )
              })}
            </nav>
            <Separator />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{user?.name}</span>
                <ThemeToggle />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                asChild
              >
                <Link href="/">{tNav('dashboard')}</Link>
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-16 items-center gap-4 border-b px-6 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">{t('title')}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

