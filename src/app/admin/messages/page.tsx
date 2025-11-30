'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Mail, 
  MailOpen, 
  Trash2, 
  Building2, 
  Calendar, 
  MessageSquare,
  User,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface ContactMessage {
  id: string
  name: string
  email: string
  company?: string
  message: string
  message_type: string
  is_read: boolean
  created_at: string
}

export default function AdminMessagesPage() {
  const queryClient = useQueryClient()
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  
  const { data: messages, isLoading } = useQuery<ContactMessage[]>({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const response = await api.get('/admin/contact')
      return response.data
    },
  })

  const { data: unreadCount } = useQuery<{ unread_count: number }>({
    queryKey: ['admin-messages-count'],
    queryFn: async () => {
      const response = await api.get('/admin/contact/count')
      return response.data
    },
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await api.patch(`/admin/contact/${messageId}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] })
      queryClient.invalidateQueries({ queryKey: ['admin-messages-count'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await api.delete(`/admin/contact/${messageId}`)
    },
    onSuccess: () => {
      toast.success('Message deleted')
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] })
      queryClient.invalidateQueries({ queryKey: ['admin-messages-count'] })
    },
    onError: () => {
      toast.error('Failed to delete message')
    },
  })

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message)
    if (!message.is_read) {
      markAsReadMutation.mutate(message.id)
    }
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      demo: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      partnership: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      support: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      investment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    }
    return (
      <Badge variant="outline" className={colors[type] || colors.general}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Contact Messages
          </h1>
          <p className="text-muted-foreground mt-1">
            Messages from the contact form
          </p>
        </div>
        {unreadCount && unreadCount.unread_count > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {unreadCount.unread_count} unread
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Messages</CardTitle>
          <CardDescription>
            {messages?.length || 0} total messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages && messages.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]"></TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow 
                    key={message.id} 
                    className={!message.is_read ? 'bg-primary/5' : ''}
                  >
                    <TableCell>
                      {message.is_read ? (
                        <MailOpen className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Mail className="w-4 h-4 text-primary" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{message.name}</div>
                      <div className="text-sm text-muted-foreground">{message.email}</div>
                      {message.company && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          {message.company}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getTypeBadge(message.message_type)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {message.message}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(message.created_at), 'MMM d, HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewMessage(message)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(message.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p className="text-muted-foreground">Messages from the contact form will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedMessage?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedMessage?.email}
              {selectedMessage?.company && ` • ${selectedMessage.company}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {selectedMessage && getTypeBadge(selectedMessage.message_type)}
              <span className="text-sm text-muted-foreground">
                {selectedMessage && format(new Date(selectedMessage.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
              </span>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="whitespace-pre-wrap">{selectedMessage?.message}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.location.href = `mailto:${selectedMessage?.email}`}
              >
                <Mail className="w-4 h-4 mr-2" />
                Reply via Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
