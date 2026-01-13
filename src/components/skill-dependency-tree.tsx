'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface SkillDependency {
  skill: string
  dependencies: string[]
  level?: number
}

interface SkillDependencyTreeProps {
  currentSkills?: string[]
  targetSkills?: string[]
}

export function SkillDependencyTree({ currentSkills = [], targetSkills = [] }: SkillDependencyTreeProps) {
  // Fetch skill dependencies
  const { data, isLoading } = useQuery({
    queryKey: ['skill-dependencies'],
    queryFn: async () => {
      const res = await api.get<{ dependencies: Record<string, string[]> }>('/llm/learning-paths/skills/dependencies')
      return res.data.dependencies
    },
  })

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (!data) {
    return null
  }

  // Build tree structure
  const skills = Object.keys(data)
  
  // Calculate levels for each skill
  const getLevel = (skill: string, visited: Set<string> = new Set()): number => {
    if (visited.has(skill)) return 0
    visited.add(skill)
    
    const deps = data[skill] || []
    if (deps.length === 0) return 0
    return 1 + Math.max(...deps.map(d => getLevel(d, visited)))
  }

  const skillLevels = skills.map(skill => ({
    skill,
    level: getLevel(skill),
    dependencies: data[skill] || [],
  }))

  // Guard against empty array
  if (skillLevels.length === 0) {
    return null
  }

  // Group by level
  const maxLevel = Math.max(...skillLevels.map(s => s.level ?? 0))
  const levels: Record<number, SkillDependency[]> = {}
  
  for (let i = 0; i <= maxLevel; i++) {
    levels[i] = skillLevels.filter(s => s.level === i)
  }

  const getSkillStatus = (skill: string) => {
    if (currentSkills.includes(skill)) return 'completed'
    if (targetSkills.includes(skill)) return 'target'
    return 'locked'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white'
      case 'target': return 'bg-blue-500 text-white'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Skill Dependency Tree</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(levels).reverse().map(([level, skillsAtLevel]) => (
            <div key={level} className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs">
                  Level {parseInt(level) + 1}
                </Badge>
                <div className="flex-1 h-px bg-border" />
              </div>
              
              <div className="flex flex-wrap gap-3">
                {skillsAtLevel.map((skillData, index) => {
                  const status = getSkillStatus(skillData.skill)
                  
                  return (
                    <motion.div
                      key={skillData.skill}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div 
                        className={`relative px-4 py-2 rounded-lg border-2 transition-all ${
                          status === 'completed' 
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                            : status === 'target'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                          <span className="font-medium text-sm">{skillData.skill}</span>
                        </div>
                        
                        {skillData.dependencies.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {skillData.dependencies.map(dep => (
                              <Badge 
                                key={dep} 
                                variant="secondary" 
                                className="text-xs"
                              >
                                ← {dep}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span className="text-muted-foreground">Locked</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SkillDependencyTree
