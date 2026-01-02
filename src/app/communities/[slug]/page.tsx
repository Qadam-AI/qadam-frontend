'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from '@/lib/i18n'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  Users, Lock, Globe, Calendar, Clock, CheckCircle2, XCircle,
  Loader2, ArrowLeft, ShieldCheck, Target, TrendingUp, BookOpen,
  AlertTriangle, Sparkles, Crown, Settings, UserPlus, Mail,
  GraduationCap, Zap, Trophy, Flame
} from 'lucide-react'

interface Rule {
  id: string
  type: string
  label: string
  description: string | null
  config: Record<string, any>
  is_required: boolean
  priority: number
}

interface EligibilityRule {
  rule_id: string
  rule_type: string
  label: string
  status: 'passed' | 'failed' | 'pending'
  current_value: any
  required_value: any
  message: string
}

interface EligibilityCheck {
  is_eligible: boolean
  passed: EligibilityRule[]
  failed: EligibilityRule[]
  pending: EligibilityRule[]
  message: string
}

interface Membership {
  id: string
  status: string
  role: string
  joined_at: string | null
}

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  long_description: string | null
  category: string
  difficulty: string
  visibility: string
  member_count: number
  pending_count: number
  cover_image_url: string | null
  icon_url: string | null
  tags: string[]
  rules: Rule[]
  creator_id: string
  created_at: string
  user_membership: Membership | null
}

const getRuleIcon = (type: string) => {
  const icons: Record<string, any> = {
    MIN_XP: Zap,
    MIN_AVG_MASTERY: TrendingUp,
    MIN_CONCEPT_MASTERY: Target,
    REQUIRED_COURSES: BookOpen,
    REQUIRED_LESSONS: BookOpen,
    MIN_ACCURACY: Trophy,
    MIN_ATTEMPTS: Target,
    MIN_STREAK: Flame,
    MAX_INACTIVITY_DAYS: Clock,
    MIN_WEEKLY_ACTIVITY: Calendar,
    MAX_HINT_USAGE: AlertTriangle,
    START_DATE: Calendar,
    END_DATE: Calendar,
    MANUAL_APPROVAL: ShieldCheck,
    ENTRY_TEST: GraduationCap,
  }
  return icons[type] || ShieldCheck
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'passed': return 'text-green-600 dark:text-green-400'
    case 'failed': return 'text-red-600 dark:text-red-400'
    case 'pending': return 'text-yellow-600 dark:text-yellow-400'
    default: return 'text-muted-foreground'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'passed': return CheckCircle2
    case 'failed': return XCircle
    case 'pending': return Loader2
    default: return AlertTriangle
  }
}

function RuleCard({ rule, eligibility }: { rule: Rule; eligibility?: EligibilityRule }) {
  const RuleIcon = getRuleIcon(rule.type)
  const StatusIcon = eligibility ? getStatusIcon(eligibility.status) : null
  
  return (
    <div className={`p-4 rounded-lg border ${
      eligibility?.status === 'passed' ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30' :
      eligibility?.status === 'failed' ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30' :
      eligibility?.status === 'pending' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30' :
      'border-border bg-card'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          eligibility?.status === 'passed' ? 'bg-green-100 dark:bg-green-900/50' :
          eligibility?.status === 'failed' ? 'bg-red-100 dark:bg-red-900/50' :
          eligibility?.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/50' :
          'bg-primary/10'
        }`}>
          <RuleIcon className={`w-5 h-5 ${
            eligibility?.status === 'passed' ? 'text-green-600 dark:text-green-400' :
            eligibility?.status === 'failed' ? 'text-red-600 dark:text-red-400' :
            eligibility?.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
            'text-primary'
          }`} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{rule.label}</h4>
            {rule.is_required && (
              <Badge variant="outline" className="text-xs">Required</Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            {rule.description || getRuleDescription(rule)}
          </p>
          
          {eligibility && (
            <div className="mt-2 flex items-center gap-2">
              {StatusIcon && (
                <StatusIcon className={`w-4 h-4 ${getStatusColor(eligibility.status)} ${
                  eligibility.status === 'pending' ? 'animate-spin' : ''
                }`} />
              )}
              <span className={`text-sm ${getStatusColor(eligibility.status)}`}>
                {eligibility.message}
              </span>
            </div>
          )}
          
          {eligibility && eligibility.status === 'failed' && eligibility.current_value !== null && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Current: {formatValue(eligibility.current_value)}</span>
                <span>Required: {formatValue(eligibility.required_value)}</span>
              </div>
              <Progress 
                value={Math.min(100, (Number(eligibility.current_value) / Number(eligibility.required_value)) * 100)} 
                className="h-2"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getRuleDescription(rule: Rule): string {
  const config = rule.config
  const descriptions: Record<string, string> = {
    MIN_XP: `Minimum ${config.value} XP required`,
    MIN_AVG_MASTERY: `Average mastery level of ${config.value}% or higher`,
    MIN_CONCEPT_MASTERY: `Master at least ${config.count} concepts at ${config.level}%+`,
    REQUIRED_COURSES: `Complete required courses`,
    REQUIRED_LESSONS: `Complete required lessons`,
    MIN_ACCURACY: `Maintain ${config.value}%+ accuracy`,
    MIN_ATTEMPTS: `Complete at least ${config.value} task attempts`,
    MIN_STREAK: `Achieve a ${config.value}-day learning streak`,
    MAX_INACTIVITY_DAYS: `Be active within the last ${config.value} days`,
    MIN_WEEKLY_ACTIVITY: `${config.value}+ hours of weekly activity`,
    MAX_HINT_USAGE: `Use hints on less than ${config.value}% of tasks`,
    START_DATE: `Opens on ${new Date(config.date).toLocaleDateString()}`,
    END_DATE: `Closes on ${new Date(config.date).toLocaleDateString()}`,
    MANUAL_APPROVAL: `Requires creator approval`,
    ENTRY_TEST: `Pass the entry assessment`,
  }
  return descriptions[rule.type] || 'Membership requirement'
}

function formatValue(value: any): string {
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return String(value)
}

export default function CommunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('communityDetail')
  const slug = params.slug as string
  
  const [showEligibility, setShowEligibility] = useState(false)

  const { data: community, isLoading, error } = useQuery<Community>({
    queryKey: ['community', slug],
    queryFn: async () => {
      const res = await api.get(`/api/v1/communities/${slug}`)
      return res.data
    },
  })

  const { data: eligibility, isLoading: eligibilityLoading } = useQuery<EligibilityCheck>({
    queryKey: ['community-eligibility', slug],
    queryFn: async () => {
      const res = await api.get(`/api/v1/communities/${slug}/eligibility`)
      return res.data
    },
    enabled: showEligibility && !!community && !community.user_membership,
  })

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/v1/communities/${slug}/join`)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['community', slug] })
      if (data.status === 'approved') {
        toast.success(t('welcome'), { description: t('joinedCommunity') })
      } else {
        toast.info(t('requestSubmitted'), { description: t('pendingApproval') })
      }
    },
    onError: (error: any) => {
      toast.error(t('failedToJoin'), { description: error.response?.data?.detail || t('errorOccurred') })
    },
  })

  const leaveMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/v1/communities/${slug}/members/me`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', slug] })
      toast.success(t('leftCommunity'), { description: t('youHaveLeft') })
    },
  })

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-48 w-full rounded-xl mb-6" />
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-4 w-2/3 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error || !community) {
    return (
      <div className="container mx-auto py-16 text-center">
        <XCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-medium mb-2">{t('notFound')}</h2>
        <p className="text-muted-foreground mb-4">
          {t('notFoundDesc')}
        </p>
        <Link href="/communities">
          <Button>{t('browseCommunities')}</Button>
        </Link>
      </div>
    )
  }

  const isMember = community.user_membership?.status === 'approved'
  const isPending = community.user_membership?.status === 'pending'
  const isCreator = community.user_membership?.role === 'creator'

  return (
    <div className="min-h-screen">
      {/* Cover Image */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-primary/20 to-primary/5 relative">
        {community.cover_image_url && (
          <img
            src={community.cover_image_url}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-10">
        {/* Back Button */}
        <Link href="/communities" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          {t('backToCommunities')}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-6 items-start"
        >
          <div className="w-24 h-24 rounded-xl bg-card border shadow-lg flex items-center justify-center">
            {community.icon_url ? (
              <img src={community.icon_url} alt="" className="w-16 h-16 rounded-lg" />
            ) : (
              <GraduationCap className="w-12 h-12 text-primary" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{community.name}</h1>
              {community.visibility === 'private' ? (
                <Lock className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Globe className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge variant="secondary" className="capitalize">
                {community.category.replace('_', ' ')}
              </Badge>
              <Badge className="capitalize">{community.difficulty}</Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                {t('membersCount', { count: community.member_count.toLocaleString() })}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {t('createdOn', { date: new Date(community.created_at).toLocaleDateString() })}
              </div>
            </div>
            
            <p className="text-muted-foreground max-w-2xl">
              {community.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {isCreator && (
              <Link href={`/communities/${slug}/manage`}>
                <Button variant="outline" className="gap-2 w-full">
                  <Settings className="w-4 h-4" />
                  {t('manage')}
                </Button>
              </Link>
            )}
            
            {isMember && !isCreator && (
              <Button
                variant="outline"
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
              >
                {leaveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('leaveCommunity')}
              </Button>
            )}
            
            {isPending && (
              <Button disabled className="gap-2">
                <Clock className="w-4 h-4" />
                {t('pendingApprovalStatus')}
              </Button>
            )}
            
            {!community.user_membership && (
              <Button
                onClick={() => {
                  if (!showEligibility) {
                    setShowEligibility(true)
                  } else if (eligibility?.is_eligible) {
                    joinMutation.mutate()
                  }
                }}
                disabled={joinMutation.isPending || (showEligibility && !eligibility?.is_eligible)}
                className="gap-2"
              >
                {joinMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {showEligibility ? (eligibility?.is_eligible ? t('joinCommunity') : t('notEligible')) : t('checkEligibility')}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Tags */}
        {community.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {community.tags.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        )}

        <Separator className="my-8" />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="about">
              <TabsList>
                <TabsTrigger value="about">{t('about')}</TabsTrigger>
                <TabsTrigger value="requirements">{t('requirements')} ({community.rules.length})</TabsTrigger>
                {isMember && <TabsTrigger value="members">{t('members')}</TabsTrigger>}
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('aboutCommunity')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose dark:prose-invert max-w-none">
                      {community.long_description || community.description || (
                        <p className="text-muted-foreground">{t('noDescription')}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requirements" className="mt-6">
                <div className="space-y-4">
                  {community.rules.length === 0 ? (
                    <Alert>
                      <Sparkles className="w-4 h-4" />
                      <AlertTitle>{t('openCommunity')}</AlertTitle>
                      <AlertDescription>
                        {t('openCommunityDesc')}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t('requirementsDesc')}
                      </p>
                      {community.rules
                        .sort((a, b) => a.priority - b.priority)
                        .map(rule => {
                          const ruleEligibility = eligibility?.passed.find(e => e.rule_id === rule.id) ||
                            eligibility?.failed.find(e => e.rule_id === rule.id) ||
                            eligibility?.pending.find(e => e.rule_id === rule.id)
                          
                          return (
                            <RuleCard
                              key={rule.id}
                              rule={rule}
                              eligibility={showEligibility ? ruleEligibility : undefined}
                            />
                          )
                        })}
                    </>
                  )}
                </div>
              </TabsContent>

              {isMember && (
                <TabsContent value="members" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Community Members</CardTitle>
                      <CardDescription>
                        {community.member_count} members in this community
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm">
                        Member list coming soon...
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Right Column - Eligibility Summary */}
          <div className="space-y-6">
            {/* Eligibility Check Card */}
            {showEligibility && !community.user_membership && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className={eligibility?.is_eligible ? 'border-green-500' : 'border-yellow-500'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {eligibilityLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : eligibility?.is_eligible ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      )}
                      Eligibility Check
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {eligibilityLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ) : eligibility ? (
                      <div className="space-y-4">
                        <p className="text-sm">{eligibility.message}</p>
                        
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {eligibility.passed.length}
                            </p>
                            <p className="text-xs text-muted-foreground">Passed</p>
                          </div>
                          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                              {eligibility.failed.length}
                            </p>
                            <p className="text-xs text-muted-foreground">Failed</p>
                          </div>
                          <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                              {eligibility.pending.length}
                            </p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                          </div>
                        </div>
                        
                        {eligibility.failed.length > 0 && (
                          <Alert variant="destructive">
                            <XCircle className="w-4 h-4" />
                            <AlertTitle>Requirements Not Met</AlertTitle>
                            <AlertDescription>
                              You need to meet {eligibility.failed.length} more requirement(s) to join.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Membership Status Card */}
            {community.user_membership && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isMember ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                    Membership Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className="capitalize">{community.user_membership.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role</span>
                      <span className="flex items-center gap-1 capitalize">
                        {community.user_membership.role === 'creator' && <Crown className="w-4 h-4 text-yellow-500" />}
                        {community.user_membership.role}
                      </span>
                    </div>
                    {community.user_membership.joined_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Joined</span>
                        <span>{new Date(community.user_membership.joined_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> Members
                  </span>
                  <span className="font-medium">{community.member_count.toLocaleString()}</span>
                </div>
                {community.pending_count > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Pending
                    </span>
                    <span className="font-medium">{community.pending_count}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Rules
                  </span>
                  <span className="font-medium">{community.rules.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Creator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Have Questions?</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Creator
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
