'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Edit3,
  Plus,
  ChevronLeft,
  Layers,
  GitBranch,
  Filter,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import {
  getCourseConceptMap,
  reorderLessons,
  reorderConceptsInLesson,
  updateConcept,
  addConceptToLesson,
  removeConceptFromLesson,
  type ConceptMapNode,
  type LessonMapLane,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageShell, Section, Stack } from '@/design-system/layout'
import { SurfaceCard } from '@/design-system/surfaces'
import { LoadingState, EmptyState } from '@/design-system/feedback'
import { Heading, Text, LabelText } from '@/design-system/typography'

import { ConceptNode } from './components/ConceptNode'
import { ConceptDetailSheet } from './components/ConceptDetailSheet'
import { EditConceptModal } from './components/EditConceptModal'
import { AddConceptModal } from './components/AddConceptModal'

// Constants for layout
const LANE_WIDTH = 350
const NODE_HEIGHT = 120
const NODE_SPACING = 20

// Node type for custom concept nodes
const nodeTypes = {
  concept: ConceptNode,
}

// Helper: Get difficulty color
function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
    case 'hard':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
    default:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
  }
}

// Helper: Build nodes and edges from API data
function buildGraphData(
  lessons: LessonMapLane[],
  concepts: ConceptMapNode[],
  searchTerm: string,
  filterMode: string
) {
  const filterModeConcepts = (() => {
    switch (filterMode) {
      case 'prereqs':
        return concepts.filter((c) => c.prereq_ids.length > 0)
      case 'isolated':
        return concepts.filter((c) => c.prereq_ids.length === 0)
      default:
        return concepts
    }
  })()

  // Filter concepts by search
  const filteredConcepts = searchTerm
    ? filterModeConcepts.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filterModeConcepts

  // Build nodes
  const nodes: Node[] = []
  const edges: Edge[] = []
  const placedConceptIds = new Set<string>()

  // Lane layout: each lesson is a vertical lane
  lessons.forEach((lesson, laneIndex) => {
    // Get concepts for this lesson
    const laneConcepts = filteredConcepts.filter((c) =>
      c.lesson_ids.includes(lesson.id)
    )

    // Sort by position within lesson
    laneConcepts.sort((a, b) => {
      const posA = a.position_in_lessons[lesson.id] || 0
      const posB = b.position_in_lessons[lesson.id] || 0
      return posA - posB
    })

    // Create nodes
    laneConcepts.forEach((concept, index) => {
      nodes.push({
        id: concept.id,
        type: 'concept',
        position: {
          x: laneIndex * LANE_WIDTH + 50,
          y: index * (NODE_HEIGHT + NODE_SPACING) + 100,
        },
        data: {
          concept,
          lessonTitle: lesson.title,
          lessonId: lesson.id,
        },
      })
      placedConceptIds.add(concept.id)
    })
  })

  // Add unmapped concepts in a separate lane
  const unmappedConcepts = filteredConcepts.filter(
    (c) => !placedConceptIds.has(c.id)
  )

  if (unmappedConcepts.length > 0) {
    const unmappedLaneIndex = lessons.length
    unmappedConcepts.forEach((concept, index) => {
      nodes.push({
        id: concept.id,
        type: 'concept',
        position: {
          x: unmappedLaneIndex * LANE_WIDTH + 50,
          y: index * (NODE_HEIGHT + NODE_SPACING) + 100,
        },
        data: {
          concept,
          lessonTitle: 'Not Assigned',
          lessonId: null,
        },
      })
    })
  }

  // Build prerequisite edges
  filteredConcepts.forEach((concept) => {
    concept.prereq_ids.forEach((prereqId) => {
      // Only add edge if both nodes exist in filtered set
      if (
        nodes.find((n) => n.id === concept.id) &&
        nodes.find((n) => n.id === prereqId)
      ) {
        edges.push({
          id: `${prereqId}-${concept.id}`,
          source: prereqId,
          target: concept.id,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: 'hsl(var(--muted-foreground))',
            strokeWidth: 2,
          },
          markerEnd: {
            type: 'arrowclosed',
            color: 'hsl(var(--muted-foreground))',
          },
        })
      }
    })
  })

  return { nodes, edges }
}

function ConceptMapContent() {
  const params = useParams<{ courseId: string }>()
  const router = useRouter()
  const courseId = params?.courseId || ''
  const queryClient = useQueryClient()
  const { fitView, zoomIn, zoomOut } = useReactFlow()

  // State
  const [isEditMode, setIsEditMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState('all')
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null)
  const [editingConceptId, setEditingConceptId] = useState<string | null>(null)
  const [addingToLessonId, setAddingToLessonId] = useState<string | null>(null)

  // Fetch concept map data
  const { data: mapData, isLoading } = useQuery({
    queryKey: ['conceptMap', courseId],
    queryFn: () => getCourseConceptMap(courseId),
  })

  // Build nodes and edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!mapData) return { nodes: [], edges: [] }
    return buildGraphData(mapData.lessons, mapData.concepts, searchTerm, filterMode)
  }, [mapData, searchTerm, filterMode])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes/edges when data changes
  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // Get selected concept
  const selectedConcept = useMemo(() => {
    if (!selectedConceptId || !mapData) return null
    return mapData.concepts.find((c) => c.id === selectedConceptId) || null
  }, [selectedConceptId, mapData])

  // Handle node click
  const onNodeClick = useCallback((_event: any, node: Node) => {
    setSelectedConceptId(node.id)
  }, [])

  // Handle fit view
  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 })
  }, [fitView])

  // Mutations
  const reorderLessonsMutation = useMutation({
    mutationFn: (lessonIds: string[]) => reorderLessons(courseId, lessonIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conceptMap', courseId] })
      toast.success('Lessons reordered')
    },
    onError: () => {
      toast.error('Failed to reorder lessons')
    },
  })

  const reorderConceptsMutation = useMutation({
    mutationFn: ({
      lessonId,
      conceptIds,
    }: {
      lessonId: string
      conceptIds: string[]
    }) => reorderConceptsInLesson(courseId, lessonId, conceptIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conceptMap', courseId] })
      toast.success('Concepts reordered')
    },
    onError: () => {
      toast.error('Failed to reorder concepts')
    },
  })

  const updateConceptMutation = useMutation({
    mutationFn: ({
      conceptId,
      data,
    }: {
      conceptId: string
      data: {
        name?: string
        description?: string
        difficulty?: 'easy' | 'medium' | 'hard'
        prereq_ids?: string[]
      }
    }) => updateConcept(courseId, conceptId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conceptMap', courseId] })
      toast.success('Concept updated')
      setEditingConceptId(null)
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to update concept'
      toast.error(message)
    },
  })

  const addConceptMutation = useMutation({
    mutationFn: ({
      lessonId,
      conceptId,
    }: {
      lessonId: string
      conceptId: string
    }) => addConceptToLesson(courseId, lessonId, conceptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conceptMap', courseId] })
      toast.success('Concept added to lesson')
      setAddingToLessonId(null)
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to add concept'
      toast.error(message)
    },
  })

  const removeConceptMutation = useMutation({
    mutationFn: ({
      lessonId,
      conceptId,
    }: {
      lessonId: string
      conceptId: string
    }) => removeConceptFromLesson(courseId, lessonId, conceptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conceptMap', courseId] })
      toast.success('Concept removed from lesson')
      setSelectedConceptId(null)
    },
    onError: () => {
      toast.error('Failed to remove concept')
    },
  })

  if (isLoading) {
    return (
      <PageShell maxWidth="full">
        <LoadingState message="Loading concept map..." />
      </PageShell>
    )
  }

  if (!mapData || mapData.concepts.length === 0) {
    return (
      <PageShell maxWidth="full">
        <Section>
          <EmptyState
            icon={GitBranch}
            title="No concepts yet"
            description="Start by extracting concepts from your course content."
            action={{
              label: 'Go to Content Structuring',
              href: `/instructor/ai-tools`,
            }}
          />
        </Section>
      </PageShell>
    )
  }

  return (
    <PageShell maxWidth="full" className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-950">
        <div className="px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link
              href="/instructor/courses"
              className="hover:text-foreground transition-colors"
            >
              My Courses
            </Link>
            <ChevronLeft className="h-4 w-4 rotate-180" />
            <Link
              href={`/instructor/courses/${courseId}`}
              className="hover:text-foreground transition-colors"
            >
              {mapData.course_title}
            </Link>
            <ChevronLeft className="h-4 w-4 rotate-180" />
            <span className="text-foreground">Concept Map</span>
          </div>

          {/* Title and controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitBranch className="h-6 w-6 text-primary" />
              <Heading level={2}>Concept Map</Heading>
              <Badge variant="secondary" className="ml-2">
                {mapData.concepts.length} concepts
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search concepts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>

              {/* Filter */}
              <Select value={filterMode} onValueChange={setFilterMode}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All concepts</SelectItem>
                  <SelectItem value="prereqs">With prerequisites</SelectItem>
                  <SelectItem value="isolated">Without prerequisites</SelectItem>
                </SelectContent>
              </Select>

              {/* Fit view */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleFitView}
                className="gap-2"
              >
                <Maximize2 className="h-4 w-4" />
                Fit view
              </Button>

              {/* Edit mode toggle */}
              <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-muted/50">
                <Switch
                  checked={isEditMode}
                  onCheckedChange={setIsEditMode}
                  id="edit-mode"
                />
                <LabelText htmlFor="edit-mode" className="cursor-pointer">
                  <Edit3 className="h-4 w-4 inline mr-1" />
                  Edit mode
                </LabelText>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
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
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(node) => {
              const concept = mapData.concepts.find((c) => c.id === node.id)
              if (!concept) return '#ccc'
              switch (concept.difficulty) {
                case 'easy':
                  return '#10b981'
                case 'hard':
                  return '#ef4444'
                default:
                  return '#f59e0b'
              }
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
              <Text className="text-xs font-semibold mb-2">Difficulty</Text>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <Text className="text-xs">Easy</Text>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-500" />
                  <Text className="text-xs">Medium</Text>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <Text className="text-xs">Hard</Text>
                </div>
              </div>
            </div>
          </Panel>

          {/* Lesson lanes indicator */}
          <Panel position="bottom-left" className="bg-white dark:bg-gray-950 border rounded-lg p-3 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-4 w-4 text-primary" />
                <Text className="text-xs font-semibold">Lessons</Text>
              </div>
              <div className="flex flex-col gap-1">
                {mapData.lessons.map((lesson, index) => (
                  <div key={lesson.id} className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-primary/30 rounded-full" />
                    <div>
                      <Text className="text-xs font-medium">{lesson.title}</Text>
                      <Text className="text-xs text-muted-foreground">
                        {lesson.concept_count} concepts
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Detail sheet */}
      {selectedConcept && (
        <ConceptDetailSheet
          concept={selectedConcept}
          lessons={mapData.lessons}
          allConcepts={mapData.concepts}
          isEditMode={isEditMode}
          courseId={courseId}
          onClose={() => setSelectedConceptId(null)}
          onEdit={() => setEditingConceptId(selectedConcept.id)}
          onRemoveFromLesson={(lessonId) => {
            removeConceptMutation.mutate({
              lessonId,
              conceptId: selectedConcept.id,
            })
          }}
        />
      )}

      {/* Edit modal */}
      {editingConceptId && (
        <EditConceptModal
          concept={mapData.concepts.find((c) => c.id === editingConceptId)!}
          allConcepts={mapData.concepts}
          onClose={() => setEditingConceptId(null)}
          onSave={(data) => {
            updateConceptMutation.mutate({
              conceptId: editingConceptId,
              data,
            })
          }}
          isLoading={updateConceptMutation.isPending}
        />
      )}
    </PageShell>
  )
}

export default function ConceptMapPage() {
  return (
    <ReactFlowProvider>
      <ConceptMapContent />
    </ReactFlowProvider>
  )
}
