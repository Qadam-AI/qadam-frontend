import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || 'https://qadam-backend-production.up.railway.app/',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Track retry count
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: number
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig) => {
    // Get token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('qadam_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for global error handling and retry logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as ExtendedAxiosRequestConfig
    const status = error.response?.status
    const message = (error.response?.data as any)?.detail || error.message || 'Something went wrong'
    
    // Handle token expiry (401)
    if (status === 401) {
      // Clear auth data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('qadam_token')
        localStorage.removeItem('qadam_user')
        
        // Show toast and redirect to login
        toast.error('Your session has expired. Please log in again.', {
          duration: 5000,
          action: {
            label: 'Login',
            onClick: () => {
              window.location.href = '/login'
            }
          }
        })
        
        // Redirect after a short delay
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        }, 2000)
      }
      return Promise.reject(error)
    }
    
    // Handle rate limiting (429)
    if (status === 429) {
      toast.error('Rate limit exceeded. Please wait a moment and try again.', {
        duration: 5000,
      })
      return Promise.reject(error)
    }
    
    // Handle payload too large (413)
    if (status === 413) {
      toast.error('Your code submission is too large. Please reduce its size.', {
        duration: 5000,
      })
      return Promise.reject(error)
    }
    
    // Handle validation errors (422)
    if (status === 422) {
      toast.error(message, {
        description: 'Please check your input and try again.',
        duration: 5000,
      })
      return Promise.reject(error)
    }
    
    // Retry logic ONLY for network errors, NOT for 500 errors (those are server bugs)
    const shouldRetry = !status // Only network errors (no status code)
    
    if (shouldRetry && config && !config._retry) {
      config._retry = 1
      
      // Show retry toast
      toast.loading('Retrying request...', { id: 'retry-toast' })
      
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      try {
        const response = await api.request(config)
        toast.dismiss('retry-toast')
        toast.success('Request succeeded after retry')
        return response
      } catch (retryError) {
        toast.dismiss('retry-toast')
        // Fall through to show error toast
      }
    }
    
    // Show error toast for other errors
    if (status !== 401) { // Already handled above
      const errorTitle = status ? `Error ${status}` : 'Network Error'
      toast.error(errorTitle, {
        description: message,
        duration: 5000,
        action: status && status >= 500 ? {
          label: 'Retry',
          onClick: () => {
            if (config) {
              api.request(config)
            }
          }
        } : undefined
      })
    }
    
    return Promise.reject(error)
  }
)

// ============ AI Chat API Functions ============

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  context?: string
  course_id?: string
  lesson_id?: string
  history?: ChatMessage[]
}

export interface ChatResponse {
  response: string
  suggested_topics: string[]
  confidence: number
}

export interface HintRequest {
  task_prompt: string
  user_code: string
  failures?: { name?: string; expected?: string; received?: string }[]
  hint_level?: number
  concept?: string
}

export interface HintResponse {
  hint: string
  level: number
  remaining_levels: number
  encouragement?: string
}

export interface ExplanationRequest {
  question: string
  correct_answer: string
  student_answer: string
  topic?: string
}

export interface ExplanationResponse {
  explanation: string
  key_concept: string
  tips: string[]
}

/**
 * Ask AI assistant a question
 */
export async function askAI(request: ChatRequest): Promise<ChatResponse> {
  const response = await api.post<ChatResponse>('/api/v1/chat/ask', request)
  return response.data
}

/**
 * Get a progressive hint for a task
 */
export async function getHint(request: HintRequest): Promise<HintResponse> {
  const response = await api.post<HintResponse>('/api/v1/chat/hint', request)
  return response.data
}

/**
 * Get an explanation for a wrong answer
 */
export async function getExplanation(request: ExplanationRequest): Promise<ExplanationResponse> {
  const response = await api.post<ExplanationResponse>('/api/v1/chat/explain', request)
  return response.data
}

export default api

