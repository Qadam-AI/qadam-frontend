'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users, Search, Filter, GraduationCap, Lock, Globe,
  Sparkles, TrendingUp, BookOpen, Code, FlaskConical,
  Scale, Building2, Brain, Palette, Music, Wrench
} from 'lucide-react'
import { useTranslations } from '@/lib/i18n'

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  difficulty: string
  visibility: string
  member_count: number
  pending_count: number
  cover_image_url: string | null
  icon_url: string | null
  tags: string[]
  created_at: string
}

interface CommunitiesResponse {
  items: Community[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: Sparkles },
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
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
]

const getCategoryIcon = (category: string) => {
  const found = CATEGORIES.find(c => c.value === category)
  return found?.icon || GraduationCap
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'intermediate': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'advanced': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'expert': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

function CommunityCard({ community, index }: { community: Community; index: number }) {
  const t = useTranslations('communities')
  const CategoryIcon = getCategoryIcon(community.category)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/communities/${community.slug}`}>
        <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
          {/* Cover Image */}
          {community.cover_image_url && (
            <div className="h-32 overflow-hidden rounded-t-lg">
              <img
                src={community.cover_image_url}
                alt={community.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          )}
          
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                {community.icon_url ? (
                  <img src={community.icon_url} alt="" className="w-8 h-8 rounded" />
                ) : (
                  <CategoryIcon className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                  {community.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {community.category.replace('_', ' ')}
                  </Badge>
                  <Badge className={`text-xs capitalize ${getDifficultyColor(community.difficulty)}`}>
                    {community.difficulty}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pb-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {community.description || t('defaultDescription')}
            </p>
            
            {community.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {community.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {community.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{community.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="pt-0 border-t mt-auto">
            <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{t('members', { count: community.member_count })}</span>
              </div>
              {community.visibility === 'private' ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}

function CommunityCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-4 w-24" />
      </CardFooter>
    </Card>
  )
}

export default function CommunitiesPage() {
  const t = useTranslations('communities')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery<CommunitiesResponse>({
    queryKey: ['communities', search, category, difficulty, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        page_size: '12',
      })
      if (search) params.set('search', search)
      if (category !== 'all') params.set('category', category)
      if (difficulty !== 'all') params.set('difficulty', difficulty)
      
      const res = await api.get(`/communities?${params}`)
      return res.data
    },
    staleTime: 30000,
  })

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header - Clean style like Courses page */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 mb-8"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                <div className="flex items-center gap-2">
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTIES.map(d => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Link href="/communities/create">
          <Button className="gap-2">
            <Sparkles className="w-4 h-4" />
            {t('createCommunity')}
          </Button>
        </Link>
      </motion.div>

      {/* Results */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('error')}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            {t('tryAgain')}
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <CommunityCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('noCommunitiesFound')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('noCommunitiesDesc')}
          </p>
          <Link href="/communities/create">
            <Button>{t('createCommunity')}</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.items.map((community, index) => (
              <CommunityCard key={community.id} community={community} index={index} />
            ))}
          </div>
          
          {/* Pagination */}
          {data && data.has_more && (
            <div className="flex justify-center mt-8 gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!data.has_more}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
          
          {/* Stats */}
          {data && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Showing {data.items.length} of {data.total} communities
            </p>
          )}
        </>
      )}
    </div>
  )
}
