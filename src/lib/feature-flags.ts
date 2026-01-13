/**
 * Feature Flags for Edusistent Platform
 * 
 * PATH B FOCUS: Content → Concepts → Lesson Structure → Assessments → Mastery
 * 
 * The product IS:
 * > A structuring engine that helps instructors turn existing materials 
 * > (videos, PDFs, slides, text) into clear concepts, lesson mappings, 
 * > and assessable mastery.
 * 
 * The product is NOT:
 * - An AI tutor
 * - A student chat system
 * - A gamified learning app
 * - An autonomous course generator
 * 
 * MVP User Journey (the ONLY supported path):
 * 1. Instructor creates a course
 * 2. Instructor uploads lesson content (video URL, PDF, text)
 * 3. Instructor manually triggers "Analyze Content"
 * 4. AI suggests concepts (names + descriptions + prerequisites)
 * 5. Instructor reviews, renames, merges, deletes concepts
 * 6. Instructor approves final concept structure
 * 7. Instructor generates assessments from approved concepts
 * 8. Students enroll and practice
 * 9. Instructor views mastery per concept
 */

// Master toggle - when true, hides non-MVP features
export const DEMO_MODE = true;

// Feature flags - set to false to hide from UI
export const FEATURES = {
  // ============================================
  // EXPLICITLY DISABLED (not Path B)
  // ============================================
  
  // Student AI interaction (we don't teach students)
  aiChat: !DEMO_MODE,
  aiTutor: !DEMO_MODE,
  
  // Social & Community (distraction)
  communities: !DEMO_MODE,
  leaderboard: !DEMO_MODE,
  collaboration: !DEMO_MODE,
  
  // Gamification (distraction)
  gamification: !DEMO_MODE,
  xpBadge: !DEMO_MODE,
  streaks: !DEMO_MODE,
  badges: !DEMO_MODE,
  
  // Advanced features (not MVP)
  learningPaths: !DEMO_MODE,
  spacedRepetition: !DEMO_MODE,
  studyGuides: !DEMO_MODE,
  aiCodeReview: !DEMO_MODE,
  
  // Admin & Payments (not for demos)
  adminPanel: !DEMO_MODE,
  advancedAnalytics: !DEMO_MODE,
  subscription: !DEMO_MODE,
  pricing: !DEMO_MODE,
  
  // Auto-processing (manual triggers only)
  autoProcessing: false,
  backgroundProcessing: false,
  
  // ============================================
  // PATH B CORE FEATURES (always enabled)
  // ============================================
  
  // Step 1: Course & Lesson Creation
  instructorDashboard: true,
  courseCreation: true,
  lessonManagement: true,
  contentUpload: true,          // Upload video URL, text, etc.
  
  // Step 2: Content Analysis (manual trigger)
  contentAnalysis: true,        // Manual "Analyze Content" button
  conceptExtraction: true,      // AI suggests concepts
  conceptReview: true,          // Instructor reviews/edits concepts
  conceptApproval: true,        // Instructor approves final structure
  
  // Step 3: Assessment Generation
  assessmentGeneration: true,   // Generate from approved concepts
  
  // Step 4: Student Practice
  studentEnrollment: true,
  courses: true,
  lessons: true,
  practice: true,
  attempts: true,
  autoGrading: true,
  aiHints: true,                // Hints during practice only
  
  // Step 5: Mastery Tracking
  masteryOverview: true,
  instructorAnalytics: true,
  
  // Minimal student features
  profile: true,
  discover: true,
  
  // Hidden but kept
  bookmarks: !DEMO_MODE,
  videoTranscription: !DEMO_MODE,
} as const;

// Type for feature keys
export type FeatureKey = keyof typeof FEATURES;

// Helper to check if a feature is enabled
export function isFeatureEnabled(feature: FeatureKey): boolean {
  return FEATURES[feature] ?? false;
}

// Routes hidden in MVP mode
export const HIDDEN_ROUTES = DEMO_MODE ? [
  '/communities',
  '/leaderboard',
  '/collaborate',
  '/learning-paths',
  '/study-guides',
  '/code-review',
  '/admin',
  '/pricing',
  '/bookmarks',
  '/ai-chat',
  '/review',  // Code review
] : [];

// Check if a route should be hidden
export function isRouteHidden(pathname: string): boolean {
  return HIDDEN_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

// Path B messaging constants
export const MVP_MESSAGES = {
  // Core positioning
  tagline: 'Turn your content into structured, assessable learning',
  description: 'AI suggests concepts. You review and approve. Students practice. You track mastery.',
  
  // Pilot phase
  pilotPhase: 'Early Access — We are onboarding instructors manually.',
  cta: 'Request Early Access',
  
  // Key differentiators
  instructorControl: 'Instructor-controlled',
  aiSuggests: 'Proposed by AI',
  manualTrigger: 'You decide when to analyze',
  reviewFirst: 'Review before publishing',
  
  // What we are
  whatWeAre: 'A structuring engine for educational content',
  
  // What we are NOT
  notAiTutor: 'This is not an AI tutor',
  notAutomatic: 'Nothing happens automatically',
  notChat: 'Students cannot chat with AI',
};

// Language rules for UI copy
export const LANGUAGE_RULES = {
  // NEVER say these
  forbidden: [
    'AI teaches students',
    'automatic course creation',
    'AI-powered learning',
    'intelligent tutoring',
    'autonomous',
  ],
  
  // ALWAYS say these instead
  preferred: [
    'AI suggests concepts',
    'Instructor reviews and approves',
    'Instructor remains in control',
    'You decide what gets published',
    'Manual analysis',
  ],
};
