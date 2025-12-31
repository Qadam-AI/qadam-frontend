'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
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
  Mail,
  Link2,
  FileText,
  Brain,
  Home
} from 'lucide-react'
import { cn } from '@/lib/utils'

const instructorNavItems = [
  { href: '/instructor', icon: BarChart3, label: 'Dashboard', exact: true },
  { href: '/instructor/courses', icon: BookOpen, label: 'My Courses' },
  { href: '/instructor/students', icon: Users, label: 'Students' },
]

const toolsNavItems = [
  { href: '/instructor/invitations', icon: Mail, label: 'Invitations' },
  { href: '/instructor/join-links', icon: Link2, label: 'Join Links' },
  { href: '/instructor/assessments', icon: FileText, label: 'AI Assessments' },
  { href: '/instructor/transcriptions', icon: Brain, label: 'Transcriptions' },
]

const settingsNavItems = [
  { href: '/instructor/settings', icon: Settings, label: 'Settings' },
  { href: '/', icon: Home, label: 'Back to Learner' },
]

function InstructorSidebar() {
  const pathname = usePathname()
  
  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }
  
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r bg-background hidden lg:block overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6 px-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Instructor Panel</span>
        </div>
        
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
