'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Brain, DollarSign, Database, Rocket, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface LLMSettings {
  use_llm_generation: boolean
  use_docker_runner: boolean
  use_subprocess_grader: boolean
  openai_model: string | null
}

interface LLMCostStats {
  total_requests: number
  total_tokens: number
  estimated_cost_usd: number
  cache_hits: number
  cache_misses: number
}

export default function LLMConfiguration() {
  const queryClient = useQueryClient()

  const { data: settings, isLoading: isLoadingSettings } = useQuery<LLMSettings>({
    queryKey: ['admin-llm-settings'],
    queryFn: async () => {
      const response = await api.get('/admin/llm/settings')
      return response.data
    },
  })

  const { data: costStats, isLoading: isLoadingStats } = useQuery<LLMCostStats>({
    queryKey: ['admin-llm-cost-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/llm/cost-stats')
      return response.data
    },
  })

  const [localSettings, setLocalSettings] = useState<LLMSettings | null>(null)

  const updateMutation = useMutation({
    mutationFn: async (data: LLMSettings) => {
      await api.post('/admin/llm/settings', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-llm-settings'] })
      setLocalSettings(null)
      toast.success('Settings updated! Restart server for changes to take effect.')
    },
    onError: () => {
      toast.error('Failed to update settings')
    },
  })

  const currentSettings = localSettings || settings

  const handleToggle = (key: keyof LLMSettings, value: boolean) => {
    setLocalSettings({
      ...currentSettings!,
      [key]: value,
    })
  }

  const handleSave = () => {
    if (localSettings) {
      updateMutation.mutate(localSettings)
    }
  }

  const handleReset = () => {
    setLocalSettings(null)
  }

  const hasChanges = localSettings !== null

  if (isLoadingSettings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">LLM Configuration</h1>
          <p className="text-muted-foreground mt-2">Configure AI-powered features</p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">LLM Configuration</h1>
        <p className="text-muted-foreground mt-2">Configure AI-powered features and task generation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature Toggles</CardTitle>
          <CardDescription>
            Enable or disable AI-powered features. Changes require server restart.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="llm-generation">LLM Task Generation</Label>
                {currentSettings?.use_llm_generation && (
                  <Badge variant="default" className="text-xs">Enabled</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Use OpenAI to generate personalized coding tasks
              </p>
            </div>
            <Switch
              id="llm-generation"
              checked={currentSettings?.use_llm_generation || false}
              onCheckedChange={(checked) => handleToggle('use_llm_generation', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="subprocess-grader">Subprocess Grader</Label>
                {currentSettings?.use_subprocess_grader && (
                  <Badge variant="default" className="text-xs">Enabled</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Use pytest subprocess for code execution and grading
              </p>
            </div>
            <Switch
              id="subprocess-grader"
              checked={currentSettings?.use_subprocess_grader || false}
              onCheckedChange={(checked) => handleToggle('use_subprocess_grader', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="docker-runner">Docker Runner</Label>
                {currentSettings?.use_docker_runner && (
                  <Badge variant="default" className="text-xs">Enabled</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Execute code in isolated Docker containers (most secure)
              </p>
            </div>
            <Switch
              id="docker-runner"
              checked={currentSettings?.use_docker_runner || false}
              onCheckedChange={(checked) => handleToggle('use_docker_runner', checked)}
            />
          </div>

          {hasChanges && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-900 dark:text-amber-100">
                You have unsaved changes
              </p>
            </div>
          )}

          {hasChanges && (
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">OpenAI Model</p>
              <p className="text-sm text-muted-foreground">
                {currentSettings?.openai_model || 'Not configured (check environment variables)'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
            <Rocket className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{costStats?.total_requests || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">LLM API calls</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tokens
            </CardTitle>
            <Database className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{(costStats?.total_tokens || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Tokens used</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estimated Cost
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">${(costStats?.estimated_cost_usd || 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">USD (estimated)</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cache Hit Rate
            </CardTitle>
            <Database className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {costStats ? Math.round((costStats.cache_hits / (costStats.cache_hits + costStats.cache_misses || 1)) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {costStats?.cache_hits || 0} hits / {costStats?.cache_misses || 0} misses
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

