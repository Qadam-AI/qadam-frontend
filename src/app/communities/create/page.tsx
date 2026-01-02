'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft, ArrowRight, Loader2, Sparkles, Globe, Lock,
  UserPlus, GraduationCap, Code, TrendingUp, Brain, FlaskConical,
  Scale, Building2, BookOpen, Palette, Music, Wrench, X, Wand2
} from 'lucide-react'

const CATEGORIES = [
  { value: 'programming', label: 'Programming', icon: Code },
  { value: 'data_science', label: 'Data Science', icon: TrendingUp },
  { value: 'mathematics', label: 'Mathematics', icon: Brain },
  { value: 'physics', label: 'Physics', icon: FlaskConical },
  { value: 'law', label: 'Law', icon: Scale },
  { value: 'business', label: 'Business', icon: Building2 },
  { value: 'languages', label: 'Languages', icon: BookOpen },
  { value: 'arts', label: 'Arts', icon: Palette },
  { value: 'music', label: 'Music', icon: Music },
  { value: 'engineering', label: 'Engineering', icon: Wrench },
  { value: 'other', label: 'Other', icon: GraduationCap },
]

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner', description: 'For those just starting out' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some background knowledge required' },
  { value: 'advanced', label: 'Advanced', description: 'Significant experience needed' },
  { value: 'expert', label: 'Expert', description: 'For specialists and professionals' },
]

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can discover and view this community' },
  { value: 'private', label: 'Private', icon: Lock, description: 'Only members can see this community' },
  { value: 'invite_only', label: 'Invite Only', icon: UserPlus, description: 'Requires an invite link to join' },
]

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  slug: z.string().max(50).regex(/^[a-z0-9-]*$/, 'Only lowercase letters, numbers, and hyphens').optional().or(z.literal('')),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  mission: z.string().max(5000).optional().or(z.literal('')),
  category: z.string().min(1, 'Please select a category'),
  customCategory: z.string().max(50).optional().or(z.literal('')),
  difficulty: z.string().min(1, 'Please select a difficulty level'),
  visibility: z.string().min(1, 'Please select visibility'),
  tags: z.array(z.string()).max(10),
  cover_image_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')).transform(val => val || undefined),
  icon_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')).transform(val => val || undefined),
})

type FormData = z.infer<typeof formSchema>

export default function CreateCommunityPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [tagInput, setTagInput] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      mission: '',
      category: '',
      customCategory: '',
      difficulty: '',
      visibility: 'public',
      tags: [],
      cover_image_url: '',
      icon_url: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Use customCategory as category name if "other" is selected
      const categoryValue = data.category === 'other' && data.customCategory 
        ? data.customCategory.toLowerCase().replace(/\s+/g, '_')
        : data.category
      
      const payload = {
        name: data.name,
        description: data.description,
        mission: data.mission || undefined,
        category: categoryValue,
        difficulty: data.difficulty,
        visibility: data.visibility,
        tags: data.tags,
        slug: data.slug || undefined, // Let backend auto-generate if empty
        cover_image_url: data.cover_image_url || undefined,
        icon_url: data.icon_url || undefined,
      }
      const res = await api.post('/api/v1/communities', payload)
      return res.data
    },
    onSuccess: (data) => {
      toast.success('Community Created!', { description: 'Your community is ready. Add rules to gate membership.' })
      router.push(`/communities/${data.slug}/rules`)
    },
    onError: (error: any) => {
      toast.error('Failed to create community', { description: error.response?.data?.detail || 'An error occurred' })
    },
  })

  const generateDescriptionMutation = useMutation({
    mutationFn: async (field: 'description' | 'mission') => {
      const name = form.getValues('name')
      const category = form.getValues('category')
      const customCategory = form.getValues('customCategory')
      
      if (!name) {
        throw new Error('Please enter a community name first')
      }
      
      const res = await api.post('/api/v1/chat/generate', {
        prompt: `Generate a ${field === 'description' ? 'short description' : 'mission statement'} for a learning community called "${name}"`,
        generation_type: field === 'description' ? 'community_description' : 'community_mission',
        context: {
          name,
          category: category === 'other' ? customCategory : category,
          difficulty: form.getValues('difficulty'),
        },
        max_tokens: field === 'description' ? 200 : 400,
      })
      return { text: res.data.generated_text, field }
    },
    onSuccess: (data) => {
      form.setValue(data.field, data.text)
      toast.success('Generated!', { description: `${data.field === 'description' ? 'Description' : 'Mission'} generated. Feel free to modify it.` })
    },
    onError: (error: any) => {
      toast.error('Generation failed', { description: error.message || 'Could not generate content. Please try again.' })
    },
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50)
  }

  const addTag = () => {
    if (tagInput.trim() && !form.getValues('tags').includes(tagInput.trim())) {
      const newTags = [...form.getValues('tags'), tagInput.trim().toLowerCase()]
      form.setValue('tags', newTags.slice(0, 10))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    form.setValue('tags', form.getValues('tags').filter(t => t !== tag))
  }

  const onSubmit = (data: FormData) => {
    console.log('Form submitted with data:', data)
    createMutation.mutate(data)
  }

  const onError = (errors: any) => {
    console.error('Form validation errors:', errors)
    toast({
      variant: 'destructive',
      title: 'Validation Error',
      description: 'Please check all required fields are filled correctly.',
    })
  }

  const canProceed = () => {
    if (step === 1) {
      return form.watch('name') && form.watch('slug') && form.watch('description')
    }
    if (step === 2) {
      return form.watch('category') && form.watch('difficulty')
    }
    return true
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/communities"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Communities
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          Create Learning Community
        </h1>
        <p className="text-muted-foreground mt-2">
          Build a gated community with strict membership requirements to maintain quality.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s === step ? 'bg-primary text-primary-foreground' :
                s < step ? 'bg-green-500 text-white' :
                'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div className={`w-24 h-1 mx-2 ${s < step ? 'bg-green-500' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onError)}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Tell us about your community</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Community Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Advanced Python Developers"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              if (!slugManuallyEdited) {
                                form.setValue('slug', generateSlug(e.target.value))
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>A clear, descriptive name for your community</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug *</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">/communities/</span>
                            <Input
                              placeholder="advanced-python"
                              {...field}
                              onChange={(e) => {
                                setSlugManuallyEdited(true)
                                field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>The URL path for your community</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Short Description *</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateDescriptionMutation.mutate('description')}
                            disabled={generateDescriptionMutation.isPending || !form.watch('name')}
                            className="gap-1"
                          >
                            {generateDescriptionMutation.isPending && generateDescriptionMutation.variables === 'description' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Wand2 className="w-3 h-3" />
                            )}
                            Generate
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="A community for serious Python developers who want to master advanced concepts..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>{field.value?.length || 0}/500 characters</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mission"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Mission Statement</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateDescriptionMutation.mutate('mission')}
                            disabled={generateDescriptionMutation.isPending || !form.watch('name')}
                            className="gap-1"
                          >
                            {generateDescriptionMutation.isPending && generateDescriptionMutation.variables === 'mission' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Wand2 className="w-3 h-3" />
                            )}
                            Generate
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="What does this community stand for? What are the goals and values?"
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Describe the purpose and standards of your community</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Category & Settings */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Category & Settings</CardTitle>
                  <CardDescription>Configure your community's category and visibility</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {CATEGORIES.map((cat) => {
                              const Icon = cat.icon
                              return (
                                <button
                                  key={cat.value}
                                  type="button"
                                  onClick={() => field.onChange(cat.value)}
                                  className={`p-4 rounded-lg border text-left transition-all ${
                                    field.value === cat.value
                                      ? 'border-primary bg-primary/10'
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  <Icon className={`w-6 h-6 mb-2 ${field.value === cat.value ? 'text-primary' : 'text-muted-foreground'}`} />
                                  <p className="font-medium text-sm">{cat.label}</p>
                                </button>
                              )
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('category') === 'other' && (
                    <FormField
                      control={form.control}
                      name="customCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specify Category</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Biology, Chemistry, Finance..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Enter a custom category name for your community</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty Level *</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-3">
                            {DIFFICULTIES.map((diff) => (
                              <button
                                key={diff.value}
                                type="button"
                                onClick={() => field.onChange(diff.value)}
                                className={`p-4 rounded-lg border text-left transition-all ${
                                  field.value === diff.value
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                                }`}
                              >
                                <p className="font-medium">{diff.label}</p>
                                <p className="text-xs text-muted-foreground">{diff.description}</p>
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visibility *</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            {VISIBILITY_OPTIONS.map((option) => {
                              const Icon = option.icon
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => field.onChange(option.value)}
                                  className={`w-full p-4 rounded-lg border text-left flex items-center gap-4 transition-all ${
                                    field.value === option.value
                                      ? 'border-primary bg-primary/10'
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  <Icon className={`w-6 h-6 ${field.value === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
                                  <div>
                                    <p className="font-medium">{option.label}</p>
                                    <p className="text-xs text-muted-foreground">{option.description}</p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Tags & Media */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Tags & Media</CardTitle>
                  <CardDescription>Add tags and images to help users discover your community</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add a tag..."
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    addTag()
                                  }
                                }}
                              />
                              <Button type="button" variant="outline" onClick={addTag}>
                                Add
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {field.value.map((tag) => (
                                <Badge key={tag} variant="secondary" className="gap-1">
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>Up to 10 tags to help categorize your community</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cover_image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/cover.jpg" {...field} />
                        </FormControl>
                        <FormDescription>A banner image for your community (recommended: 1200x400)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icon_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/icon.png" {...field} />
                        </FormControl>
                        <FormDescription>A square icon for your community (recommended: 200x200)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Preview */}
                  <div className="border rounded-lg p-6 bg-muted/30">
                    <p className="text-sm font-medium mb-4">Preview</p>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {form.watch('icon_url') ? (
                          <img src={form.watch('icon_url')} alt="" className="w-12 h-12 rounded" />
                        ) : (
                          <GraduationCap className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold">{form.watch('name') || 'Community Name'}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {form.watch('description') || 'Your community description will appear here'}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="capitalize">
                            {form.watch('category') || 'category'}
                          </Badge>
                          <Badge className="capitalize">{form.watch('difficulty') || 'level'}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Community
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
