'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft,
  Loader2,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

// Design System
import { PageShell, Section, Stack } from '@/design-system/layout'
import { SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { LabelText, HelperText } from '@/design-system/typography'

interface CourseFormData {
  title: string
  description: string
  language: string
  thumbnail_url: string
}

export default function CreateCoursePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    language: 'en',
    thumbnail_url: ''
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/instructor/courses', formData)
      return res.data
    },
    onSuccess: (data) => {
      toast.success('Course created!')
      router.push(`/instructor/courses/${data.id}`)
    },
    onError: () => {
      toast.error('Failed to create course')
    }
  })

  const canSubmit = formData.title.trim().length >= 3

  return (
    <PageShell maxWidth="lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/instructor/courses">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Course</h1>
          <p className="text-muted-foreground mt-1">Fill in the details to get started</p>
        </div>
      </div>

      <Section>
        <SurfaceCard variant="elevated">
          <Stack gap="lg">
            <div className="space-y-2">
              <LabelText required>Course Title</LabelText>
              <Input
                placeholder="e.g., Introduction to Python"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="text-lg"
                autoFocus
              />
              <HelperText>Choose a clear, descriptive title for your course</HelperText>
            </div>

            <div className="space-y-2">
              <LabelText>Description</LabelText>
              <Textarea
                placeholder="What will students learn in this course?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
              <HelperText>A brief overview of the course content and learning objectives</HelperText>
            </div>

            <div className="space-y-2">
              <LabelText>Course Language</LabelText>
              <Input
                placeholder="e.g., English, Uzbek, Russian"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              />
              <HelperText>Primary language for course content</HelperText>
            </div>

            <div className="space-y-2">
              <LabelText>Thumbnail URL</LabelText>
              <Input
                placeholder="https://example.com/image.jpg"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              />
              <HelperText>Optional cover image to make your course stand out</HelperText>
            </div>
          </Stack>
        </SurfaceCard>
      </Section>

      <Section>
        <InfoPanel variant="info" icon={Sparkles} title="What's Next?">
          <ul className="text-sm space-y-1">
            <li>• Add lessons with videos, text, or files</li>
            <li>• Extract concepts using AI content structuring</li>
            <li>• Invite students via email</li>
            <li>• Track understanding in real-time</li>
          </ul>
        </InfoPanel>
      </Section>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4">
        <Link href="/instructor/courses">
          <Button variant="outline" size="lg">
            Cancel
          </Button>
        </Link>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!canSubmit || createMutation.isPending}
          size="lg"
          className="gap-2 min-w-[160px]"
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Create Course
            </>
          )}
        </Button>
      </div>
    </PageShell>
  )
}
