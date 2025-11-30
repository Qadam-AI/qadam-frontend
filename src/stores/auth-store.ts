import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/lib/types'
import { setToken as saveToken, removeToken } from '@/lib/auth'

type AuthState = {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        saveToken(token)
        set({ user, token })
      },
      clear: () => {
        removeToken()
        set({ user: null, token: null })
      },
    }),
    {
      name: 'qadam-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

