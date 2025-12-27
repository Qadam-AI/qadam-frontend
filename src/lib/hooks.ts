/**
 * React Query hooks for API data fetching
 * Provides caching, refetching, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: string;
  level: number;
  total_xp: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  difficulty: string;
  duration_hours: number;
  lesson_count: number;
  enrolled_count: number;
  rating: number;
  tags: string[];
}

export interface CourseDetail extends Course {
  lessons: Lesson[];
  syllabus: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order: number;
  is_completed: boolean;
}

export interface Task {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  task_type: string;
  difficulty: string;
  xp_reward: number;
}

export interface TaskSubmission {
  id: string;
  task_id: string;
  code: string;
  status: string;
  score: number;
  feedback?: string;
  xp_earned: number;
}

export interface UserStats {
  total_xp: number;
  level: number;
  xp_to_next_level: number;
  streak_days: number;
  tasks_completed: number;
  courses_completed: number;
  badges_earned: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  earned_at?: string;
  progress?: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  avatar_url?: string;
  xp: number;
  level: number;
}

export interface ReviewItem {
  id: string;
  concept_id: string;
  concept_name: string;
  ease_factor: number;
  interval_days: number;
  next_review: string;
}

export interface LearningPath {
  id: string;
  goal: string;
  nodes: PathNode[];
  estimated_days: number;
  progress_percent: number;
}

export interface PathNode {
  id: string;
  concept_id: string;
  concept_name: string;
  difficulty: string;
  status: string;
}

export interface StudyGuide {
  id: string;
  topic: string;
  summary: string;
  sections: { title: string; content: string }[];
}

export interface CodeReview {
  id: string;
  overall_score: number;
  summary: string;
  issues: { category: string; severity: string; message: string }[];
}

export interface CollabSession {
  id: string;
  name: string;
  host_id: string;
  session_type: string;
  current_code: string;
  status: string;
}

// ==========================================
// API HELPER FUNCTIONS
// ==========================================

const LLM_API_URL = process.env.NEXT_PUBLIC_LLM_API_URL || 'http://localhost:8001/api/v1';

// ==========================================
// USER HOOKS
// ==========================================

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: api.auth.me,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ==========================================
// COURSE HOOKS
// ==========================================

export function useCourses(params?: { page?: number; limit?: number; category?: string }) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => api.courses.list(params),
  });
}

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.courses.get(courseId),
    enabled: !!courseId,
  });
}

export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => api.courses.getProgress(courseId),
    enabled: !!courseId,
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (courseId: string) => api.courses.enroll(courseId),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useSearchCourses(query: string) {
  return useQuery({
    queryKey: ['courses', 'search', query],
    queryFn: () => api.courses.search(query),
    enabled: query.length >= 2,
  });
}

// ==========================================
// LESSON HOOKS
// ==========================================

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => api.lessons.get(lessonId),
    enabled: !!lessonId,
  });
}

export function useCompleteLesson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (lessonId: string) => api.lessons.complete(lessonId),
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
}

// ==========================================
// TASK HOOKS
// ==========================================

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => api.tasks.get(taskId),
    enabled: !!taskId,
  });
}

export function useSubmitTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, code }: { taskId: string; code: string }) =>
      api.tasks.submit(taskId, code),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
}

export function useRunTests() {
  return useMutation({
    mutationFn: ({ taskId, code }: { taskId: string; code: string }) =>
      api.tasks.runTests(taskId, code),
  });
}

export function useGetHint() {
  return useMutation({
    mutationFn: ({ taskId, level }: { taskId: string; level: number }) =>
      api.tasks.getHint(taskId, level),
  });
}

// ==========================================
// GAMIFICATION HOOKS
// ==========================================

export function useUserStats() {
  return useQuery({
    queryKey: ['gamification', 'stats'],
    queryFn: api.gamification.getStats,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useXPHistory(limit: number = 50) {
  return useQuery({
    queryKey: ['gamification', 'xp-history', limit],
    queryFn: () => api.gamification.getXPHistory(limit),
  });
}

export function useBadges() {
  return useQuery({
    queryKey: ['gamification', 'badges'],
    queryFn: api.gamification.getBadges,
  });
}

export function useLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'weekly') {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', period],
    queryFn: () => api.gamification.getLeaderboard(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ['gamification', 'achievements'],
    queryFn: api.gamification.getAchievements,
  });
}

// ==========================================
// SPACED REPETITION HOOKS
// ==========================================

export function useDueReviewItems(limit: number = 20) {
  return useQuery({
    queryKey: ['spaced-repetition', 'due', limit],
    queryFn: () => api.spacedRepetition.getDueItems(limit),
  });
}

export function useStartReviewSession() {
  return useMutation({
    mutationFn: api.spacedRepetition.startSession,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      itemId,
      quality,
      timeSpentSeconds,
    }: {
      itemId: string;
      quality: 0 | 1 | 2 | 3 | 4 | 5;
      timeSpentSeconds: number;
    }) => api.spacedRepetition.submitReview(itemId, quality, timeSpentSeconds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaced-repetition'] });
    },
  });
}

export function useReviewStats() {
  return useQuery({
    queryKey: ['spaced-repetition', 'stats'],
    queryFn: api.spacedRepetition.getStats,
  });
}

// ==========================================
// LEARNING PATH HOOKS
// ==========================================

export function useCurrentLearningPath() {
  return useQuery({
    queryKey: ['learning-path', 'current'],
    queryFn: api.learningPath.getCurrent,
  });
}

export function useGenerateLearningPath() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ goal, deadlineDays }: { goal: string; deadlineDays?: number }) =>
      api.learningPath.generate(goal, deadlineDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-path'] });
    },
  });
}

export function useLearningRecommendations() {
  return useQuery({
    queryKey: ['learning-path', 'recommendations'],
    queryFn: api.learningPath.getRecommendations,
  });
}

// ==========================================
// STUDY GUIDE HOOKS
// ==========================================

export function useStudyGuides() {
  return useQuery({
    queryKey: ['study-guides'],
    queryFn: api.studyGuide.list,
  });
}

export function useStudyGuide(guideId: string) {
  return useQuery({
    queryKey: ['study-guide', guideId],
    queryFn: () => api.studyGuide.get(guideId),
    enabled: !!guideId,
  });
}

export function useGenerateStudyGuide() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      content,
      topic,
      config,
    }: {
      content: string;
      topic: string;
      config?: { difficulty?: string; include_questions?: boolean };
    }) => api.studyGuide.generate(content, topic, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-guides'] });
    },
  });
}

// ==========================================
// CODE REVIEW HOOKS
// ==========================================

export function useCodeReview() {
  return useMutation({
    mutationFn: ({
      code,
      language,
      taskId,
    }: {
      code: string;
      language: string;
      taskId?: string;
    }) => api.codeReview.review(code, language, taskId),
  });
}

// ==========================================
// COLLABORATION HOOKS
// ==========================================

export function useActiveSessions() {
  return useQuery({
    queryKey: ['collaboration', 'sessions'],
    queryFn: api.collaboration.getActiveSessions,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useCollabSession(sessionId: string) {
  return useQuery({
    queryKey: ['collaboration', 'session', sessionId],
    queryFn: () => api.collaboration.getSession(sessionId),
    enabled: !!sessionId,
  });
}

export function useCreateCollabSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      name,
      taskId,
      initialCode,
    }: {
      name: string;
      taskId?: string;
      initialCode?: string;
    }) => api.collaboration.createSession(name, taskId, initialCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'sessions'] });
    },
  });
}

export function useJoinCollabSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId: string) => api.collaboration.joinSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'session', sessionId] });
    },
  });
}

export function useLeaveCollabSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId: string) => api.collaboration.leaveSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'sessions'] });
    },
  });
}

export function useEndCollabSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (sessionId: string) => api.collaboration.endSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'sessions'] });
    },
  });
}
