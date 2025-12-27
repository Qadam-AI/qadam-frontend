/**
 * React Query hooks for API data fetching
 * Provides caching, refetching, and optimistic updates
 * 
 * Uses the existing axios-based API client
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import axios from 'axios';

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
// LLM API CLIENT
// ==========================================

const LLM_API_URL = process.env.NEXT_PUBLIC_LLM_API_URL || 'http://localhost:8001/api/v1';

const llmApi = axios.create({
  baseURL: LLM_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

// Add auth token to LLM API requests
llmApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('edusistent_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ==========================================
// USER HOOKS
// ==========================================

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const { data } = await api.get<User>('/users/me');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ==========================================
// COURSE HOOKS
// ==========================================

export function useCourses(params?: { page?: number; limit?: number; category?: string }) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: async () => {
      const { data } = await api.get<{ courses: Course[]; total: number }>('/courses', { params });
      return data;
    },
  });
}

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data } = await api.get<CourseDetail>(`/courses/${courseId}`);
      return data;
    },
    enabled: !!courseId,
  });
}

export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: async () => {
      const { data } = await api.get<{ completed_lessons: number; total_lessons: number; percent: number }>(
        `/courses/${courseId}/progress`
      );
      return data;
    },
    enabled: !!courseId,
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data } = await api.post<{ enrollment_id: string }>(`/courses/${courseId}/enroll`);
      return data;
    },
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useSearchCourses(query: string) {
  return useQuery({
    queryKey: ['courses', 'search', query],
    queryFn: async () => {
      const { data } = await api.get<{ courses: Course[] }>(`/courses/search?q=${encodeURIComponent(query)}`);
      return data;
    },
    enabled: query.length >= 2,
  });
}

// ==========================================
// LESSON HOOKS
// ==========================================

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const { data } = await api.get<Lesson>(`/lessons/${lessonId}`);
      return data;
    },
    enabled: !!lessonId,
  });
}

export function useCompleteLesson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lessonId: string) => {
      const { data } = await api.post<{ xp_earned: number }>(`/lessons/${lessonId}/complete`);
      return data;
    },
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
    queryFn: async () => {
      const { data } = await api.get<Task>(`/tasks/${taskId}`);
      return data;
    },
    enabled: !!taskId,
  });
}

export function useSubmitTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, code }: { taskId: string; code: string }) => {
      const { data } = await api.post<TaskSubmission>(`/tasks/${taskId}/submit`, { code });
      return data;
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
}

export function useRunTests() {
  return useMutation({
    mutationFn: async ({ taskId, code }: { taskId: string; code: string }) => {
      const { data } = await api.post(`/tasks/${taskId}/test`, { code });
      return data;
    },
  });
}

export function useGetHint() {
  return useMutation({
    mutationFn: async ({ taskId, level }: { taskId: string; level: number }) => {
      const { data } = await llmApi.get<{ hint: string; hint_level: number }>(
        `/tasks/${taskId}/hint?level=${level}`
      );
      return data;
    },
  });
}

// ==========================================
// GAMIFICATION HOOKS
// ==========================================

export function useUserStats() {
  return useQuery({
    queryKey: ['gamification', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<UserStats>('/gamification/stats');
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useXPHistory(limit: number = 50) {
  return useQuery({
    queryKey: ['gamification', 'xp-history', limit],
    queryFn: async () => {
      const { data } = await api.get<{ entries: { amount: number; source: string; earned_at: string }[] }>(
        `/gamification/xp-history?limit=${limit}`
      );
      return data;
    },
  });
}

export function useBadges() {
  return useQuery({
    queryKey: ['gamification', 'badges'],
    queryFn: async () => {
      const { data } = await api.get<{ badges: Badge[] }>('/gamification/badges');
      return data;
    },
  });
}

export function useLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'weekly') {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', period],
    queryFn: async () => {
      const { data } = await api.get<{ entries: LeaderboardEntry[] }>(
        `/gamification/leaderboard?period=${period}`
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ['gamification', 'achievements'],
    queryFn: async () => {
      const { data } = await api.get<{ achievements: { id: string; title: string; description: string; achieved_at: string }[] }>(
        '/gamification/achievements'
      );
      return data;
    },
  });
}

// ==========================================
// SPACED REPETITION HOOKS (LLM Service)
// ==========================================

export function useDueReviewItems(limit: number = 20) {
  return useQuery({
    queryKey: ['spaced-repetition', 'due', limit],
    queryFn: async () => {
      const { data } = await llmApi.get<{ items: ReviewItem[] }>(`/spaced-repetition/due?limit=${limit}`);
      return data;
    },
  });
}

export function useStartReviewSession() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await llmApi.post('/spaced-repetition/session/start');
      return data;
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      itemId,
      quality,
      timeSpentSeconds,
    }: {
      itemId: string;
      quality: 0 | 1 | 2 | 3 | 4 | 5;
      timeSpentSeconds: number;
    }) => {
      const { data } = await llmApi.post('/spaced-repetition/review', {
        item_id: itemId,
        quality,
        time_spent_seconds: timeSpentSeconds,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaced-repetition'] });
    },
  });
}

export function useReviewStats() {
  return useQuery({
    queryKey: ['spaced-repetition', 'stats'],
    queryFn: async () => {
      const { data } = await llmApi.get('/spaced-repetition/stats');
      return data;
    },
  });
}

// ==========================================
// LEARNING PATH HOOKS (LLM Service)
// ==========================================

export function useCurrentLearningPath() {
  return useQuery({
    queryKey: ['learning-path', 'current'],
    queryFn: async () => {
      const { data } = await llmApi.get<LearningPath | null>('/learning-path/current');
      return data;
    },
  });
}

export function useGenerateLearningPath() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ goal, deadlineDays }: { goal: string; deadlineDays?: number }) => {
      const { data } = await llmApi.post<LearningPath>('/learning-path/generate', {
        goal,
        deadline_days: deadlineDays,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-path'] });
    },
  });
}

export function useLearningRecommendations() {
  return useQuery({
    queryKey: ['learning-path', 'recommendations'],
    queryFn: async () => {
      const { data } = await llmApi.get<{ recommendations: { concept: string; reason: string; priority: number }[] }>(
        '/learning-path/recommendations'
      );
      return data;
    },
  });
}

// ==========================================
// STUDY GUIDE HOOKS (LLM Service)
// ==========================================

export function useStudyGuides() {
  return useQuery({
    queryKey: ['study-guides'],
    queryFn: async () => {
      const { data } = await llmApi.get<{ guides: StudyGuide[] }>('/study-guide');
      return data;
    },
  });
}

export function useStudyGuide(guideId: string) {
  return useQuery({
    queryKey: ['study-guide', guideId],
    queryFn: async () => {
      const { data } = await llmApi.get<StudyGuide>(`/study-guide/${guideId}`);
      return data;
    },
    enabled: !!guideId,
  });
}

export function useGenerateStudyGuide() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      content,
      topic,
      config,
    }: {
      content: string;
      topic: string;
      config?: { difficulty?: string; include_questions?: boolean };
    }) => {
      const { data } = await llmApi.post<StudyGuide>('/study-guide/generate', {
        content,
        topic,
        config,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-guides'] });
    },
  });
}

// ==========================================
// CODE REVIEW HOOKS (LLM Service)
// ==========================================

export function useCodeReview() {
  return useMutation({
    mutationFn: async ({
      code,
      language,
      taskId,
    }: {
      code: string;
      language: string;
      taskId?: string;
    }) => {
      const { data } = await llmApi.post<CodeReview>('/code-review', {
        code,
        language,
        task_id: taskId,
      });
      return data;
    },
  });
}

// ==========================================
// COLLABORATION HOOKS
// ==========================================

export function useActiveSessions() {
  return useQuery({
    queryKey: ['collaboration', 'sessions'],
    queryFn: async () => {
      const { data } = await api.get<{ sessions: CollabSession[] }>('/collaboration/sessions');
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useCollabSession(sessionId: string) {
  return useQuery({
    queryKey: ['collaboration', 'session', sessionId],
    queryFn: async () => {
      const { data } = await api.get<CollabSession>(`/collaboration/sessions/${sessionId}`);
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useCreateCollabSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      name,
      taskId,
      initialCode,
    }: {
      name: string;
      taskId?: string;
      initialCode?: string;
    }) => {
      const { data } = await api.post<CollabSession>('/collaboration/sessions', {
        name,
        task_id: taskId,
        initial_code: initialCode,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'sessions'] });
    },
  });
}

export function useJoinCollabSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.post<{ participant_id: string }>(`/collaboration/sessions/${sessionId}/join`);
      return data;
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'session', sessionId] });
    },
  });
}

export function useLeaveCollabSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await api.post(`/collaboration/sessions/${sessionId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'sessions'] });
    },
  });
}

export function useEndCollabSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await api.post(`/collaboration/sessions/${sessionId}/end`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'sessions'] });
    },
  });
}

// ==========================================
// AI CHAT HOOKS (LLM Service)
// ==========================================

export function useSendChatMessage() {
  return useMutation({
    mutationFn: async ({
      conversationId,
      message,
      context,
    }: {
      conversationId: string;
      message: string;
      context?: Record<string, unknown>;
    }) => {
      const { data } = await llmApi.post<{ message_id: string; content: string }>('/chat/message', {
        conversation_id: conversationId,
        message,
        user_id: 'current',
        context: context || {},
      });
      return data;
    },
  });
}

export function useChatHistory(conversationId: string) {
  return useQuery({
    queryKey: ['chat', 'history', conversationId],
    queryFn: async () => {
      const { data } = await llmApi.get(`/chat/history/${conversationId}`);
      return data;
    },
    enabled: !!conversationId,
  });
}

export function useClearChatHistory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId: string) => {
      await llmApi.delete(`/chat/history/${conversationId}`);
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'history', conversationId] });
    },
  });
}
