'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  XCircle,
  Pencil
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'

interface Subscription {
  id: string
  user_id: string
  user_email?: string
  user_name?: string
  plan: string
  plan_id?: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
}

interface Plan {
  id: string
  name: string
  display_name: string
  price_monthly: number
}

interface SubscriptionStats {
  total_subscriptions: number
  active_subscriptions: number
  revenue_this_month: number
  churn_rate: number
}

export default function AdminSubscriptions() {
  const queryClient = useQueryClient()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
  const [editForm, setEditForm] = useState({
    plan_id: '',
    status: 'active',
    expires_at: '',
  })
  const { data: stats, isLoading: statsLoading } = useQuery<SubscriptionStats>({
    queryKey: ['admin-subscription-stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/subscriptions/stats')
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
        const res = await api.get('/subscriptions/all')
        return res.data?.subscriptions || []
      } catch {
        return []
      }
    },
  })

  const { data: plans } = useQuery<Plan[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      try {
        const res = await api.get('/subscriptions/plans')
        return res.data || []
      } catch {
        return []
      }
    },
  })

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      await api.patch(`/subscriptions/admin/users/${userId}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-stats'] })
      toast.success('Subscription updated successfully')
      setIsEditOpen(false)
    },
    onError: () => {
      toast.error('Failed to update subscription')
    },
  })

  const openEditDialog = (sub: Subscription) => {
    setSelectedSub(sub)
    setEditForm({
      plan_id: sub.plan_id || '',
      status: sub.status || 'active',
      expires_at: sub.current_period_end ? sub.current_period_end.split('T')[0] : '',
    })
    setIsEditOpen(true)
  }

  const handleUpdateSubscription = () => {
    if (!selectedSub) return
    updateSubscriptionMutation.mutate({
      userId: selectedSub.user_id,
      data: {
        plan_id: editForm.plan_id || undefined,
        status: editForm.status,
        expires_at: editForm.expires_at ? new Date(editForm.expires_at).toISOString() : undefined,
      },
    })
  }

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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!subscriptions || subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(sub)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Subscription Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              Update subscription for {selectedSub?.user_name || selectedSub?.user_email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select
                value={editForm.plan_id}
                onValueChange={(value) => setEditForm({ ...editForm, plan_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.display_name || plan.name} (${plan.price_monthly}/mo)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={editForm.expires_at}
                onChange={(e) => setEditForm({ ...editForm, expires_at: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use plan default
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateSubscription}
              disabled={updateSubscriptionMutation.isPending}
            >
              {updateSubscriptionMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
