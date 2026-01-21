/**
 * LLM Service Hook
 * 
 * Checks if the LLM service is available and handles unavailability gracefully.
 * Used to disable AI features when the service is down.
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface LLMHealthResponse {
  status: 'ok' | 'degraded' | 'unavailable' | 'disabled' | 'error';
  service_url: string;
  llm_enabled: boolean;
  api_key_configured: boolean;
  service_reachable: boolean;
  model_operational: boolean;
  response_time_ms?: number;
  message?: string;
  details?: Record<string, unknown>;
}

interface LLMServiceStatus {
  available: boolean;
  status: LLMHealthResponse['status'];
  message: string;
  lastChecked: Date;
  details?: {
    serviceUrl?: string;
    apiKeyConfigured?: boolean;
    serviceReachable?: boolean;
    modelOperational?: boolean;
    responseTimeMs?: number;
  };
}

export function useLLMService() {
  const { data, isLoading, error, refetch } = useQuery<LLMServiceStatus>({
    queryKey: ['llm-service-status'],
    queryFn: async () => {
      try {
        // Try to reach the enhanced LLM health endpoint
        const response = await api.get<LLMHealthResponse>('/llm/health', {
          timeout: 15000, // 15 second timeout (allows for model test)
        });
        
        const healthData = response.data;
        const isAvailable = healthData.status === 'ok';
        
        // Build detailed status
        const status: LLMServiceStatus = {
          available: isAvailable,
          status: healthData.status,
          message: healthData.message || getStatusMessage(healthData.status),
          lastChecked: new Date(),
          details: {
            serviceUrl: healthData.service_url,
            apiKeyConfigured: healthData.api_key_configured,
            serviceReachable: healthData.service_reachable,
            modelOperational: healthData.model_operational,
            responseTimeMs: healthData.response_time_ms,
          },
        };
        
        return status;
      } catch (err) {
        // Network error or backend down
        return {
          available: false,
          status: 'error' as const,
          message: 'Cannot connect to backend server',
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
    status: data?.status ?? 'error',
    isChecking: isLoading,
    message: data?.message ?? 'Checking AI service...',
    lastChecked: data?.lastChecked,
    details: data?.details,
    error,
    refresh: refetch,
  };
}

// Helper to get user-friendly status message
function getStatusMessage(status: LLMHealthResponse['status']): string {
  switch (status) {
    case 'ok':
      return 'AI service is ready';
    case 'degraded':
      return 'AI service is partially available (model may be slow)';
    case 'unavailable':
      return 'AI service is not reachable';
    case 'disabled':
      return 'AI features are disabled by configuration';
    case 'error':
      return 'Error checking AI service status';
    default:
      return 'Unknown AI service status';
  }
}

// Standalone check function for one-off checks
export async function checkLLMServiceAvailability(): Promise<boolean> {
  try {
    const response = await api.get<LLMHealthResponse>('/llm/health', {
      timeout: 15000,
    });
    return response.data?.status === 'ok';
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
  degraded: 'AI service is running slowly',
  apiKeyMissing: 'AI service is not configured (API key missing)',
  serviceUnreachable: 'Cannot connect to AI service',
};
