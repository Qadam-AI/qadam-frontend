'use client'

import { useMemo, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion } from 'framer-motion'
import { Maximize2, TrendingUp, TrendingDown, Minus, AlertCircle, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCourseConceptMap, type ConceptMapNode, type LessonMapLane } from '@/lib/api'
import api from '@/lib/api'
import { SurfaceCard } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'
import { Stack } from '@/design-system/layout'

import { PerformanceConceptNode } from './PerformanceConceptNode'

const LANE_WIDTH = 350
const NODE_HEIGHT = 130

const nodeTypes = {
  performanceConcept: PerformanceConceptNode,
}

interface StudentConceptPerformance {
  concept_id: string
  concept_name: string
  course_title: string
  total_attempts: number
  passed_attempts: number
  pass_rate: number
  status: 'not-started' | 'weak' | 'ok' | 'strong'
  last_attempt: string | null
}

function getPerformanceColor(status: string) {
  switch (status) {
    case 'strong':
      return '#10b981' // green-500
    case 'ok':
      return '#f59e0b' // yellow-500
    case 'weak':
      return '#ef4444' // red-500
    default:
      return '#9ca3af' // gray-400 (not started)
  }
}

function getPerformanceLabel(status: string) {
  switch (status) {
    case 'strong':
      return 'Mastered'
    case 'ok':
      return 'Learning'
    case 'weak':
      return 'Struggling'
    default:
      return 'Not Started'
  }
}

function StudentPerformanceMapContent({
  studentId,
  courseId,
}: {
  studentId: string
  courseId: string
}) {
  const { fitView } = useReactFlow()
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null)

  // Fetch concept map structure
  const { data: mapData, isLoading: loadingMap } = useQuery({
    queryKey: ['conceptMap', courseId],
    queryFn: () => getCourseConceptMap(courseId),
  })

  // Fetch student performance data
  const { data: performanceData, isLoading: loadingPerformance } = useQuery<StudentConceptPerformance[]>({
    queryKey: ['student-performance', studentId, courseId],
    queryFn: async () => {
      const res = await api.get(`/instructor/analytics/students/${studentId}/concepts?course_id=${courseId}`)
      return res.data
    },
  })

  // Build performance map
  const performanceMap = useMemo(() => {
    if (!performanceData) return new Map<string, StudentConceptPerformance>()
    const map = new Map<string, StudentConceptPerformance>()
    performanceData.forEach((p) => map.set(p.concept_id, p))
    return map
  }, [performanceData])

  // Build nodes and edges with performance overlay
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!mapData) return { nodes: [], edges: [] }

    const nodes: Node[] = []
    const edges: Edge[] = []
    const placedConceptIds = new Set<string>()

    // Lane layout - Process lessons
    mapData.lessons.forEach((lesson, laneIndex) => {
      const laneConcepts = mapData.concepts.filter((c) =>
        c.lesson_ids.includes(lesson.id)
      )

      laneConcepts.sort((a, b) => {
        const posA = a.position_in_lessons[lesson.id] || 0
        const posB = b.position_in_lessons[lesson.id] || 0
        return posA - posB
      })

      laneConcepts.forEach((concept, index) => {
        const performance = performanceMap.get(concept.id)
        placedConceptIds.add(concept.id)
        
        nodes.push({
          id: concept.id,
          type: 'performanceConcept',
          position: {
            x: laneIndex * LANE_WIDTH + 50,
            y: index * (NODE_HEIGHT + 20) + 100,
          },
          data: {
            concept,
            lessonTitle: lesson.title,
            performance: performance || {
              status: 'not-started',
              total_attempts: 0,
              passed_attempts: 0,
              pass_rate: 0,
            },
          },
        })
      })
    })

    // Add unmapped concepts in a separate lane
    const unmappedConcepts = mapData.concepts.filter(c => !placedConceptIds.has(c.id))
    if (unmappedConcepts.length > 0) {
      const unmappedLaneIndex = mapData.lessons.length
      unmappedConcepts.forEach((concept, index) => {
        const performance = performanceMap.get(concept.id)
        placedConceptIds.add(concept.id)
        
        nodes.push({
          id: concept.id,
          type: 'performanceConcept',
          position: {
            x: unmappedLaneIndex * LANE_WIDTH + 50,
            y: index * (NODE_HEIGHT + 20) + 100,
          },
          data: {
            concept,
            lessonTitle: 'Unmapped',
            performance: performance || {
              status: 'not-started',
              total_attempts: 0,
              passed_attempts: 0,
              pass_rate: 0,
            },
          },
        })
      })
    }

    // Build prerequisite edges
    mapData.concepts.forEach((concept) => {
      concept.prereq_ids.forEach((prereqId) => {
        if (
          nodes.find((n) => n.id === concept.id) &&
          nodes.find((n) => n.id === prereqId)
        ) {
          const sourcePerf = performanceMap.get(prereqId)
          const targetPerf = performanceMap.get(concept.id)
          
          // Color edge based on whether prerequisite is mastered
          const edgeColor = sourcePerf?.status === 'strong' 
            ? 'hsl(142, 76%, 36%)' // green if prereq mastered
            : 'hsl(var(--muted-foreground))'
          
          edges.push({
            id: `${prereqId}-${concept.id}`,
            source: prereqId,
            target: concept.id,
            type: 'smoothstep',
            animated: sourcePerf?.status !== 'strong', // animate if prereq not mastered
            style: {
              stroke: edgeColor,
              strokeWidth: 2,
              opacity: sourcePerf?.status === 'strong' ? 0.6 : 0.3,
            },
            markerEnd: {
              type: 'arrowclosed',
              color: edgeColor,
            },
          })
        }
      })
    })

    return { nodes, edges }
  }, [mapData, performanceMap])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes when data changes
  useMemo(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 })
  }, [fitView])

  const onNodeClick = useCallback((_event: any, node: Node) => {
    setSelectedConceptId(node.id)
  }, [])

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!performanceData) return { mastered: 0, learning: 0, struggling: 0, notStarted: 0 }
    return {
      mastered: performanceData.filter(p => p.status === 'strong').length,
      learning: performanceData.filter(p => p.status === 'ok').length,
      struggling: performanceData.filter(p => p.status === 'weak').length,
      notStarted: performanceData.filter(p => p.status === 'not-started').length,
    }
  }, [performanceData])

  const selectedPerformance = selectedConceptId 
    ? performanceMap.get(selectedConceptId)
    : null

  if (loadingMap || loadingPerformance) {
    return <LoadingState message="Loading performance map..." />
  }

  if (!mapData || mapData.concepts.length === 0) {
    return (
      <SurfaceCard variant="muted" className="py-12">
        <EmptyState
          icon={GitBranch}
          title="No concepts in this course"
          description="This course doesn't have any concepts yet. Extract concepts from lesson content first."
        />
      </SurfaceCard>
    )
  }

  return (
    <div className="space-y-4">
      {/* Student Performance Summary */}
      <SurfaceCard>
        <div className="flex items-center justify-between">
          <div>
            <Heading level={4} className="mb-1">Performance Overview</Heading>
            <Text variant="muted" className="text-sm">
              Visual map of student understanding across all concepts
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <Text className="text-sm">{stats.mastered} mastered</Text>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <Text className="text-sm">{stats.learning} learning</Text>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <Text className="text-sm">{stats.struggling} struggling</Text>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <Text className="text-sm">{stats.notStarted} not started</Text>
            </div>
          </div>
        </div>
      </SurfaceCard>

      {/* Performance Map Canvas */}
      <div className="h-[600px] border rounded-lg bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(node) => {
              const perf = performanceMap.get(node.id)
              return getPerformanceColor(perf?.status || 'not-started')
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
            }}
          />

          {/* Legend */}
          <Panel position="top-left" className="bg-white dark:bg-gray-950 border rounded-lg p-3 shadow-sm">
            <div className="space-y-2">
              <Text className="text-xs font-semibold mb-2">Performance</Text>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <Text className="text-xs">Mastered (≥80%)</Text>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-500" />
                  <Text className="text-xs">Learning (50-79%)</Text>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <Text className="text-xs">Struggling (&lt;50%)</Text>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-400" />
                  <Text className="text-xs">Not Started</Text>
                </div>
              </div>
            </div>
          </Panel>

          {/* Fit view button */}
          <Panel position="top-right">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFitView}
              className="gap-2 bg-white dark:bg-gray-950"
            >
              <Maximize2 className="h-4 w-4" />
              Fit view
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Selected Concept Detail */}
      {selectedPerformance && (
        <SurfaceCard>
          <Stack gap="md">
            <div className="flex items-start justify-between">
              <div>
                <Heading level={4}>{selectedPerformance.concept_name}</Heading>
                <Text variant="muted" className="text-sm mt-1">
                  Performance details for this concept
                </Text>
              </div>
              <Badge
                variant="outline"
                className={
                  selectedPerformance.status === 'strong'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : selectedPerformance.status === 'ok'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : selectedPerformance.status === 'weak'
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }
              >
                {getPerformanceLabel(selectedPerformance.status)}
              </Badge>
            </div>

            <div className="grid grid-cols-4 gap-4 pt-3 border-t">
              <div>
                <Text className="text-xs text-muted-foreground mb-1">Attempts</Text>
                <Text className="text-lg font-semibold">{selectedPerformance.total_attempts}</Text>
              </div>
              <div>
                <Text className="text-xs text-muted-foreground mb-1">Passed</Text>
                <Text className="text-lg font-semibold text-green-600">
                  {selectedPerformance.passed_attempts}
                </Text>
              </div>
              <div>
                <Text className="text-xs text-muted-foreground mb-1">Pass Rate</Text>
                <Text className="text-lg font-semibold">
                  {Math.round(selectedPerformance.pass_rate)}%
                </Text>
              </div>
              <div>
                <Text className="text-xs text-muted-foreground mb-1">Last Attempt</Text>
                <Text className="text-sm">
                  {selectedPerformance.last_attempt
                    ? new Date(selectedPerformance.last_attempt).toLocaleDateString()
                    : 'Never'}
                </Text>
              </div>
            </div>
          </Stack>
        </SurfaceCard>
      )}
    </div>
  )
}

export function StudentPerformanceMap({
  studentId,
  courseId,
}: {
  studentId: string
  courseId: string
}) {
  return (
    <ReactFlowProvider>
      <StudentPerformanceMapContent studentId={studentId} courseId={courseId} />
    </ReactFlowProvider>
  )
}
