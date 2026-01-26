// For BADM554, we only have students, but keep the type for compatibility
export type EducationRole = 'student';

export interface InterviewSession {
  id: string;
  topic: string;
  role: EducationRole;
  status: 'planning' | 'interviewing' | 'completed' | 'analyzing';
  createdAt: string;
  updatedAt: string;
  transcript: Message[];
  plan?: InterviewPlan;
  analysis?: InterviewAnalysis;
  cost?: {
    tokens: number;
    cost: number;
  };
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface InterviewPlan {
  objectives: string[];
  questions: string[];
  focusAreas: string[];
}

export interface InterviewAnalysis {
  summary: string;
  keyInsights: string[];
  recommendations?: string[];
  // BADM554-specific fields
  technicalSkillLevel?: string;
  priorExperienceProfile?: string;
  areasNeedingSupport?: string[];
  topicsOfInterest?: string[];
}
