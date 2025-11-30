'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Navbar } from '../_components/navbar'
import { Sidebar } from '../_components/sidebar'
import { Footer } from '../_components/footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AuthGuard } from '../_components/auth-guard'
import { motion } from 'framer-motion'
import { BookOpen, Play, GraduationCap, CheckCircle2 } from 'lucide-react'
import { DashboardSkeleton } from '../_components/skeletons'
import { EmptyState } from '../_components/empty-states'
import Link from 'next/link'
import { useTranslations } from '@/lib/i18n'
import { BookmarkButton } from '@/components/BookmarkButton'
import { SearchInput } from '@/components/SearchInput'

interface Lesson {
  id: string
  title: string
  position: number
}

interface Course {
  id: string
  title: string
  description: string | null
  lessons: Lesson[]
}

function LessonsContent() {
  const t = useTranslations('lessons')
  const tCommon = useTranslations('common')
  const tSearch = useTranslations('search')
  const [searchQuery, setSearchQuery] = useState('')
  // Fetch courses with lessons
  const { data: courses, isLoading, error } = useQuery<Course[]>({
    queryKey: ['courses-with-lessons'],
    queryFn: async () => {
      const coursesResponse = await api.get('/courses')
      const courseList = coursesResponse.data || []
      
      const coursesWithLessons: Course[] = []
      for (const course of courseList) {
        try {
          const courseResponse = await api.get(`/courses/${course.id}`)
          if (courseResponse.data) {
            coursesWithLessons.push({
              id: courseResponse.data.id,
              title: courseResponse.data.title,
              description: courseResponse.data.description,
              lessons: (courseResponse.data.lessons || []).sort(
                (a: Lesson, b: Lesson) => a.position - b.position
              ),
            })
          }
        } catch (e) {
          // Skip courses that fail to load
        }
      }
      
      return coursesWithLessons
    },
  })

  // Fetch completed lessons
  const { data: completedLessons } = useQuery<string[]>({
    queryKey: ['completed-lessons'],
    queryFn: async () => {
      const response = await api.get('/lessons/progress')
      return response.data
    },
  })

  const completedSet = new Set(completedLessons || [])

  // Filter courses and lessons based on search query
  const filteredCourses = useMemo(() => {
    if (!courses || !searchQuery.trim()) return courses

    const query = searchQuery.toLowerCase().trim()
    
    return courses.map(course => {
      // Check if course title matches
      const courseTitleMatches = course.title.toLowerCase().includes(query)
      
      // Filter lessons that match
      const matchingLessons = course.lessons.filter(lesson =>
        lesson.title.toLowerCase().includes(query)
      )
      
      // If course title matches, return all lessons. Otherwise, return only matching lessons.
      if (courseTitleMatches) {
        return course
      }
      
      if (matchingLessons.length > 0) {
        return {
          ...course,
          lessons: matchingLessons,
        }
      }
      
      return null
    }).filter((c): c is Course => c !== null && c.lessons.length > 0)
  }, [courses, searchQuery])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <DashboardSkeleton />
      </div>
    )
  }

  if (error || !courses) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <EmptyState
          title={tCommon('error')}
          description={tCommon('retry')}
        />
      </div>
    )
  }

  const totalLessons = courses?.reduce((acc, c) => acc + c.lessons.length, 0) || 0
  const totalCompleted = courses?.reduce(
    (acc, c) => acc + c.lessons.filter(l => completedSet.has(l.id)).length,
    0
  ) || 0
  
  const filteredLessonsCount = filteredCourses?.reduce((acc, c) => acc + c.lessons.length, 0) || 0

  if (totalLessons === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <EmptyState
          title={t('noLessons')}
          description={t('noLessonsDesc')}
          icon={<BookOpen className="h-12 w-12" />}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('progress', { completed: totalCompleted, total: totalLessons })}
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          className="max-w-md"
        />
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            {tSearch('results', { count: filteredLessonsCount, query: searchQuery })}
          </p>
        )}
      </motion.div>

      {/* No results state */}
      {searchQuery && filteredCourses?.length === 0 && (
        <EmptyState
          title={tSearch('noResults')}
          description={`"${searchQuery}"`}
          icon={<BookOpen className="h-12 w-12" />}
        />
      )}

      {/* Courses with Lessons */}
      {filteredCourses?.map((course, courseIndex) => {
        const courseCompleted = course.lessons.filter(l => completedSet.has(l.id)).length
        
        return (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: courseIndex * 0.1 }}
            className="space-y-4"
          >
            {/* Course Header */}
            <div className="flex items-center gap-3 pb-2 border-b">
              <div className="p-2 rounded-lg bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{course.title}</h2>
                {course.description && (
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {courseCompleted === course.lessons.length && course.lessons.length > 0 && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {tCommon('completed')}
                  </Badge>
                )}
                <Badge variant="secondary">
                  {courseCompleted}/{course.lessons.length} {t('lessonsLabel')}
                </Badge>
              </div>
            </div>

            {/* Lessons List */}
            {course.lessons.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {course.lessons.map((lesson, lessonIndex) => {
                  const isCompleted = completedSet.has(lesson.id)
                  
                  return (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: lessonIndex * 0.03 }}
                    >
                      <Link href={`/lesson/${lesson.id}`}>
                        <Card className={`hover:shadow-md transition-all cursor-pointer group ${isCompleted ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900' : 'hover:border-primary/30'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm ${isCompleted ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'}`}>
                                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : lesson.position}
                                </div>
                                <div>
                                  <h3 className={`font-medium group-hover:text-primary transition-colors ${isCompleted ? 'text-green-700 dark:text-green-400' : ''}`}>
                                    {lesson.title}
                                  </h3>
                                  {isCompleted && (
                                    <p className="text-xs text-green-600 dark:text-green-500">{tCommon('completed')}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <BookmarkButton lessonId={lesson.id} />
                                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Play className="h-4 w-4 mr-1" />
                                  {isCompleted ? t('review') : t('start')}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">{t('noLessonsInCourse')}</p>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

export default function LessonsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 lg:ml-64">
            <div className="max-w-4xl mx-auto">
              <LessonsContent />
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </AuthGuard>
  )
}

