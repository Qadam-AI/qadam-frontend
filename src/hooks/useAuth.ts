import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { loginResponseSchema } from '@/lib/validation'
import type { LoginRequest } from '@/lib/types'
import { toast } from 'sonner'
import { useRouter, usePathname } from 'next/navigation'

export function useAuth() {
  const { user, token, setAuth, clear } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

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
      try {
        // Simple JWT expiry check (decode payload)
        const payload = JSON.parse(atob(token.split('.')[1]))
        const exp = payload.exp * 1000 // Convert to milliseconds
        
        if (Date.now() >= exp) {
          // Token expired
          logout()
        }
      } catch (e) {
        // Invalid token format, logout
        logout()
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
      const response = await api.get('/auth/me')
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
    isAuthenticated: !!user && !!token,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout,
    refreshUser,
  }
}

