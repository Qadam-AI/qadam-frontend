'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  CreditCard, 
  Users, 
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface Subscription {
  id: string
  user_id: string
  user_email?: string
  user_name?: string
  plan: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
}

interface SubscriptionStats {
  total_subscriptions: number
  active_subscriptions: number
  revenue_this_month: number
  churn_rate: number
}

export default function AdminSubscriptions() {
  const { data: stats, isLoading: statsLoading } = useQuery<SubscriptionStats>({
    queryKey: ['admin-subscription-stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/subscriptions/stats')
        return res.data
      } catch {
        // Return mock data if endpoint doesn't exist
        return {
          total_subscriptions: 0,
          active_subscriptions: 0,
          revenue_this_month: 0,
          churn_rate: 0,
        }
      }
    },
  })

  const { data: subscriptions, isLoading: subsLoading } = useQuery<Subscription[]>({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/subscriptions/all')
        return res.data?.subscriptions || []
      } catch {
        return []
      }
    },
  })

  if (statsLoading || subsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Manage platform subscriptions and billing</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground">Manage platform subscriptions and billing</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_subscriptions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.active_subscriptions || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              Revenue (Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.revenue_this_month?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.churn_rate?.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Basic access</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• 5 practice problems/day</li>
              <li>• Basic hints</li>
              <li>• Community access</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pro
              <Badge>Popular</Badge>
            </CardTitle>
            <CardDescription>$9.99/month</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Unlimited practice</li>
              <li>• AI-powered hints</li>
              <li>• Personalized learning paths</li>
              <li>• Progress analytics</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="border-purple-500">
          <CardHeader>
            <CardTitle>Enterprise</CardTitle>
            <CardDescription>Custom pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Team management</li>
              <li>• Custom content</li>
              <li>• API access</li>
              <li>• Dedicated support</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Subscriptions</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period End</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!subscriptions || subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No subscriptions yet
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{sub.user_name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">{sub.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sub.plan === 'pro' ? 'default' : 'secondary'}>
                      {sub.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sub.status === 'active' ? (
                      <Badge variant="default" className="bg-green-600 gap-1">
                        <CheckCircle className="h-3 w-3" /> Active
                      </Badge>
                    ) : sub.status === 'canceled' ? (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" /> Canceled
                      </Badge>
                    ) : (
                      <Badge variant="outline">{sub.status}</Badge>
                    )}
                    {sub.cancel_at_period_end && (
                      <span className="text-xs text-orange-500 ml-2">Canceling</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(sub.current_period_end), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
