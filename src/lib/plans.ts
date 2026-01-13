/**
 * Plan Awareness System for Edusistent
 * 
 * This is a UI-only plan system for demos and early pilots.
 * NO PAYMENTS - all gating is informational only.
 * 
 * Plans:
 * - Free: Demo mode, manual concepts only
 * - Pro: Full AI features (pilot access, manual onboarding)
 * - Enterprise: Contact us / Coming soon
 */

export type PlanType = 'free' | 'pro' | 'enterprise';

export interface Plan {
  id: PlanType;
  name: string;
  description: string;
  features: string[];
  limitations: string[];
  cta: string;
  ctaAction: 'upgrade' | 'contact' | 'current';
}

export const PLANS: Record<PlanType, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic course creation',
    features: [
      'Create up to 2 courses',
      'Add lessons with text or video URLs',
      'Manual concept tagging',
      'Basic student enrollment',
      'View student progress',
    ],
    limitations: [
      'No automatic content analysis',
      'No AI concept extraction',
      'No assessment generation',
      'Limited to 10 students per course',
    ],
    cta: 'Current Plan',
    ctaAction: 'current',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Full mastery-based course management',
    features: [
      'Unlimited courses',
      'AI content analysis',
      'Automatic concept extraction',
      'AI assessment generation',
      'Mastery tracking per concept',
      'Unlimited students',
      'Priority support',
    ],
    limitations: [],
    cta: 'Request Early Access',
    ctaAction: 'upgrade',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for institutions',
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantees',
      'On-premise deployment',
      'Custom AI training',
    ],
    limitations: [],
    cta: 'Contact Us',
    ctaAction: 'contact',
  },
};

// Feature gating by plan
export interface FeatureGate {
  feature: string;
  requiredPlan: PlanType;
  description: string;
  upgradeMessage: string;
}

export const FEATURE_GATES: Record<string, FeatureGate> = {
  contentAnalysis: {
    feature: 'Content Analysis',
    requiredPlan: 'pro',
    description: 'Automatically analyze lesson content',
    upgradeMessage: 'AI content analysis is available in Pro (Early Access)',
  },
  conceptExtraction: {
    feature: 'Concept Extraction',
    requiredPlan: 'pro',
    description: 'Extract key concepts from lessons',
    upgradeMessage: 'Automatic concept extraction is available in Pro (Early Access)',
  },
  assessmentGeneration: {
    feature: 'Assessment Generation',
    requiredPlan: 'pro',
    description: 'Generate practice questions from content',
    upgradeMessage: 'AI assessment generation is available in Pro (Early Access)',
  },
  unlimitedCourses: {
    feature: 'Unlimited Courses',
    requiredPlan: 'pro',
    description: 'Create unlimited courses',
    upgradeMessage: 'Unlimited courses available in Pro (Early Access)',
  },
  unlimitedStudents: {
    feature: 'Unlimited Students',
    requiredPlan: 'pro',
    description: 'Enroll unlimited students',
    upgradeMessage: 'Unlimited students available in Pro (Early Access)',
  },
  customIntegrations: {
    feature: 'Custom Integrations',
    requiredPlan: 'enterprise',
    description: 'LMS and custom integrations',
    upgradeMessage: 'Custom integrations available in Enterprise (Contact us)',
  },
};

// Check if user has access to a feature
export function hasFeatureAccess(userPlan: PlanType, requiredPlan: PlanType): boolean {
  const planHierarchy: PlanType[] = ['free', 'pro', 'enterprise'];
  return planHierarchy.indexOf(userPlan) >= planHierarchy.indexOf(requiredPlan);
}

// Get upgrade message for a feature
export function getUpgradeMessage(featureKey: string): string {
  return FEATURE_GATES[featureKey]?.upgradeMessage || 'This feature requires an upgrade';
}

// For demo purposes, default all instructors to 'pro' plan
// In production, this would come from the backend
export function getDefaultPlan(role: string): PlanType {
  // During pilot phase, all instructors get Pro access
  if (role === 'instructor' || role === 'admin') {
    return 'pro';
  }
  return 'free';
}

// UI helper messages
export const PLAN_MESSAGES = {
  pilotPhase: 'We are onboarding instructors manually during early access.',
  requestAccess: 'Request early access to unlock Pro features.',
  contactEnterprise: 'Contact us for enterprise solutions.',
  freeLimitation: 'Free plan limitation',
  proFeature: 'Pro feature (Early Access)',
  enterpriseFeature: 'Enterprise feature (Coming soon)',
};
