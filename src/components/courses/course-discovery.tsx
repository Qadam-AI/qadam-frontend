'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, BookOpen, Clock, Users, Star, Filter,
  TrendingUp, Flame, ChevronRight, Play, CheckCircle,
  Code, Sparkles, ArrowRight, Heart, Bookmark
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

// Types
interface CourseCard {
  id: string
  title: string
  description: string
  thumbnail?: string
  instructor: string
  language: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration: string  // e.g., "4 hours"
  lessonsCount: number
  enrolledCount: number
  rating: number
  ratingCount: number
  tags: string[]
  isEnrolled?: boolean
  progress?: number
  isFeatured?: boolean
  isNew?: boolean
}

interface CourseFilters {
  search: string
  level: string
  language: string
  sortBy: 'popular' | 'newest' | 'rating' | 'trending'
}

// Level badge colors
const LEVEL_COLORS = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

// Course Card Component
function CourseCardComponent({ 
  course, 
  onEnroll,
  onBookmark,
  isBookmarked = false,
}: { 
  course: CourseCard
  onEnroll?: (courseId: string) => void
  onBookmark?: (courseId: string) => void
  isBookmarked?: boolean
}) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/courses/${course.id}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="h-full flex flex-col cursor-pointer overflow-hidden group"
        onClick={handleClick}
      >
        {/* Thumbnail */}
        <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
          {course.thumbnail ? (
            <img 
              src={course.thumbnail} 
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary/40" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {course.isFeatured && (
              <Badge className="bg-yellow-500">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {course.isNew && (
              <Badge className="bg-green-500">
                New
              </Badge>
            )}
          </div>

          {/* Bookmark Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white dark:bg-gray-800/80"
            onClick={(e) => {
              e.stopPropagation()
              onBookmark?.(course.id)
            }}
          >
            <Bookmark 
              className={`h-4 w-4 ${isBookmarked ? 'fill-primary text-primary' : ''}`} 
            />
          </Button>

          {/* Progress Overlay */}
          {course.isEnrolled && course.progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2">
              <div className="flex items-center justify-between text-white text-xs mb-1">
                <span>Progress</span>
                <span>{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-1.5" />
            </div>
          )}
        </div>

        <CardContent className="flex-1 p-4">
          {/* Level Badge */}
          <Badge 
            variant="secondary" 
            className={`mb-2 ${LEVEL_COLORS[course.level]}`}
          >
            {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
          </Badge>

          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {course.description}
          </p>

          {/* Instructor */}
          <p className="text-sm text-muted-foreground mt-2">
            by <span className="font-medium text-foreground">{course.instructor}</span>
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {course.duration}
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {course.lessonsCount} lessons
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="ml-1 font-medium">{course.rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({course.ratingCount.toLocaleString()} ratings)
            </span>
            <div className="flex items-center gap-1 ml-auto text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {course.enrolledCount.toLocaleString()}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-3">
            {course.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          {course.isEnrolled ? (
            <Button className="w-full" onClick={handleClick}>
              <Play className="h-4 w-4 mr-2" />
              Continue Learning
            </Button>
          ) : (
            <Button 
              className="w-full" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onEnroll?.(course.id)
              }}
            >
              Enroll Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// Course Grid
export function CourseGrid({
  courses,
  isLoading,
  onEnroll,
  onBookmark,
  bookmarkedIds = [],
}: {
  courses?: CourseCard[]
  isLoading?: boolean
  onEnroll?: (courseId: string) => void
  onBookmark?: (courseId: string) => void
  bookmarkedIds?: string[]
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="h-[380px]">
            <Skeleton className="h-40 w-full" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!courses?.length) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">No courses found</h3>
        <p className="text-muted-foreground">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {courses.map((course) => (
        <CourseCardComponent 
          key={course.id} 
          course={course}
          onEnroll={onEnroll}
          onBookmark={onBookmark}
          isBookmarked={bookmarkedIds.includes(course.id)}
        />
      ))}
    </div>
  )
}

// Featured Courses Carousel
export function FeaturedCourses({
  courses,
  isLoading,
}: {
  courses?: CourseCard[]
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-80 flex-shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const featured = courses?.filter(c => c.isFeatured).slice(0, 5) ?? []

  if (!featured.length) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-yellow-500" />
          Featured Courses
        </h2>
        <Button variant="ghost">
          View all
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {featured.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex-shrink-0 w-80"
          >
            <CourseCardComponent course={course} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// Course Discovery Page Component
export function CourseDiscovery() {
  const router = useRouter()
  const [filters, setFilters] = useState<CourseFilters>({
    search: '',
    level: 'all',
    language: 'all',
    sortBy: 'popular',
  })
  const [bookmarks, setBookmarks] = useState<string[]>([])

  // Fetch courses
  const { data: courses, isLoading } = useQuery<CourseCard[]>({
    queryKey: ['courses', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.level !== 'all') params.set('level', filters.level)
      if (filters.language !== 'all') params.set('language', filters.language)
      params.set('sort', filters.sortBy)
      
      const response = await api.get(`/courses?${params.toString()}`)
      return response.data
    },
  })

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    if (!courses) return []
    
    let result = [...courses]
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(c => 
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower) ||
        c.tags.some(t => t.toLowerCase().includes(searchLower))
      )
    }
    
    // Level filter
    if (filters.level !== 'all') {
      result = result.filter(c => c.level === filters.level)
    }
    
    // Language filter
    if (filters.language !== 'all') {
      result = result.filter(c => c.language === filters.language)
    }
    
    // Sort
    switch (filters.sortBy) {
      case 'newest':
        // Assuming newer courses have isNew flag
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
        break
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'trending':
        // Sort by recent enrollment trend
        result.sort((a, b) => b.enrolledCount - a.enrolledCount)
        break
      default: // popular
        result.sort((a, b) => b.enrolledCount - a.enrolledCount)
    }
    
    return result
  }, [courses, filters])

  // Handlers
  const handleEnroll = async (courseId: string) => {
    try {
      await api.post(`/enrollments/${courseId}`)
      router.push(`/courses/${courseId}`)
    } catch (error) {
      console.error('Failed to enroll:', error)
    }
  }

  const handleBookmark = (courseId: string) => {
    setBookmarks(prev => 
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Discover Courses</h1>
        <p className="text-muted-foreground mt-1">
          Find the perfect course to advance your programming skills
        </p>
      </div>

      {/* Featured Section */}
      <FeaturedCourses courses={courses} isLoading={isLoading} />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>

          {/* Level Filter */}
          <Select
            value={filters.level}
            onValueChange={(value) => setFilters(prev => ({ ...prev, level: value }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={filters.sortBy}
            onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Popular
                </div>
              </SelectItem>
              <SelectItem value="newest">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Newest
                </div>
              </SelectItem>
              <SelectItem value="rating">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Top Rated
                </div>
              </SelectItem>
              <SelectItem value="trending">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Courses</TabsTrigger>
          <TabsTrigger value="enrolled">My Courses</TabsTrigger>
          <TabsTrigger value="bookmarked">
            <Bookmark className="h-4 w-4 mr-1" />
            Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <CourseGrid
            courses={filteredCourses}
            isLoading={isLoading}
            onEnroll={handleEnroll}
            onBookmark={handleBookmark}
            bookmarkedIds={bookmarks}
          />
        </TabsContent>

        <TabsContent value="enrolled">
          <CourseGrid
            courses={filteredCourses.filter(c => c.isEnrolled)}
            isLoading={isLoading}
            onEnroll={handleEnroll}
            onBookmark={handleBookmark}
            bookmarkedIds={bookmarks}
          />
        </TabsContent>

        <TabsContent value="bookmarked">
          <CourseGrid
            courses={filteredCourses.filter(c => bookmarks.includes(c.id))}
            isLoading={isLoading}
            onEnroll={handleEnroll}
            onBookmark={handleBookmark}
            bookmarkedIds={bookmarks}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Export hooks
export function useCourses(filters?: Partial<CourseFilters>) {
  return useQuery<CourseCard[]>({
    queryKey: ['courses', filters],
    queryFn: async () => {
      const response = await api.get('/courses')
      return response.data
    },
  })
}

export function useRecommendedCourses(userId?: string) {
  return useQuery<CourseCard[]>({
    queryKey: ['recommended-courses', userId],
    queryFn: async () => {
      const response = await api.get(`/courses/recommended/${userId}`)
      return response.data
    },
    enabled: !!userId,
  })
}
