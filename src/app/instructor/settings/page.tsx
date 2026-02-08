'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import api, { getImageUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Loader2,
  Camera,
  Calendar,
  Mail
} from 'lucide-react'
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'

// Design System
import { PageShell, PageHeader, Section, Stack } from '@/design-system/layout'
import { SurfaceCard } from '@/design-system/surfaces'
import { LabelText, HelperText } from '@/design-system/typography'

export default function InstructorSettings() {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState(user?.name || '')
  const [bio, setBio] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [studentMessages, setStudentMessages] = useState(true)
  const [enrollmentAlerts, setEnrollmentAlerts] = useState(true)

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/instructor/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    },
    onSuccess: () => {
      toast.success('Avatar updated successfully!')
      refreshUser()
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to upload avatar')
    }
  })

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB')
      return
    }

    uploadAvatarMutation.mutate(file)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.put('/users/profile', { name: displayName })
    },
    onSuccess: () => {
      toast.success('Settings saved')
    },
    onError: () => {
      toast.error('Failed to save settings')
    }
  })

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'

  return (
    <PageShell maxWidth="xl">
      <PageHeader
        title="Settings"
        description="Manage your instructor profile and preferences"
      />

      {/* Profile */}
      <Section title="Profile" description="Your public instructor information">
        <SurfaceCard>
          <Stack gap="md">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <LabelText>Profile Picture</LabelText>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-20 w-20 text-2xl">
                    {user?.avatarUrl && (
                      <AvatarImage src={getImageUrl(user.avatarUrl)} alt={user.name || 'User'} />
                    )}
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAvatarMutation.isPending}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                    title="Change avatar"
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Click avatar to change</p>
                  <p className="text-xs">Max 2MB • JPEG, PNG, WebP, GIF</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <LabelText required>Display Name</LabelText>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name as shown to students"
              />
            </div>

            <div className="space-y-2">
              <LabelText>Bio</LabelText>
              <Input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief description of your expertise"
              />
              <HelperText>Shown on your course pages</HelperText>
            </div>

            <Separator />

            <div className="space-y-2">
              <LabelText>Email</LabelText>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user?.email || 'No email set'}</span>
              </div>
              <HelperText>Contact support to change your email</HelperText>
            </div>

            <div className="space-y-2">
              <LabelText>Member Since</LabelText>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'Unknown'}
                </span>
              </div>
            </div>
          </Stack>
        </SurfaceCard>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" description="Configure how you receive updates">
        <SurfaceCard>
          <Stack gap="md">
            <div className="flex items-center justify-between">
              <div>
                <LabelText>Email Notifications</LabelText>
                <HelperText>Receive email updates about your courses</HelperText>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <LabelText>Student Messages</LabelText>
                <HelperText>Get notified when students send you messages</HelperText>
              </div>
              <Switch
                checked={studentMessages}
                onCheckedChange={setStudentMessages}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <LabelText>Enrollment Alerts</LabelText>
                <HelperText>Get notified when new students enroll</HelperText>
              </div>
              <Switch
                checked={enrollmentAlerts}
                onCheckedChange={setEnrollmentAlerts}
              />
            </div>
          </Stack>
        </SurfaceCard>
      </Section>

      {/* Privacy */}
      <Section title="Privacy" description="Control your visibility and data preferences">
        <SurfaceCard>
          <Stack gap="md">
            <div className="flex items-center justify-between">
              <div>
                <LabelText>Public Profile</LabelText>
                <HelperText>Allow students to view your instructor profile</HelperText>
              </div>
              <Switch defaultChecked />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <LabelText>Show Courses Count</LabelText>
                <HelperText>Display the number of courses you teach</HelperText>
              </div>
              <Switch defaultChecked />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <LabelText>Show Student Count</LabelText>
                <HelperText>Display total students across your courses</HelperText>
              </div>
              <Switch defaultChecked />
            </div>
          </Stack>
        </SurfaceCard>
      </Section>

      {/* Teaching Preferences */}
      <Section title="Teaching Preferences" description="Default settings for new courses">
        <SurfaceCard>
          <Stack gap="md">
            <div className="flex items-center justify-between">
              <div>
                <LabelText>Auto-publish Lessons</LabelText>
                <HelperText>Automatically publish new lessons</HelperText>
              </div>
              <Switch />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <LabelText>Allow Student Comments</LabelText>
                <HelperText>Enable comments on lessons by default</HelperText>
              </div>
              <Switch defaultChecked />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <LabelText>AI Assistance</LabelText>
                <HelperText>Use AI to help generate course content</HelperText>
              </div>
              <Switch defaultChecked />
            </div>
          </Stack>
        </SurfaceCard>
      </Section>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="lg">
          {saveMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </PageShell>
  )
}
