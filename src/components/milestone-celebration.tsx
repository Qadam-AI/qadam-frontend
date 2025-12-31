'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, Star, Zap, Crown, Target, Flame, 
  BookOpen, GraduationCap, Medal, Award, Sparkles,
  Share2, X
} from 'lucide-react'

export type MilestoneType = 
  | 'first_lesson'
  | 'first_task'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'course_complete'
  | 'mastery_achieved'
  | 'level_up'
  | 'badge_earned'
  | 'perfect_score'
  | 'xp_milestone'
  | 'first_course'
  | 'collaboration'

interface MilestoneConfig {
  icon: React.ReactNode
  title: string
  subtitle: string
  description: string
  color: string
  gradient: string
  confettiColors: string[]
  xpReward?: number
}

const MILESTONE_CONFIGS: Record<MilestoneType, MilestoneConfig> = {
  first_lesson: {
    icon: <BookOpen className="h-16 w-16" />,
    title: 'First Steps! 🎉',
    subtitle: 'Lesson Completed',
    description: 'You completed your first lesson! The journey of a thousand miles begins with a single step.',
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-500',
    confettiColors: ['#3B82F6', '#06B6D4', '#22D3EE'],
    xpReward: 50,
  },
  first_task: {
    icon: <Target className="h-16 w-16" />,
    title: 'Challenge Accepted! 💪',
    subtitle: 'Task Completed',
    description: 'You solved your first coding challenge! Keep pushing your limits.',
    color: 'text-green-500',
    gradient: 'from-green-500 to-emerald-500',
    confettiColors: ['#22C55E', '#10B981', '#34D399'],
    xpReward: 100,
  },
  streak_7: {
    icon: <Flame className="h-16 w-16" />,
    title: '7-Day Streak! 🔥',
    subtitle: 'Consistency Champion',
    description: 'A week of learning! Consistency is the key to mastery.',
    color: 'text-orange-500',
    gradient: 'from-orange-500 to-red-500',
    confettiColors: ['#F97316', '#EF4444', '#DC2626'],
    xpReward: 200,
  },
  streak_30: {
    icon: <Flame className="h-16 w-16" />,
    title: '30-Day Streak! 🔥🔥',
    subtitle: 'Dedication Master',
    description: 'A whole month of learning! You\'re building an incredible habit.',
    color: 'text-orange-600',
    gradient: 'from-orange-600 to-red-600',
    confettiColors: ['#EA580C', '#DC2626', '#B91C1C'],
    xpReward: 500,
  },
  streak_100: {
    icon: <Crown className="h-16 w-16" />,
    title: '100-Day Streak! 👑',
    subtitle: 'Legendary Learner',
    description: 'Incredible! 100 days of continuous learning. You\'re an inspiration!',
    color: 'text-yellow-500',
    gradient: 'from-yellow-500 to-amber-500',
    confettiColors: ['#EAB308', '#F59E0B', '#FBBF24'],
    xpReward: 2000,
  },
  course_complete: {
    icon: <GraduationCap className="h-16 w-16" />,
    title: 'Course Complete! 🎓',
    subtitle: 'Knowledge Acquired',
    description: 'You\'ve mastered an entire course! Your skills have leveled up.',
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-pink-500',
    confettiColors: ['#A855F7', '#EC4899', '#F472B6'],
    xpReward: 500,
  },
  mastery_achieved: {
    icon: <Star className="h-16 w-16" />,
    title: 'Mastery Achieved! ⭐',
    subtitle: 'Expert Status',
    description: 'You\'ve achieved mastery in a concept! True expertise takes dedication.',
    color: 'text-yellow-500',
    gradient: 'from-yellow-400 to-orange-500',
    confettiColors: ['#FACC15', '#FB923C', '#F97316'],
    xpReward: 300,
  },
  level_up: {
    icon: <Zap className="h-16 w-16" />,
    title: 'Level Up! ⚡',
    subtitle: 'New Level Reached',
    description: 'Your experience has grown! New challenges await at this level.',
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-violet-500',
    confettiColors: ['#3B82F6', '#8B5CF6', '#A78BFA'],
    xpReward: 150,
  },
  badge_earned: {
    icon: <Medal className="h-16 w-16" />,
    title: 'Badge Earned! 🏅',
    subtitle: 'Achievement Unlocked',
    description: 'You\'ve earned a new badge! Collect them all to show your expertise.',
    color: 'text-amber-500',
    gradient: 'from-amber-500 to-yellow-500',
    confettiColors: ['#F59E0B', '#EAB308', '#FBBF24'],
    xpReward: 100,
  },
  perfect_score: {
    icon: <Award className="h-16 w-16" />,
    title: 'Perfect Score! 💯',
    subtitle: 'Flawless Victory',
    description: 'You got a perfect score! No mistakes, pure excellence.',
    color: 'text-green-500',
    gradient: 'from-green-500 to-teal-500',
    confettiColors: ['#22C55E', '#14B8A6', '#2DD4BF'],
    xpReward: 200,
  },
  xp_milestone: {
    icon: <Sparkles className="h-16 w-16" />,
    title: 'XP Milestone! ✨',
    subtitle: 'Experience Growing',
    description: 'You\'ve reached a new XP milestone! Keep climbing the leaderboard.',
    color: 'text-indigo-500',
    gradient: 'from-indigo-500 to-purple-500',
    confettiColors: ['#6366F1', '#A855F7', '#C084FC'],
    xpReward: 50,
  },
  first_course: {
    icon: <BookOpen className="h-16 w-16" />,
    title: 'Course Created! 📚',
    subtitle: 'Instructor Journey Begins',
    description: 'You\'ve created your first course! Time to share your knowledge.',
    color: 'text-teal-500',
    gradient: 'from-teal-500 to-cyan-500',
    confettiColors: ['#14B8A6', '#06B6D4', '#22D3EE'],
    xpReward: 300,
  },
  collaboration: {
    icon: <Trophy className="h-16 w-16" />,
    title: 'Team Player! 🤝',
    subtitle: 'Collaboration Success',
    description: 'You completed a collaboration session! Learning together is powerful.',
    color: 'text-pink-500',
    gradient: 'from-pink-500 to-rose-500',
    confettiColors: ['#EC4899', '#F43F5E', '#FB7185'],
    xpReward: 150,
  },
}

interface MilestoneCelebrationProps {
  isOpen: boolean
  onClose: () => void
  type: MilestoneType
  customData?: {
    title?: string
    description?: string
    badgeName?: string
    level?: number
    xp?: number
    courseName?: string
    conceptName?: string
  }
}

export function MilestoneCelebration({ 
  isOpen, 
  onClose, 
  type, 
  customData 
}: MilestoneCelebrationProps) {
  const [showContent, setShowContent] = useState(false)
  const config = MILESTONE_CONFIGS[type]

  useEffect(() => {
    if (isOpen) {
      // Delay content for animation
      setTimeout(() => setShowContent(true), 100)
    } else {
      setShowContent(false)
    }
  }, [isOpen])

  const handleShare = () => {
    const text = `I just ${config.subtitle.toLowerCase()} on QADAM! 🎉 ${config.title}`
    if (navigator.share) {
      navigator.share({ text, url: window.location.origin })
    } else {
      navigator.clipboard.writeText(text)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <AnimatePresence>
          {showContent && (
            <>
              {/* Background gradient */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-10`}
              />

              {/* CSS Confetti */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      y: -20, 
                      x: Math.random() * 400 - 200,
                      rotate: 0,
                      opacity: 1 
                    }}
                    animate={{ 
                      y: 400, 
                      rotate: Math.random() * 360,
                      opacity: 0 
                    }}
                    transition={{ 
                      duration: 2 + Math.random() * 2,
                      delay: Math.random() * 0.5,
                      ease: "easeOut"
                    }}
                    className={`absolute w-3 h-3 rounded-sm`}
                    style={{ 
                      left: `${Math.random() * 100}%`,
                      backgroundColor: config.confettiColors[i % config.confettiColors.length]
                    }}
                  />
                ))}
              </div>

              <DialogHeader className="relative z-10">
                <DialogTitle className="sr-only">{config.title}</DialogTitle>
              </DialogHeader>

              <div className="relative z-10 text-center py-6">
                {/* Icon with animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 260, 
                    damping: 20,
                    delay: 0.2 
                  }}
                  className={`inline-flex p-6 rounded-full bg-gradient-to-br ${config.gradient} text-white mb-6`}
                >
                  {config.icon}
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl font-bold mb-2"
                >
                  {customData?.title || config.title}
                </motion.h2>

                {/* Subtitle badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mb-4"
                >
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    {customData?.badgeName || customData?.conceptName || customData?.courseName || config.subtitle}
                  </Badge>
                </motion.div>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-muted-foreground mb-6"
                >
                  {customData?.description || config.description}
                </motion.p>

                {/* XP Reward */}
                {(config.xpReward || customData?.xp) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 mb-6"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span className="font-bold">+{customData?.xp || config.xpReward} XP</span>
                  </motion.div>
                )}

                {/* Level indicator */}
                {customData?.level && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mb-6"
                  >
                    <p className="text-sm text-muted-foreground mb-2">Level Progress</p>
                    <div className="flex items-center justify-center gap-4">
                      <span className="text-2xl font-bold">Lv.{customData.level}</span>
                      <Progress value={75} className="w-32 h-3" />
                      <span className="text-sm text-muted-foreground">→ Lv.{customData.level + 1}</span>
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="flex gap-3 justify-center"
                >
                  <Button onClick={handleShare} variant="outline" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <Button onClick={onClose} className={`bg-gradient-to-r ${config.gradient} text-white`}>
                    Continue
                  </Button>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

// Hook to trigger celebrations
export function useMilestoneCelebration() {
  const [celebration, setCelebration] = useState<{
    isOpen: boolean
    type: MilestoneType
    customData?: MilestoneCelebrationProps['customData']
  }>({
    isOpen: false,
    type: 'first_lesson',
  })

  const celebrate = (type: MilestoneType, customData?: MilestoneCelebrationProps['customData']) => {
    setCelebration({ isOpen: true, type, customData })
  }

  const closeCelebration = () => {
    setCelebration(prev => ({ ...prev, isOpen: false }))
  }

  return {
    celebration,
    celebrate,
    closeCelebration,
    CelebrationComponent: () => (
      <MilestoneCelebration 
        isOpen={celebration.isOpen}
        onClose={closeCelebration}
        type={celebration.type}
        customData={celebration.customData}
      />
    ),
  }
}

export default MilestoneCelebration
