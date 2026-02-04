import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type InstructorMode = 'prepare' | 'teach' | 'review'

type UIState = {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  instructorMode: InstructorMode
  activeCourseId: string | null
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setInstructorMode: (mode: InstructorMode) => void
  setActiveCourseId: (courseId: string | null) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'system',
      instructorMode: 'prepare',
      activeCourseId: null,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      setInstructorMode: (mode) => set({ instructorMode: mode }),
      setActiveCourseId: (courseId) => set({ activeCourseId: courseId }),
    }),
    {
      name: 'edusistent-ui',
    }
  )
)

