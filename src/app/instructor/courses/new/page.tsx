'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  ArrowRight,
  Loader2,
  BookOpen,
  FileText,
  Image,
  CheckCircle2,
  Sparkles,
  Rocket
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CourseFormData {
  title: string
  description: string
  language: string
  thumbnail_url: string
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'uz', name: "O'zbek", flag: '🇺🇿' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
]

const TEMPLATES = [
  { 
    id: 'blank', 
    name: 'Blank Course', 
    description: 'Start from scratch',
    icon: FileText,
    gradient: 'from-gray-500 to-gray-600'
  },
  { 
    id: 'programming', 
    name: 'Programming', 
    description: 'Code-focused course',
    icon: BookOpen,
    gradient: 'from-blue-500 to-indigo-600'
  },
  { 
    id: 'video', 
    name: 'Video Course', 
    description: 'Video-based learning',
    icon: Image,
    gradient: 'from-purple-500 to-pink-600'
  },
]

export default function CreateCoursePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState('blank')
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
      toast.success('Course created successfully! 🎉')
      router.push(`/instructor/courses/${data.id}`)
    },
    onError: () => {
      toast.error('Failed to create course')
    }
  })

  const steps = [
    { number: 1, title: 'Choose Template' },
    { number: 2, title: 'Course Details' },
    { number: 3, title: 'Review & Create' },
  ]

  const canProceed = () => {
    if (step === 1) return selectedTemplate !== ''
    if (step === 2) return formData.title.trim().length >= 3
    return true
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      createMutation.mutate()
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/instructor">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Course</h1>
          <p className="text-muted-foreground mt-1">
            Set up your course in just a few steps
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="relative flex justify-between">
          {steps.map((s) => (
            <div key={s.number} className="flex flex-col items-center">
              <motion.div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                  step >= s.number 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}
                animate={{ scale: step === s.number ? 1.1 : 1 }}
              >
                {step > s.number ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  s.number
                )}
              </motion.div>
              <span className={cn(
                "text-sm mt-2 font-medium",
                step >= s.number ? "text-foreground" : "text-muted-foreground"
              )}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Choose a Template
                </CardTitle>
                <CardDescription>
                  Select a template to get started quickly or begin with a blank course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {TEMPLATES.map((template) => {
                    const Icon = template.icon
                    return (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card 
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-lg",
                            selectedTemplate === template.id 
                              ? "ring-2 ring-primary border-primary" 
                              : "hover:border-primary/50"
                          )}
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          <CardContent className="pt-6 text-center">
                            <div className={cn(
                              "w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br text-white",
                              template.gradient
                            )}>
                              <Icon className="h-7 w-7" />
                            </div>
                            <h3 className="font-semibold mb-1">{template.name}</h3>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                            {selectedTemplate === template.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="mt-3"
                              >
                                <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Course Details
                </CardTitle>
                <CardDescription>
                  Tell us about your course. You can always edit these later.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base">
                    Course Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Python for Beginners"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="text-lg py-6"
                  />
                  <p className="text-sm text-muted-foreground">
                    Choose a clear, descriptive title for your course
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What will students learn in this course?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Language</Label>
                  <div className="flex gap-3">
                    {LANGUAGES.map((lang) => (
                      <Button
                        key={lang.code}
                        type="button"
                        variant={formData.language === lang.code ? "default" : "outline"}
                        className="gap-2"
                        onClick={() => setFormData({ ...formData, language: lang.code })}
                      >
                        <span>{lang.flag}</span>
                        {lang.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail" className="text-base">Thumbnail URL (optional)</Label>
                  <Input
                    id="thumbnail"
                    placeholder="https://example.com/image.jpg"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Add a cover image to make your course stand out
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card className="overflow-hidden">
              <div className="h-3 bg-gradient-to-r from-primary via-indigo-500 to-purple-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  Ready to Launch!
                </CardTitle>
                <CardDescription>
                  Review your course details before creating
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-muted/50 p-6 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Course Title</p>
                    <p className="text-xl font-semibold">{formData.title || 'Untitled Course'}</p>
                  </div>
                  
                  {formData.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-foreground">{formData.description}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Language</p>
                      <p className="font-medium">
                        {LANGUAGES.find(l => l.code === formData.language)?.flag}{' '}
                        {LANGUAGES.find(l => l.code === formData.language)?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Template</p>
                      <p className="font-medium capitalize">{selectedTemplate}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    What's Next?
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Add lessons with videos, text, or files</li>
                    <li>• Invite students via email</li>
                    <li>• Track student progress in real-time</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!canProceed() || createMutation.isPending}
          className="gap-2 min-w-[140px]"
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : step === 3 ? (
            <>
              <Rocket className="h-4 w-4" />
              Create Course
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
