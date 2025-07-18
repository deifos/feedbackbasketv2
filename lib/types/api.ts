import { Project, ProjectCustomization } from '@/app/generated/prisma';

// API Response types
export interface ApiError {
  error: string;
  message: string;
  statusCode?: number;
  details?: unknown;
}

// Project with counts for dashboard
export interface ProjectWithCounts extends Project {
  customization?: ProjectCustomization | null;
  _count: {
    feedback: number;
    pendingFeedback: number;
  };
}

// API Response for projects list
export type ProjectsListResponse = ProjectWithCounts[];

// Customization update request
export interface CustomizationUpdateRequest {
  buttonColor?: string;
  buttonRadius?: number;
  buttonLabel?: string;
  introMessage?: string;
  successMessage?: string;
}

// Widget configuration for script generation
export interface WidgetConfig {
  projectId: string;
  apiEndpoint: string;
  buttonColor: string;
  buttonRadius: number;
  buttonLabel: string;
  introMessage: string;
  successMessage: string;
}

// Script generation response
export interface ScriptGenerationResponse {
  script: string;
  installation: {
    title: string;
    steps: Array<{
      step: number;
      title: string;
      description: string;
    }>;
    notes: string[];
  };
  config: WidgetConfig;
}

// Feedback submission request
export interface FeedbackSubmissionRequest {
  projectId: string;
  content: string;
  email?: string | null;
}

// Feedback submission response
export interface FeedbackSubmissionResponse {
  success: boolean;
  message: string;
  feedback: {
    id: string;
    status: string;
    submittedAt: Date;
  };
}

// Standard API response wrapper
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
