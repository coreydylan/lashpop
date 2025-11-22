export type DiscoveryStep =
  | 'returning-visitor'
  | 'service-selection'
  | 'service-journey'
  | 'lash-intro'
  | 'lash-education'
  | 'lash-quiz-v1'
  | 'lash-quiz-look-explainer'
  | 'lash-quiz-look-selection'
  | 'lash-quiz-v2'
  | 'lash-factors'
  | 'other-service-intro'
  | 'ai-questions'
  | 'ready-to-book';

export type LashLook = 'classic' | 'hybrid' | 'volume' | 'wet-angel';

export interface DiscoveryState {
  currentStep: DiscoveryStep;
  isReturningVisitor: boolean | null;
  isRebooking: boolean | null;
  selectedServices: string[];
  currentServiceIndex: number;
  lashLookExplainerIndex: number;
  lashQuizAnswers: {
    selectedLook?: LashLook;
    curl?: string;
    length?: string;
    thickness?: string;
  };
  aiQuestions: string[];
  previousSteps: DiscoveryStep[];
  discoveryResult: {
    services: string[];
    preferences: Record<string, any>;
  } | null;
}

export interface ServiceJourney {
  id: string;
  name: string;
  priority: number;
  hasQuiz: boolean;
  hasEducation: boolean;
  introContent: {
    title: string;
    philosophy: string;
    description: string;
  };
  educationContent?: {
    title: string;
    sections: Array<{
      heading: string;
      content: string;
    }>;
  };
  quizContent?: {
    version: number;
    questions: Array<{
      id: string;
      type: 'single-choice' | 'multi-choice' | 'info';
      question?: string;
      options?: Array<{
        id: string;
        label: string;
        description: string;
        imageUrl?: string;
      }>;
      info?: string;
    }>;
  };
}

export const SERVICE_PRIORITIES: Record<string, number> = {
  'lashes': 1,
  'waxing': 2,
  'brows': 3,
  'permanent-makeup': 4,
  'facials': 5,
  'permanent-jewelry': 6,
  'botox': 7,
};

export const LASH_LOOKS: Record<LashLook, { name: string; description: string; imageUrl?: string }> = {
  'classic': {
    name: 'Classic',
    description: 'Natural, elegant look with one extension per natural lash for subtle enhancement',
  },
  'hybrid': {
    name: 'Hybrid',
    description: 'Perfect balance of Classic and Volume, offering texture and fullness',
  },
  'volume': {
    name: 'Volume',
    description: 'Dramatic, full look with multiple lightweight extensions per natural lash',
  },
  'wet-angel': {
    name: 'Wet/Angel',
    description: 'Glossy, wispy look with textured tips for a fresh, dewy appearance',
  },
};