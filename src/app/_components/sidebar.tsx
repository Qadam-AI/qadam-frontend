'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Home, Code, BookOpen, History, X, Settings, User } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { useTranslations } from '@/lib/i18n'
import { XPBadge } from '@/components/XPBadge'

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { user } = useAuth()
  const t = useTranslations('nav')

  const navItems = [
    { href: '/', label: t('dashboard'), icon: Home },
    { href: '/practice', label: t('practice'), icon: Code },
    { href: '/lessons', label: t('lessons'), icon: BookOpen },
    { href: '/attempts', label: t('attempts'), icon: History },
    { href: '/profile', label: t('profile'), icon: User },
  ]

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) { // Only close on mobile (< lg breakpoint)
      setSidebarOpen(false)
    }
  }, [pathname, setSidebarOpen])

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
          
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
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
            
            {(user?.role === 'admin' || user?.role === 'instructor') && (
              <>
                <Separator className="my-2" />
                <Link href="/admin">
                  <Button
                    variant={pathname.startsWith('/admin') ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      pathname.startsWith('/admin') && 'bg-secondary font-medium'
                    )}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {user?.role === 'instructor' ? t('instructor') : t('admin')}
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* XP Progress */}
          <div className="p-4 border-t">
            <XPBadge variant="full" />
          </div>

          <div className="p-4 text-xs text-muted-foreground">
            <p>{t('tagline') || 'Personalized practice to build real mastery.'}</p>
          </div>
        </div>
      </aside>
    </>
  )
}

