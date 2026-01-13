/**
 * LLM Service Hook
 * 
 * Checks if the LLM service is available and handles unavailability gracefully.
 * Used to disable AI features when the service is down.
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface LLMServiceStatus {
  available: boolean;
  message: string;
  lastChecked: Date;
}

export function useLLMService() {
  const { data, isLoading, error, refetch } = useQuery<LLMServiceStatus>({
    queryKey: ['llm-service-status'],
    queryFn: async () => {
      try {
        // Try to reach the LLM health endpoint via backend proxy
        const response = await api.get('/api/v1/llm/health', {
          timeout: 5000, // 5 second timeout
        });
        
        if (response.data?.status === 'healthy' || response.data?.status === 'ok') {
          return {
            available: true,
            message: 'AI service is ready',
            lastChecked: new Date(),
          };
        }
        
        return {
          available: false,
          message: 'AI service is not responding correctly',
          lastChecked: new Date(),
        };
      } catch (err) {
        return {
          available: false,
          message: 'AI analysis service is currently unavailable',
          lastChecked: new Date(),
        };
      }
    },
    // Check every 30 seconds
    refetchInterval: 30000,
    // Don't refetch on window focus (too aggressive)
    refetchOnWindowFocus: false,
    // Keep stale data while refetching
    staleTime: 25000,
    // Retry once before giving up
    retry: 1,
  });

  return {
    isAvailable: data?.available ?? false,
    isChecking: isLoading,
    message: data?.message ?? 'Checking AI service...',
    lastChecked: data?.lastChecked,
    error,
    refresh: refetch,
  };
}

// Standalone check function for one-off checks
export async function checkLLMServiceAvailability(): Promise<boolean> {
  try {
    const response = await api.get('/api/v1/llm/health', {
      timeout: 5000,
    });
    return response.data?.status === 'healthy' || response.data?.status === 'ok';
  } catch {
    return false;
  }
}

// Message constants
export const LLM_MESSAGES = {
  unavailable: 'AI analysis service is currently unavailable',
  checking: 'Checking AI service availability...',
  available: 'AI service is ready',
  retrying: 'Retrying connection to AI service...',
  disabled: 'AI features are disabled',
};
