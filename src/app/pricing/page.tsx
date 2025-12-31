'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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
  free: <Star className="h-8 w-8 text-gray-500" />,
  pro: <Zap className="h-8 w-8 text-blue-500" />,
  premium: <Crown className="h-8 w-8 text-yellow-500" />,
  enterprise: <Rocket className="h-8 w-8 text-purple-500" />,
}

const PLAN_COLORS: Record<string, string> = {
  free: 'from-gray-500 to-gray-600',
  pro: 'from-blue-500 to-cyan-600',
  premium: 'from-yellow-500 to-orange-600',
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
  const [isYearly, setIsYearly] = useState(false)

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
    const features = [
      { 
        name: `${plan.max_courses === 0 ? 'Unlimited' : plan.max_courses} Courses`, 
        included: true,
        icon: <BookOpen className="h-4 w-4" />
      },
      { 
        name: `${plan.max_lessons_per_course} Lessons per Course`, 
        included: true,
        icon: <ChevronRight className="h-4 w-4" />
      },
      { 
        name: `${formatBytes(plan.max_storage_bytes)} Storage`, 
        included: true,
        icon: <HardDrive className="h-4 w-4" />
      },
      { 
        name: `${plan.max_tasks_per_month} AI Tasks/month`, 
        included: plan.max_tasks_per_month > 0,
        icon: <Brain className="h-4 w-4" />
      },
      { 
        name: `${plan.max_students_per_course === 0 ? 'Unlimited' : plan.max_students_per_course} Students per Course`, 
        included: plan.max_students_per_course > 0 || plan.name !== 'free',
        icon: <Users className="h-4 w-4" />
      },
    ]

    // Add feature flags
    if (plan.features) {
      if (plan.features.priority_support) {
        features.push({ name: 'Priority Support', included: true, icon: <Star className="h-4 w-4" /> })
      }
      if (plan.features.advanced_analytics) {
        features.push({ name: 'Advanced Analytics', included: true, icon: <Zap className="h-4 w-4" /> })
      }
      if (plan.features.custom_branding) {
        features.push({ name: 'Custom Branding', included: true, icon: <Sparkles className="h-4 w-4" /> })
      }
      if (plan.features.api_access) {
        features.push({ name: 'API Access', included: true, icon: <Rocket className="h-4 w-4" /> })
      }
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

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4">
          <Label className={!isYearly ? 'font-semibold' : 'text-muted-foreground'}>Monthly</Label>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <Label className={isYearly ? 'font-semibold' : 'text-muted-foreground'}>
            Yearly
            <Badge variant="default" className="ml-2 bg-green-500">Save 20%</Badge>
          </Label>
        </div>
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
            const price = isYearly ? plan.price_yearly : plan.price_monthly
            const monthlyEquivalent = isYearly ? plan.price_yearly / 12 : plan.price_monthly
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
                      {price === 0 ? (
                        <div className="text-4xl font-bold">Free</div>
                      ) : (
                        <>
                          <div className="text-4xl font-bold">
                            {formatPrice(monthlyEquivalent, plan.currency)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            per month{isYearly && ', billed yearly'}
                          </p>
                          {isYearly && (
                            <p className="text-sm text-green-600 font-medium mt-1">
                              Save {formatPrice(plan.price_monthly * 12 - plan.price_yearly, plan.currency)}/year
                            </p>
                          )}
                        </>
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
                    ) : plan.price_monthly === 0 ? (
                      <Button className="w-full" variant="outline" asChild>
                        <Link href="/register">Get Started</Link>
                      </Button>
                    ) : (
                      <Button 
                        className={`w-full ${isPopular ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                        onClick={() => toast.info('Payment integration coming soon!')}
                      >
                        {currentPlanId ? 'Upgrade' : 'Subscribe'}
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
              <CardTitle className="text-lg">Can I switch plans anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. When upgrading, you&apos;ll be charged the prorated difference. When downgrading, the new rate applies at your next billing cycle.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">What happens to my data if I cancel?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your courses and content remain accessible in read-only mode. You can export your data anytime. After 30 days of cancellation, you can reactivate your account with all data intact.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Do you offer educational discounts?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! We offer special discounts for educators, students, and non-profit organizations. Contact our support team with proof of eligibility to receive your discount code.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans. All payments are processed securely through Stripe.
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
