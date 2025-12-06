'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
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
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const instructorNavItems = [
  { href: '/instructor', icon: BarChart3, label: 'Dashboard' },
  { href: '/instructor/courses', icon: BookOpen, label: 'My Courses' },
  { href: '/instructor/students', icon: Users, label: 'Students' },
  { href: '/instructor/settings', icon: Settings, label: 'Settings' },
]

function InstructorSidebar() {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r bg-background hidden lg:block">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6 px-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Instructor Panel</span>
        </div>
        <nav className="space-y-1">
          {instructorNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
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
