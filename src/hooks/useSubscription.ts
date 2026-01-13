/**
 * Subscription Features Hook
 * 
 * Checks user's subscription plan and available features.
 * Used to gate Pro/Team/Enterprise features.
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from './useAuth';

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  features: Record<string, boolean>;
}

interface SubscriptionDetails {
  subscription: {
    id: string;
    status: string;
    plan_id: string;
  };
  plan: SubscriptionPlan;
  usage: Record<string, number>;
  limits: Record<string, number>;
}

interface UploadAccess {
  has_upload_access: boolean;
  message: string;
  allowed_types: string[];
  max_size_bytes: number;
}

export function useSubscription() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading, error } = useQuery<SubscriptionDetails | null>({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/subscriptions/my');
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: isAuthenticated,
    staleTime: 60000, // 1 minute
  });

  const planName = data?.plan?.name || 'free';
  const displayName = data?.plan?.display_name || 'Starter';
  const features = data?.plan?.features || {};

  // Plan tier checks
  const isFree = planName === 'free';
  const isPro = planName === 'pro';
  const isTeam = planName === 'team';
  const isEnterprise = planName === 'enterprise';
  const isProPlus = isPro || isTeam || isEnterprise;

  return {
    subscription: data,
    planName,
    displayName,
    features,
    isFree,
    isPro,
    isTeam,
    isEnterprise,
    isProPlus,
    isLoading,
    error,
  };
}

export function useUploadAccess() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading, error, refetch } = useQuery<UploadAccess>({
    queryKey: ['upload-access'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/uploads/check-access');
        return res.data;
      } catch {
        return {
          has_upload_access: false,
          message: 'Unable to check upload access',
          allowed_types: [],
          max_size_bytes: 0,
        };
      }
    },
    enabled: isAuthenticated,
    staleTime: 60000, // 1 minute
  });

  return {
    hasUploadAccess: data?.has_upload_access ?? false,
    message: data?.message ?? '',
    allowedTypes: data?.allowed_types ?? [],
    maxSizeBytes: data?.max_size_bytes ?? 0,
    isLoading,
    error,
    refetch,
  };
}

// Feature-specific hooks
export function useFeature(featureName: string) {
  const { features, isProPlus, isLoading } = useSubscription();
  
  // Some features are plan-tier based, others are explicit
  const hasFeature = features[featureName] ?? false;
  
  return {
    hasFeature,
    isProPlus,
    isLoading,
  };
}

// Constants for feature gating messages
export const UPGRADE_MESSAGES = {
  fileUpload: 'File upload is available on Pro, Team, and Enterprise plans.',
  fileUploadCTA: 'Upgrade to Pro to upload PDF, PPTX, and DOCX files for automatic concept extraction.',
  conceptExtraction: 'Auto concept extraction from files requires Pro or higher.',
  advancedAnalytics: 'Advanced analytics are available on Team and Enterprise plans.',
  multiInstructor: 'Multiple instructors are available on Team and Enterprise plans.',
} as const;
