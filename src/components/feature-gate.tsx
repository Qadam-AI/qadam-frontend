'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, Building2, AlertCircle } from 'lucide-react';
import { PlanType, hasFeatureAccess, FEATURE_GATES, PLAN_MESSAGES } from '@/lib/plans';
import { useLLMService, LLM_MESSAGES } from '@/hooks/useLLMService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface FeatureGateProps {
  feature: string;
  userPlan?: PlanType;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wraps content that requires a specific plan level.
 * Shows upgrade prompt if user doesn't have access.
 */
export function FeatureGate({ feature, userPlan = 'pro', children, fallback }: FeatureGateProps) {
  const gate = FEATURE_GATES[feature];
  
  if (!gate) {
    return <>{children}</>;
  }
  
  const hasAccess = hasFeatureAccess(userPlan, gate.requiredPlan);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  return (
    <Card className="border-dashed border-muted-foreground/30">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <Lock className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-2">{gate.upgradeMessage}</p>
        <UpgradeButton plan={gate.requiredPlan} />
      </CardContent>
    </Card>
  );
}

interface UpgradeButtonProps {
  plan: PlanType;
  className?: string;
}

/**
 * Button that opens an informational modal about upgrading.
 * NO PAYMENTS - just information.
 */
export function UpgradeButton({ plan, className }: UpgradeButtonProps) {
  const isPro = plan === 'pro';
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          {isPro ? (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Request Early Access
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4 mr-2" />
              Contact Us
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isPro ? 'Pro Plan — Early Access' : 'Enterprise Solutions'}
          </DialogTitle>
          <DialogDescription>
            {PLAN_MESSAGES.pilotPhase}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {isPro ? (
            <>
              <p className="text-sm text-muted-foreground">
                During our pilot phase, we're manually onboarding instructors.
                This includes:
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Content analysis and concept extraction
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Instructor-controlled concept approval
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Assessment generation from approved concepts
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Per-concept mastery tracking
                </li>
              </ul>
              <div className="pt-4">
                <Button className="w-full" asChild>
                  <a href="mailto:pilot@edusistent.com?subject=Pro Plan Early Access Request">
                    Request Early Access
                  </a>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Enterprise solutions include custom integrations, dedicated support,
                and on-premise deployment options.
              </p>
              <div className="pt-4">
                <Button className="w-full" asChild>
                  <a href="mailto:enterprise@edusistent.com?subject=Enterprise Inquiry">
                    Contact Sales
                  </a>
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface LLMGatedButtonProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
}

/**
 * Button that checks LLM service availability before enabling.
 * Shows clear message when service is unavailable.
 */
export function LLMGatedButton({ 
  onClick, 
  children, 
  className,
  variant = 'default',
  size = 'default',
  disabled = false,
}: LLMGatedButtonProps) {
  const { isAvailable, isChecking, message } = useLLMService();
  
  const isDisabled = disabled || !isAvailable || isChecking;
  
  return (
    <div className="relative">
      <Button 
        onClick={onClick} 
        disabled={isDisabled}
        variant={variant}
        size={size}
        className={className}
      >
        {children}
      </Button>
      {!isAvailable && !isChecking && (
        <div className="absolute -bottom-6 left-0 right-0 text-center">
          <span className="text-xs text-destructive flex items-center justify-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {LLM_MESSAGES.unavailable}
          </span>
        </div>
      )}
    </div>
  );
}

interface PlanBadgeProps {
  plan: PlanType;
}

/**
 * Shows a badge indicating the plan level.
 */
export function PlanBadge({ plan }: PlanBadgeProps) {
  const variants: Record<PlanType, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
    free: { variant: 'outline', label: 'Free' },
    pro: { variant: 'default', label: 'Pro' },
    enterprise: { variant: 'secondary', label: 'Enterprise' },
  };
  
  const { variant, label } = variants[plan];
  
  return (
    <Badge variant={variant}>
      {label}
    </Badge>
  );
}

/**
 * Banner shown at the top of pages during pilot phase.
 * Emphasizes instructor control and manual workflow.
 */
export function PilotBanner() {
  return (
    <div className="bg-primary/5 border border-primary/10 rounded-lg px-4 py-3 flex items-center">
      <Badge variant="outline" className="mr-2 shrink-0">Early Access</Badge>
      <p className="text-sm text-muted-foreground">
        We are onboarding instructors manually. AI suggests concepts — you review and approve.
      </p>
    </div>
  );
}
