'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Navbar } from '../_components/navbar'
import { Footer } from '../_components/footer'
import { useUIStore } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  BookOpen, 
  Users, 
  LayoutDashboard, 
  Settings,
  Link2,
  FileText,
  Target,
  Sparkles,
  Crown,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Core instructor navigation (Path B flow)
const instructorNavItems = [
  { href: '/instructor', icon: LayoutDashboard, label: 'Teaching Studio', exact: true },
  { href: '/instructor/courses', icon: BookOpen, label: 'My Courses' },
  { href: '/instructor/ai-tools', icon: Sparkles, label: 'Content Structuring' },
  { href: '/instructor/students', icon: Users, label: 'Students' },
  { href: '/instructor/mastery', icon: Target, label: 'Understanding' },
  { href: '/instructor/assessments-hub', icon: FileText, label: 'Exams & Quizzes' },
  { href: '/instructor/practice-links', icon: Link2, label: 'Practice Links' },
]

const settingsNavItems = [
  { href: '/instructor/settings', icon: Settings, label: 'Settings' },
]

function InstructorSidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  
  // Fetch current subscription
  const { data: subscription } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      try {
        const res = await api.get('/subscriptions/my')
        return res.data
      } catch {
        return null
      }
    },
  })
  
  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }
  
  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'free': return 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900'
      case 'pro': return 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900'
      case 'team': return 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900'
      case 'enterprise': return 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900'
      default: return 'bg-muted text-muted-foreground'
    }
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
          <span className="text-lg font-semibold">Instructor Panel</span>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Main Navigation */}
        <nav className="space-y-0.5">
          {instructorNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                isActive(item.href, item.exact)
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        {/* Settings Section */}
        <div className="mt-8 pt-4 border-t border-border/40">
          <nav className="space-y-0.5">
            {settingsNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Current Plan - at bottom */}
        <div className="mt-auto pt-5 border-t border-border/40">
          <Link href="/pricing" className="block group">
            <div className={cn(
              "px-3 py-3 rounded-md border transition-all group-hover:shadow-sm",
              subscription?.plan ? getPlanColor(subscription.plan.name) : 'bg-muted'
            )}>
              <div className="flex items-center gap-2 mb-1.5">
                <Crown className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Plan</span>
              </div>
              <div className="text-sm font-semibold">
                {subscription?.plan?.display_name || 'Starter'}
              </div>
              {subscription?.plan?.name !== 'enterprise' && (
                <div className="text-xs mt-1 opacity-60">
                  Upgrade available
                </div>
              )}
            </div>
          </Link>
        </div>
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
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (user.role !== 'instructor' && user.role !== 'admin') {
      router.push('/lessons')
    }
  }, [user, router])

  if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
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
