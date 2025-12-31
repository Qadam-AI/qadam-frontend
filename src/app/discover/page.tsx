'use client'

import { Navbar } from '@/app/_components/navbar'
import { Sidebar } from '@/app/_components/sidebar'
import { Footer } from '@/app/_components/footer'
import { AuthGuard } from '@/app/_components/auth-guard'
import { CourseDiscovery } from '@/components/courses/course-discovery'

export default function DiscoverPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 p-8 overflow-y-auto lg:ml-64">
            <div className="max-w-7xl mx-auto">
              <CourseDiscovery />
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </AuthGuard>
  )
}
