'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  TableRow,
} from '@/components/ui/table'
import { TableSkeleton } from '@/app/_components/skeletons'
import { Download, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Event {
  id: string
  event_type: string
  user_id: string | null
  task_id: string | null
  concept_id: string | null
  metadata: Record<string, any> | null
  time_ms: number | null
  created_at: string
}

export default function EventsManagement() {
  const [eventType, setEventType] = useState('')
  const [userId, setUserId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [limit, setLimit] = useState('100')

  const { data: events, isLoading, refetch } = useQuery<Event[]>({
    queryKey: ['admin-events', eventType, userId, startDate, endDate, limit],
    queryFn: async () => {
      const response = await api.post('/admin/events/query', {
        event_type: eventType || undefined,
        user_id: userId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit: parseInt(limit) || 100,
      })
      return response.data
    },
  })

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/events/export', {
        event_type: eventType || undefined,
        user_id: userId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit: parseInt(limit) || 100,
      }, {
        responseType: 'blob',
      })
      return response.data
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `events_export_${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Events exported successfully')
    },
    onError: () => {
      toast.error('Failed to export events')
    },
  })

  const handleExport = () => {
    exportMutation.mutate()
  }

  if (isLoading) {
    return <TableSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-2">View and export system event logs</p>
        </div>
        <Button onClick={handleExport} disabled={exportMutation.isPending}>
          <Download className="h-4 w-4 mr-2" />
          {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="event-type">Event Type</Label>
              <Select value={eventType || "all"} onValueChange={(value) => setEventType(value === "all" ? "" : value)}>
                <SelectTrigger id="event-type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="task_generated">task_generated</SelectItem>
                  <SelectItem value="attempt_passed">attempt_passed</SelectItem>
                  <SelectItem value="attempt_failed">attempt_failed</SelectItem>
                  <SelectItem value="time_to_pass">time_to_pass</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="user-id">User ID</Label>
              <Input
                id="user-id"
                placeholder="Filter by user"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="limit">Limit</Label>
              <Input
                id="limit"
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={() => refetch()}>
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events ({events?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Task ID</TableHead>
                <TableHead>Concept ID</TableHead>
                <TableHead>Time (ms)</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events?.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono text-xs">{event.event_type}</TableCell>
                  <TableCell className="font-mono text-xs">{event.user_id ? event.user_id.substring(0, 8) : '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{event.task_id ? event.task_id.substring(0, 8) : '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{event.concept_id ? event.concept_id.substring(0, 8) : '-'}</TableCell>
                  <TableCell>{event.time_ms || '-'}</TableCell>
                  <TableCell>{format(new Date(event.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

