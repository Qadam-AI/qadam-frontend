'use client'

import { useMemo, useCallback, useState } from 'react'
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
import { Maximize2, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCourseConceptMap } from '@/lib/api'
import api from '@/lib/api'
import { SurfaceCard } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Text } from '@/design-system/typography'

import { PerformanceConceptNode } from '../../../mastery/components/PerformanceConceptNode'

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
      return '#9ca3af' // gray-400
  }
}

function StudentConceptMapContent({
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

  // Fetch student performance
  const { data: performanceData, isLoading: loadingPerformance } = useQuery<StudentConceptPerformance[]>({
    queryKey: ['student-concept-performance', studentId, courseId],
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

  // Build graph
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
          
          // Color edge based on prerequisite mastery
          const edgeColor = sourcePerf?.status === 'strong' 
            ? 'hsl(142, 76%, 36%)' // green
            : sourcePerf?.status === 'weak'
            ? 'hsl(0, 84%, 60%)' // red (blocked by weak prereq)
            : 'hsl(var(--muted-foreground))'
          
          edges.push({
            id: `${prereqId}-${concept.id}`,
            source: prereqId,
            target: concept.id,
            type: 'smoothstep',
            animated: sourcePerf?.status !== 'strong',
            style: {
              stroke: edgeColor,
              strokeWidth: 2,
              opacity: sourcePerf?.status === 'strong' ? 0.6 : 0.4,
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

  // Calculate stats
  const stats = useMemo(() => {
    if (!performanceData) return { mastered: 0, learning: 0, struggling: 0, notStarted: 0 }
    return {
      mastered: performanceData.filter(p => p.status === 'strong').length,
      learning: performanceData.filter(p => p.status === 'ok').length,
      struggling: performanceData.filter(p => p.status === 'weak').length,
      notStarted: performanceData.filter(p => p.status === 'not-started').length,
    }
  }, [performanceData])

  if (loadingMap || loadingPerformance) {
    return <LoadingState message="Building performance map..." />
  }

  if (!mapData || mapData.concepts.length === 0) {
    return (
      <SurfaceCard variant="muted" className="py-12">
        <EmptyState
          icon={GitBranch}
          title="No concepts in this course"
          description="This course doesn't have any concepts yet"
        />
      </SurfaceCard>
    )
  }

  return (
    <div className="space-y-4">
      {/* Performance Summary Banner */}
      <SurfaceCard>
        <div className="flex items-center justify-between">
          <div>
            <Text className="text-sm text-muted-foreground mb-1">
              Student Learning Journey
            </Text>
            <Text className="font-semibold">
              Visual map showing mastery across all concepts in this course
            </Text>
          </div>
          <div className="flex items-center gap-4">
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
      <div className="h-[700px] border rounded-lg bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 relative overflow-hidden shadow-sm">
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
          <Background gap={16} size={1} color="#e5e7eb" />
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
          <Panel position="top-left" className="bg-white dark:bg-gray-950 border rounded-lg p-4 shadow-sm">
            <div className="space-y-2">
              <Text className="text-xs font-semibold mb-3">Student Performance</Text>
              <div className="flex flex-col gap-2">
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
              className="gap-2 bg-white dark:bg-gray-950 shadow-sm"
            >
              <Maximize2 className="h-4 w-4" />
              Fit view
            </Button>
          </Panel>

          {/* Course watermark */}
          <Panel position="bottom-right" className="opacity-50 pointer-events-none">
            <Text className="text-xs text-muted-foreground">
              Course Learning Path
            </Text>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  )
}

export function StudentConceptMap({
  studentId,
  courseId,
}: {
  studentId: string
  courseId: string
}) {
  return (
    <ReactFlowProvider>
      <StudentConceptMapContent studentId={studentId} courseId={courseId} />
    </ReactFlowProvider>
  )
}
