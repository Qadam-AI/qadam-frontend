'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Check, X, Zap, Crown, Rocket, Sparkles, Users,
  BookOpen, HardDrive, Brain, Star, ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Plan {
  id: string
  name: string
  display_name: string
  description?: string
  price_monthly: number
  price_yearly: number
  currency: string
  max_courses: number
  max_lessons_per_course: number
  max_storage_bytes: number
  max_tasks_total: number
  max_tasks_per_month: number
  max_students_per_course: number
  max_tasks_per_student: number
  features: Record<string, boolean>
  is_active: boolean
  sort_order: number
}

interface Subscription {
  id: string
  plan_id: string
  plan: Plan
  status: string
  billing_cycle: string
  current_period_start: string
  current_period_end: string
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Star className="h-8 w-8 text-green-500" />,
  pro: <Zap className="h-8 w-8 text-blue-500" />,
  team: <Users className="h-8 w-8 text-orange-500" />,
  enterprise: <Rocket className="h-8 w-8 text-purple-500" />,
}

const PLAN_COLORS: Record<string, string> = {
  free: 'from-green-500 to-emerald-600',
  pro: 'from-blue-500 to-cyan-600',
  team: 'from-orange-500 to-amber-600',
  enterprise: 'from-purple-500 to-pink-600',
}

const formatBytes = (bytes: number) => {
  if (bytes >= 1073741824) return `${Math.round(bytes / 1073741824)} GB`
  if (bytes >= 1048576) return `${Math.round(bytes / 1048576)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

const formatPrice = (cents: number, currency: string = 'USD') => {
  const dollars = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(dollars)
}

export default function PricingPage() {
  const { user } = useAuth()

  // Fetch plans
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await api.get<Plan[]>('/api/v1/subscriptions/plans')
      return res.data.sort((a, b) => a.sort_order - b.sort_order)
    },
  })

  // Fetch current subscription
  const { data: subscription } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      const res = await api.get<Subscription>('/api/v1/subscriptions/my')
      return res.data
    },
    enabled: !!user,
  })

  const currentPlanId = subscription?.plan_id

  const getFeaturesList = (plan: Plan) => {
    const features = []
    
    // Core limits based on plan
    if (plan.name === 'free') {
      features.push(
        { name: 'Up to 10 students total', included: true, icon: <Users className="h-4 w-4" /> },
        { name: '1 active course', included: true, icon: <BookOpen className="h-4 w-4" /> },
        { name: 'Manual concept creation', included: true, icon: <ChevronRight className="h-4 w-4" /> },
        { name: 'AI questions (template-based)', included: true, icon: <Brain className="h-4 w-4" /> },
        { name: 'Basic mastery tracking', included: true, icon: <Star className="h-4 w-4" /> },
        { name: 'Community support', included: true, icon: <Users className="h-4 w-4" /> },
        { name: 'Upload course materials', included: false, icon: <HardDrive className="h-4 w-4" /> },
        { name: 'Auto concept extraction', included: false, icon: <Sparkles className="h-4 w-4" /> },
      )
    } else if (plan.name === 'pro') {
      features.push(
        { name: 'Up to 30 students per course', included: true, icon: <Users className="h-4 w-4" /> },
        { name: 'Up to 3 active courses', included: true, icon: <BookOpen className="h-4 w-4" /> },
        { name: 'Up to 90 students total', included: true, icon: <Users className="h-4 w-4" /> },
        { name: 'Upload PDF, slides, video', included: true, icon: <HardDrive className="h-4 w-4" /> },
        { name: 'Auto concept extraction', included: true, icon: <Sparkles className="h-4 w-4" /> },
        { name: 'AI questions aligned to content', included: true, icon: <Brain className="h-4 w-4" /> },
        { name: 'Adaptive difficulty', included: true, icon: <Zap className="h-4 w-4" /> },
        { name: 'Advanced mastery tracking', included: true, icon: <Star className="h-4 w-4" /> },
        { name: 'Progressive hint system', included: true, icon: <ChevronRight className="h-4 w-4" /> },
        { name: 'Priority support', included: true, icon: <Crown className="h-4 w-4" /> },
        { name: '+10 students: $7/month add-on', included: true, icon: <Users className="h-4 w-4" /> },
      )
    } else if (plan.name === 'team') {
      features.push(
        { name: 'Up to 300 students total', included: true, icon: <Users className="h-4 w-4" /> },
        { name: 'Up to 10 active courses', included: true, icon: <BookOpen className="h-4 w-4" /> },
        { name: 'Up to 10 instructors', included: true, icon: <Users className="h-4 w-4" /> },
        { name: 'Shared content library', included: true, icon: <HardDrive className="h-4 w-4" /> },
        { name: 'Instructor collaboration', included: true, icon: <Users className="h-4 w-4" /> },
        { name: 'Cohort-level analytics', included: true, icon: <Zap className="h-4 w-4" /> },
        { name: 'Centralized student management', included: true, icon: <Star className="h-4 w-4" /> },
        { name: 'Higher AI usage quota', included: true, icon: <Brain className="h-4 w-4" /> },
        { name: 'Email + onboarding support', included: true, icon: <Crown className="h-4 w-4" /> },
      )
    } else if (plan.name === 'enterprise') {
      features.push(
        { name: 'Unlimited students', included: true, icon: <Users className="h-4 w-4" /> },
        { name: 'Unlimited courses', included: true, icon: <BookOpen className="h-4 w-4" /> },
        { name: 'Unlimited instructors', included: true, icon: <Users className="h-4 w-4" /> },
        { name: 'Faculty / department structure', included: true, icon: <Rocket className="h-4 w-4" /> },
        { name: 'Advanced admin dashboards', included: true, icon: <Zap className="h-4 w-4" /> },
        { name: 'Custom AI policies', included: true, icon: <Brain className="h-4 w-4" /> },
        { name: 'SSO / institutional auth', included: true, icon: <Star className="h-4 w-4" /> },
        { name: 'Private / on-prem deployment', included: true, icon: <HardDrive className="h-4 w-4" /> },
        { name: 'SLA & dedicated support', included: true, icon: <Crown className="h-4 w-4" /> },
      )
    }

    return features
  }

  return (
    <div className="container mx-auto py-8 space-y-12">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-3xl mx-auto"
      >
        <Badge variant="secondary" className="mb-4">Pricing</Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Choose the plan that fits your needs. Start free and upgrade as you grow.
        </p>
      </motion.div>

      {/* Plans Grid */}
      {plansLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[500px] w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans?.map((plan, index) => {
            const isCurrentPlan = currentPlanId === plan.id
            const price = plan.price_monthly
            const isPopular = plan.name === 'pro'

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative h-full flex flex-col ${isPopular ? 'border-2 border-blue-500 shadow-xl' : ''} ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-500 hover:bg-blue-600">Most Popular</Badge>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-green-500 hover:bg-green-600">Current Plan</Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${PLAN_COLORS[plan.name] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white`}>
                      {PLAN_ICONS[plan.name] || <Star className="h-8 w-8" />}
                    </div>
                    <CardTitle className="text-xl">{plan.display_name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    {/* Price */}
                    <div className="text-center mb-6">
                      {plan.name === 'enterprise' ? (
                        <div>
                          <div className="text-3xl font-bold">Custom</div>
                          <p className="text-sm text-muted-foreground">Annual contracts only</p>
                        </div>
                      ) : price === 0 ? (
                        <div>
                          <div className="text-4xl font-bold">$0</div>
                          <p className="text-sm text-muted-foreground">Free forever</p>
                        </div>
                      ) : (
                        <div>
                          <div className="text-4xl font-bold">
                            {formatPrice(price, plan.currency)}
                          </div>
                          <p className="text-sm text-muted-foreground">per month</p>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3">
                      {getFeaturesList(plan).map((feature, i) => (
                        <li key={i} className={`flex items-center gap-2 text-sm ${feature.included ? '' : 'text-muted-foreground line-through'}`}>
                          {feature.included ? (
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          )}
                          <span>{feature.name}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    {isCurrentPlan ? (
                      <Button className="w-full" variant="outline" disabled>
                        <Check className="h-4 w-4 mr-2" />
                        Current Plan
                      </Button>
                    ) : plan.name === 'free' ? (
                      <Button className="w-full" variant="outline" asChild>
                        <Link href="/register">Get Started Free</Link>
                      </Button>
                    ) : plan.name === 'enterprise' ? (
                      <Button 
                        className="w-full bg-purple-500 hover:bg-purple-600"
                        onClick={() => toast.info('Contact us at sales@edusistent.com for custom pricing')}
                      >
                        Contact Sales
                      </Button>
                    ) : (
                      <Button 
                        className={`w-full ${isPopular ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                        onClick={() => toast.info('Upgrade plan - Contact us to enable your subscription')}
                      >
                        {currentPlanId ? 'Upgrade Plan' : 'Get Started'}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Can I add more students to my Pro plan?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! Pro plan includes up to 90 students total across 3 courses. You can add capacity in blocks of 10 students for $7/month each. This flexibility lets you grow without committing to a higher tier.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">What happens if I exceed my AI usage quota?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                On Pro and Team plans, you&apos;ll receive a notification when approaching your quota. You can purchase additional AI capacity on a pay-as-you-go basis, or wait until the next billing cycle for your quota to reset.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">What&apos;s included in the Starter (Free) plan?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The Starter plan lets you try the full workflow with up to 10 students and 1 course. You can create concepts manually, generate basic AI questions, and track student mastery. It&apos;s designed to let you evaluate the platform before scaling.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">How does Team / Academy differ from Pro?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Team plan is designed for organizations with multiple instructors. It includes shared content libraries, instructor collaboration tools, cohort-level analytics, and centralized student management. Perfect for bootcamps, training centers, and private schools.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">What does Enterprise include?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Enterprise is for universities and large institutions requiring unlimited capacity, faculty/department structures, SSO integration, custom AI policies, and optional private deployment. Contact our sales team for custom pricing based on your institution&apos;s needs.
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-white"
      >
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of instructors and students already using QADAM to create and learn.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">Start for Free</Link>
          </Button>
          <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10" asChild>
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
