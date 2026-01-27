'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft,
  Loader2,
  Sparkles,
  Upload,
  ImageIcon,
  X
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import Image from 'next/image'

// Design System
import { PageShell, Section, Stack } from '@/design-system/layout'
import { SurfaceCard, InfoPanel } from '@/design-system/surfaces'
import { LabelText, HelperText } from '@/design-system/typography'

interface CourseFormData {
  title: string
  description: string
  language: string
}

export default function CreateCoursePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    language: 'en'
  })
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setCoverImage(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeCoverImage = () => {
    setCoverImage(null)
    setCoverPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      // First create the course
      const res = await api.post('/instructor/courses', formData)
      const courseId = res.data.id

      // If cover image is selected, upload it
      if (coverImage) {
        const formData = new FormData()
        formData.append('file', coverImage)
        await api.post(`/instructor/courses/${courseId}/upload-cover`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      return res.data
    },
    onSuccess: (data) => {
      toast.success('Course created successfully!')
      router.push(`/instructor/courses/${data.id}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create course')
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
              <LabelText>Cover Image</LabelText>
              
              {coverPreview ? (
                <div className="relative w-full h-48 rounded-lg border border-border overflow-hidden bg-muted">
                  <Image
                    src={coverPreview}
                    alt="Cover preview"
                    fill
                    className="object-contain"
                  />
                  <button
                    onClick={removeCoverImage}
                    className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-colors flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground"
                >
                  <div className="p-3 rounded-full bg-primary/10">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to upload cover image</p>
                    <p className="text-xs">Max 5MB • JPEG, PNG, WebP, GIF</p>
                  </div>
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleCoverUpload}
                className="hidden"
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
