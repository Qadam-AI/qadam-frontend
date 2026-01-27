import { useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  Users,
  AlertTriangle,
  ChevronRight,
  BookOpen
} from 'lucide-react'
import { SurfaceCard } from '@/design-system/surfaces'
import { Stack, Grid } from '@/design-system/layout'
import { Heading, Text, LabelText } from '@/design-system/typography'
import { DrawerLayout } from '@/design-system/patterns/drawer-layout'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

interface ConceptAnalytics {
  concept_id: string
  concept_name: string
  course_id: string
  course_title: string
  total_students: number
  students_with_attempts: number
  struggling_count: number
  struggling_percentage: number
  avg_pass_rate: number
  total_attempts: number
}

interface StrugglingStudent {
  user_id: string
  user_name: string
  user_email: string
  total_attempts: number
  passed_attempts: number
  pass_rate: number
}

export function ConceptPerformanceList({ concepts }: { concepts: ConceptAnalytics[] }) {
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null)

  const selectedConcept = concepts.find(c => c.concept_id === selectedConceptId)

  // Fetch struggling students for selected concept
  const { data: strugglingStudents, isLoading: loadingStudents } = useQuery<StrugglingStudent[]>({
    queryKey: ['struggling-students', selectedConceptId],
    queryFn: async () => {
      if (!selectedConceptId) return []
      const res = await api.get(`/instructor/analytics/concepts/${selectedConceptId}/students`)
      // Ensure we always return an array
      return Array.isArray(res.data) ? res.data : (res.data?.struggling_students || [])
    },
    enabled: !!selectedConceptId,
  })

  // Group concepts by status
  const groupedConcepts = {
    critical: concepts.filter(c => c.struggling_percentage > 40),
    needsAttention: concepts.filter(c => c.struggling_percentage > 20 && c.struggling_percentage <= 40),
    good: concepts.filter(c => c.avg_pass_rate >= 70 && c.struggling_percentage <= 20),
    other: concepts.filter(c => c.avg_pass_rate < 70 && c.struggling_percentage <= 20),
  }

  const renderConceptCard = (concept: ConceptAnalytics, index: number) => {
    const isStruggling = concept.struggling_percentage > 30
    const isGood = concept.avg_pass_rate >= 70

    return (
      <motion.div
        key={concept.concept_id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        onClick={() => setSelectedConceptId(concept.concept_id)}
        className="cursor-pointer"
      >
        <SurfaceCard
          className="hover:shadow-md transition-all hover:border-primary/50"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-primary shrink-0" />
                <Heading level={5} className="truncate">{concept.concept_name}</Heading>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <BookOpen className="h-3 w-3" />
                <span>{concept.course_title}</span>
              </div>

              {/* Performance metrics */}
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <Text className="text-xs text-muted-foreground">Avg Pass Rate</Text>
                  <div className="flex items-center gap-1 mt-1">
                    {isGood ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : isStruggling ? (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    ) : null}
                    <Text className={`text-sm font-semibold ${
                      isGood ? 'text-green-600' : isStruggling ? 'text-red-600' : ''
                    }`}>
                      {Math.round(concept.avg_pass_rate)}%
                    </Text>
                  </div>
                </div>
                <div>
                  <Text className="text-xs text-muted-foreground">Total Attempts</Text>
                  <Text className="text-sm font-semibold mt-1">{concept.total_attempts}</Text>
                </div>
                <div>
                  <Text className="text-xs text-muted-foreground">Students</Text>
                  <Text className="text-sm font-semibold mt-1">
                    {concept.students_with_attempts}/{concept.total_students}
                  </Text>
                </div>
              </div>

              {/* Progress bar */}
              <Progress 
                value={concept.avg_pass_rate} 
                className="h-2"
              />
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              {isStruggling && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {concept.struggling_count} struggling
                </Badge>
              )}
              {isGood && !isStruggling && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  ✓ Mastered
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedConceptId(concept.concept_id)
                }}
              >
                View
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </SurfaceCard>
      </motion.div>
    )
  }

  return (
    <>
      <Stack gap="lg">
        {/* Critical - High Priority */}
        {groupedConcepts.critical.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <Heading level={4}>Critical - Immediate Attention Needed</Heading>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                {groupedConcepts.critical.length}
              </Badge>
            </div>
            <Stack gap="sm">
              {groupedConcepts.critical.map(renderConceptCard)}
            </Stack>
          </div>
        )}

        {/* Needs Attention */}
        {groupedConcepts.needsAttention.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <Heading level={4}>Needs Review</Heading>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                {groupedConcepts.needsAttention.length}
              </Badge>
            </div>
            <Stack gap="sm">
              {groupedConcepts.needsAttention.map(renderConceptCard)}
            </Stack>
          </div>
        )}

        {/* Performing Well */}
        {groupedConcepts.good.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <Heading level={4}>Performing Well</Heading>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {groupedConcepts.good.length}
              </Badge>
            </div>
            <Stack gap="sm">
              {groupedConcepts.good.slice(0, 5).map(renderConceptCard)}
            </Stack>
            {groupedConcepts.good.length > 5 && (
              <Text className="text-sm text-muted-foreground text-center pt-2">
                + {groupedConcepts.good.length - 5} more concepts performing well
              </Text>
            )}
          </div>
        )}
      </Stack>

      {/* Concept Detail Drawer */}
      {selectedConcept && (
        <DrawerLayout
          open={true}
          onClose={() => setSelectedConceptId(null)}
          title="Concept Performance"
          size="lg"
        >
          <Stack gap="lg">
            {/* Header */}
            <div>
              <Heading level={3} className="mb-2">{selectedConcept.concept_name}</Heading>
              <Text variant="muted" className="text-sm">{selectedConcept.course_title}</Text>
            </div>

            {/* Stats Grid */}
            <Grid cols={3} gap="md">
              <SurfaceCard variant="muted">
                <Text className="text-xs text-muted-foreground mb-1">Average Pass Rate</Text>
                <Text className="text-2xl font-bold">
                  {Math.round(selectedConcept.avg_pass_rate)}%
                </Text>
              </SurfaceCard>
              <SurfaceCard variant="muted">
                <Text className="text-xs text-muted-foreground mb-1">Total Attempts</Text>
                <Text className="text-2xl font-bold">{selectedConcept.total_attempts}</Text>
              </SurfaceCard>
              <SurfaceCard variant="muted">
                <Text className="text-xs text-muted-foreground mb-1">Struggling</Text>
                <Text className="text-2xl font-bold text-red-600">
                  {selectedConcept.struggling_count}
                </Text>
              </SurfaceCard>
            </Grid>

            {/* Struggling Students */}
            <div>
              <LabelText className="mb-3">Students Struggling with This Concept</LabelText>
              {loadingStudents ? (
                <Text className="text-sm text-muted-foreground">Loading...</Text>
              ) : !strugglingStudents || strugglingStudents.length === 0 ? (
                <SurfaceCard variant="muted">
                  <Text className="text-sm text-muted-foreground text-center py-4">
                    No struggling students
                  </Text>
                </SurfaceCard>
              ) : (
                <Stack gap="sm">
                  {strugglingStudents.map((student) => (
                    <SurfaceCard key={student.user_id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <Text className="font-medium text-sm">{student.user_name}</Text>
                          <Text className="text-xs text-muted-foreground">{student.user_email}</Text>
                        </div>
                        <div className="text-right">
                          <Text className="text-sm font-semibold text-red-600">
                            {Math.round(student.pass_rate)}% pass rate
                          </Text>
                          <Text className="text-xs text-muted-foreground">
                            {student.passed_attempts}/{student.total_attempts} passed
                          </Text>
                        </div>
                      </div>
                    </SurfaceCard>
                  ))}
                </Stack>
              )}
            </div>

            {/* Actions */}
            <div className="border-t pt-4">
              <Stack gap="sm">
                <Button
                  variant="default"
                  className="w-full gap-2"
                  onClick={() => {
                    window.location.href = `/instructor/ai-tools?concept=${selectedConcept.concept_id}`
                  }}
                >
                  Regenerate Questions for This Concept
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    window.location.href = `/instructor/question-bank?concept=${selectedConcept.concept_id}`
                  }}
                >
                  View Question Bank
                </Button>
              </Stack>
            </div>
          </Stack>
        </DrawerLayout>
      )}
    </>
  )
}
