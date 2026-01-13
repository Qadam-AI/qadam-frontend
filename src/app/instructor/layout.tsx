'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Navbar } from '../_components/navbar'
import { Footer } from '../_components/footer'
import Link from 'next/link'
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  Settings,
  GraduationCap,
  ChevronRight,
  Link2,
  FileText,
  Target,
  Sparkles,
  Crown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

// Core instructor navigation - always visible (Path B flow)
const instructorNavItems = [
  { href: '/instructor', icon: BarChart3, label: 'Dashboard', exact: true },
  { href: '/instructor/courses', icon: BookOpen, label: 'My Courses' },
  { href: '/instructor/ai-tools', icon: Sparkles, label: 'Content Structuring' },
  { href: '/instructor/mastery', icon: Target, label: 'Mastery Overview' },
  { href: '/instructor/students', icon: Users, label: 'Students' },
]

// Tools with feature flags
const toolsNavItems = [
  { href: '/instructor/assessments', icon: FileText, label: 'Assessments', enabled: true },
].filter(item => item.enabled)

const settingsNavItems = [
  { href: '/instructor/settings', icon: Settings, label: 'Settings' },
]

function InstructorSidebar() {
  const pathname = usePathname()
  
  // Fetch current subscription
  const { data: subscription } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/subscriptions/my')
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
      case 'free': return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'pro': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'team': return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
      case 'enterprise': return 'bg-purple-500/10 text-purple-600 border-purple-500/20'
      default: return 'bg-muted text-muted-foreground'
    }
  }
  
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r bg-background hidden lg:block overflow-y-auto">
      <div className="p-6 flex flex-col h-full">
        
        {/* Main Navigation */}
        <nav className="space-y-1">
          {instructorNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive(item.href, item.exact)
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        
        {/* Tools Section */}
        <div className="mt-6">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tools</p>
          <nav className="space-y-1">
            {toolsNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Settings Section */}
        <div className="mt-6">
          <nav className="space-y-1">
            {settingsNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Current Plan - at bottom */}
        <div className="mt-auto pt-4 border-t">
          <Link href="/pricing" className="block">
            <div className={cn(
              "px-3 py-2 rounded-lg border transition-colors hover:bg-muted/50",
              subscription?.plan ? getPlanColor(subscription.plan.name) : 'bg-muted'
            )}>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Current Plan</span>
              </div>
              <div className="mt-1 font-medium">
                {subscription?.plan?.display_name || 'Starter'}
              </div>
              {subscription?.plan?.name !== 'enterprise' && (
                <div className="text-xs mt-1 opacity-70">
                  Click to upgrade
                </div>
              )}
            </div>
          </Link>
        </div>
      </div>
    </aside>
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <InstructorSidebar />
        <main className="flex-1 p-6 lg:p-8 lg:ml-64">
          <div className="container max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
