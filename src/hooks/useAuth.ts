import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { loginResponseSchema } from '@/lib/validation'
import type { LoginRequest } from '@/lib/types'
import { toast } from 'sonner'
import { useRouter, usePathname } from 'next/navigation'

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null

    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function useAuth() {
  const { user, token, setAuth, clear } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(() => useAuthStore.persist.hasHydrated())
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true)
    }

    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await api.post('/auth/login', credentials)
      return loginResponseSchema.parse(response.data)
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      toast.success('Welcome back!')
      if (data.user.role === 'instructor' || data.user.role === 'admin') {
        router.push('/instructor')
      } else {
        router.push('/')
      }
    },
    onError: () => {
      toast.error('Invalid credentials')
    },
  })

  // Check for token expiry periodically
  useEffect(() => {
    if (!token) return

    const checkTokenValidity = () => {
      const payload = decodeJwtPayload(token)
      if (!payload) {
        return
      }

      const exp = payload.exp
      if (typeof exp === 'number' && Number.isFinite(exp)) {
        const expMs = exp * 1000
        if (Date.now() >= expMs) {
          logout()
        }
      }
    }

    // Check immediately
    checkTokenValidity()

    // Check every minute
    const interval = setInterval(checkTokenValidity, 60000)

    return () => clearInterval(interval)
  }, [token])

  const logout = () => {
    clear()
    
    // Only redirect if not already on login page
    if (pathname !== '/login') {
      router.push('/login')
    }
  }

  const refreshUser = async () => {
    try {
      const response = await api.get('/users/me')
      if (response.data) {
        setAuth(response.data, token!)
      }
    } catch {
      // Ignore errors - user will see stale data but can refresh manually
    }
  }

  return {
    user,
    token,
    isHydrated,
    isAuthenticated: !!user && !!token,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout,
    refreshUser,
  }
}

