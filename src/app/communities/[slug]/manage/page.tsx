'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users, Settings, ArrowLeft, CheckCircle2, XCircle, Clock,
  MoreVertical, UserMinus, ShieldCheck, Crown, Loader2,
  TrendingUp, Activity, Calendar, BarChart3, AlertTriangle,
  Eye, PlusCircle, Trash2, Edit2, Copy, RefreshCw
} from 'lucide-react'

interface Member {
  id: string
  user_id: string
  user_email: string
  user_name: string | null
  status: string
  role: string
  joined_at: string | null
  created_at: string
}

interface JoinRequest {
  id: string
  user_id: string
  user_email: string
  user_name: string | null
  message: string | null
  eligibility_snapshot: Record<string, any> | null
  created_at: string
}

interface Analytics {
  total_members: number
  pending_requests: number
  members_by_role: Record<string, number>
  recent_joins: number
  recent_leaves: number
  activity_trend: { date: string; count: number }[]
}

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  visibility: string
  invite_code: string | null
  member_count: number
  pending_count: number
  rules: any[]
}

export default function CommunityManagePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const slug = params.slug as string

  const [selectedRequests, setSelectedRequests] = useState<string[]>([])

  const { data: community, isLoading } = useQuery<Community>({
    queryKey: ['community', slug],
    queryFn: async () => {
      const res = await api.get(`/api/v1/communities/${slug}`)
      return res.data
    },
  })

  const { data: requests, isLoading: requestsLoading } = useQuery<JoinRequest[]>({
    queryKey: ['community-requests', slug],
    queryFn: async () => {
      const res = await api.get(`/api/v1/communities/${slug}/requests`)
      return res.data
    },
    enabled: !!community,
  })

  const { data: members, isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: ['community-members', slug],
    queryFn: async () => {
      const res = await api.get(`/api/v1/communities/${slug}/members`)
      return res.data
    },
    enabled: !!community,
  })

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ['community-analytics', slug],
    queryFn: async () => {
      const res = await api.get(`/api/v1/communities/${slug}/analytics`)
      return res.data
    },
    enabled: !!community,
  })

  const reviewMutation = useMutation({
    mutationFn: async ({ requestId, approved, reason }: { requestId: string; approved: boolean; reason?: string }) => {
      const res = await api.post(`/api/v1/communities/${slug}/requests/${requestId}/review`, {
        approved,
        reason,
      })
      return res.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community-requests', slug] })
      queryClient.invalidateQueries({ queryKey: ['community-members', slug] })
      queryClient.invalidateQueries({ queryKey: ['community', slug] })
      toast({
        title: variables.approved ? 'Request Approved' : 'Request Rejected',
        description: variables.approved ? 'Member has been added to the community.' : 'Request has been rejected.',
      })
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: 'Could not process the request.',
      })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/api/v1/communities/${slug}/members/${memberId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-members', slug] })
      queryClient.invalidateQueries({ queryKey: ['community', slug] })
      toast({
        title: 'Member Removed',
        description: 'The member has been removed from the community.',
      })
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const res = await api.patch(`/api/v1/communities/${slug}/members/${memberId}`, { role })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-members', slug] })
      toast({ title: 'Role Updated' })
    },
  })

  const regenerateInviteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/v1/communities/${slug}/invite-code/regenerate`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', slug] })
      toast({ title: 'Invite Code Regenerated' })
    },
  })

  const handleBulkApprove = () => {
    selectedRequests.forEach(id => {
      reviewMutation.mutate({ requestId: id, approved: true })
    })
    setSelectedRequests([])
  }

  const handleBulkReject = () => {
    selectedRequests.forEach(id => {
      reviewMutation.mutate({ requestId: id, approved: false })
    })
    setSelectedRequests([])
  }

  const copyInviteLink = () => {
    if (community?.invite_code) {
      navigator.clipboard.writeText(`${window.location.origin}/communities/join/${community.invite_code}`)
      toast({ title: 'Invite link copied!' })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-1/3 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!community) {
    return (
      <div className="container mx-auto py-16 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-medium mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You don't have permission to manage this community.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href={`/communities/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Settings className="w-6 h-6" />
            Manage: {community.name}
          </h1>
        </div>
        <Link href={`/communities/${slug}/settings`}>
          <Button variant="outline" className="gap-2">
            <Edit2 className="w-4 h-4" />
            Edit Settings
          </Button>
        </Link>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{analytics?.total_members || community.member_count}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={community.pending_count > 0 ? 'border-yellow-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold">{analytics?.pending_requests || community.pending_count}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Joins (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">{analytics?.recent_joins || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{community.rules.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Code Section */}
      {community.visibility === 'invite_only' && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Invite Link</CardTitle>
            <CardDescription>Share this link with users you want to invite</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={community.invite_code ? `${typeof window !== 'undefined' ? window.location.origin : ''}/communities/join/${community.invite_code}` : 'No invite code'}
                readOnly
                className="font-mono"
              />
              <Button variant="outline" onClick={copyInviteLink} className="gap-2">
                <Copy className="w-4 h-4" />
                Copy
              </Button>
              <Button
                variant="outline"
                onClick={() => regenerateInviteMutation.mutate()}
                disabled={regenerateInviteMutation.isPending}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${regenerateInviteMutation.isPending ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="requests">
        <TabsList className="mb-6">
          <TabsTrigger value="requests" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending Requests
            {community.pending_count > 0 && (
              <Badge variant="destructive" className="ml-1">{community.pending_count}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="w-4 h-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Join Requests</CardTitle>
                  <CardDescription>Review and approve membership requests</CardDescription>
                </div>
                {selectedRequests.length > 0 && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleBulkApprove} className="gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Approve ({selectedRequests.length})
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleBulkReject} className="gap-2">
                      <XCircle className="w-4 h-4" />
                      Reject ({selectedRequests.length})
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : !requests || requests.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending requests</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">
                        <input
                          type="checkbox"
                          checked={selectedRequests.length === requests.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRequests(requests.map(r => r.id))
                            } else {
                              setSelectedRequests([])
                            }
                          }}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Eligibility</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map(request => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedRequests.includes(request.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRequests([...selectedRequests, request.id])
                              } else {
                                setSelectedRequests(selectedRequests.filter(id => id !== request.id))
                              }
                            }}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {(request.user_name || request.user_email)[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{request.user_name || 'Anonymous'}</p>
                              <p className="text-xs text-muted-foreground">{request.user_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {request.message || '-'}
                        </TableCell>
                        <TableCell>
                          {request.eligibility_snapshot ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <Eye className="w-4 h-4" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Eligibility at Time of Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                  {Object.entries(request.eligibility_snapshot).map(([key, value]) => (
                                    <div key={key} className="flex justify-between p-2 bg-muted rounded">
                                      <span className="text-sm">{key}</span>
                                      <span className="text-sm font-mono">{String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => reviewMutation.mutate({ requestId: request.id, approved: true })}
                              disabled={reviewMutation.isPending}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => reviewMutation.mutate({ requestId: request.id, approved: false })}
                              disabled={reviewMutation.isPending}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Community Members</CardTitle>
              <CardDescription>Manage member roles and access</CardDescription>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : !members || members.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No members yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(member => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {(member.user_name || member.user_email)[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {member.user_name || 'Anonymous'}
                                {member.role === 'creator' && <Crown className="w-4 h-4 text-yellow-500" />}
                              </p>
                              <p className="text-xs text-muted-foreground">{member.user_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={member.role}
                            onValueChange={(role) => updateRoleMutation.mutate({ memberId: member.id, role })}
                            disabled={member.role === 'creator'}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.status === 'approved' ? 'default' : 'secondary'} className="capitalize">
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.role !== 'creator' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => removeMemberMutation.mutate(member.id)}
                                >
                                  <UserMinus className="w-4 h-4 mr-2" />
                                  Remove Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Membership Rules</CardTitle>
                  <CardDescription>Configure requirements for joining this community</CardDescription>
                </div>
                <Link href={`/communities/${slug}/rules`}>
                  <Button className="gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Add Rule
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {community.rules.length === 0 ? (
                <div className="text-center py-12">
                  <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No rules configured. Anyone can join.</p>
                  <Link href={`/communities/${slug}/rules`}>
                    <Button>Add Your First Rule</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {community.rules.map((rule: any, index: number) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground w-6">{index + 1}.</span>
                        <div>
                          <p className="font-medium">{rule.label}</p>
                          <p className="text-sm text-muted-foreground">{rule.type}</p>
                        </div>
                        {rule.is_required && <Badge variant="outline">Required</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Track community events and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Activity log coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
