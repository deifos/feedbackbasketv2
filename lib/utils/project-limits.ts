import type { SubscriptionPlan } from '@/app/generated/prisma';

export interface ProjectLimitError {
  code: 'PROJECT_LIMIT_REACHED';
  message: string;
  currentPlan: SubscriptionPlan;
  projectLimit: number;
  projectsUsed: number;
  upgradeOptions: Array<{
    plan: string;
    projects: number;
    price: { monthly: number; annual: number };
  }>;
}

export interface ProjectCreationResult {
  success: boolean;
  project?: any;
  error?: ProjectLimitError | { code: string; message: string };
}

/**
 * Check if user can create a project and get limit information
 */
export async function checkProjectLimits(): Promise<{
  canCreate: boolean;
  limitInfo: any;
}> {
  try {
    const response = await fetch('/api/subscription/can-create-project');

    if (!response.ok) {
      throw new Error('Failed to check project limits');
    }

    const limitInfo = await response.json();
    return {
      canCreate: limitInfo.canCreate,
      limitInfo,
    };
  } catch (error) {
    console.error('Error checking project limits:', error);
    return {
      canCreate: false,
      limitInfo: null,
    };
  }
}

/**
 * Create a project with automatic limit checking
 */
export async function createProjectWithLimits(projectData: {
  name: string;
  url: string;
  description?: string;
}): Promise<ProjectCreationResult> {
  try {
    // First check if user can create projects
    const { canCreate, limitInfo } = await checkProjectLimits();

    if (!canCreate && limitInfo) {
      return {
        success: false,
        error: {
          code: 'PROJECT_LIMIT_REACHED',
          message: limitInfo.message,
          currentPlan: limitInfo.currentPlan,
          projectLimit: limitInfo.projectUsage.limit,
          projectsUsed: limitInfo.projectUsage.used,
          upgradeOptions: limitInfo.upgradeOptions,
        },
      };
    }

    // Attempt to create the project
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const errorData = await response.json();

      // Handle specific project limit error
      if (errorData.code === 'PROJECT_LIMIT_REACHED') {
        return {
          success: false,
          error: {
            code: 'PROJECT_LIMIT_REACHED',
            message: errorData.message,
            currentPlan: errorData.details.currentPlan,
            projectLimit: errorData.details.projectLimit,
            projectsUsed: errorData.details.projectsUsed,
            upgradeOptions: errorData.details.upgradeOptions,
          },
        };
      }

      return {
        success: false,
        error: {
          code: errorData.code || 'CREATION_FAILED',
          message: errorData.message || 'Failed to create project',
        },
      };
    }

    const project = await response.json();
    return {
      success: true,
      project,
    };
  } catch (error) {
    console.error('Error creating project:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred',
      },
    };
  }
}

/**
 * Get upgrade URL for a specific plan
 */
export function getUpgradeUrl(
  plan: string,
  billingCycle: 'monthly' | 'annual' = 'monthly'
): string {
  const params = new URLSearchParams({
    plan: plan.toLowerCase(),
    billing: billingCycle,
  });

  return `/dashboard/upgrade?${params.toString()}`;
}

/**
 * Trigger upgrade flow
 */
export async function triggerUpgrade(
  plan: string,
  billingCycle: 'monthly' | 'annual' = 'monthly'
): Promise<{
  success: boolean;
  checkoutUrl?: string;
  error?: string;
}> {
  try {
    const response = await fetch('/api/subscription/upgrade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan: plan.toUpperCase(),
        billingCycle,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Failed to start upgrade process',
      };
    }

    const data = await response.json();
    return {
      success: true,
      checkoutUrl: data.checkoutUrl,
    };
  } catch (error) {
    console.error('Error triggering upgrade:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * Format project limit message for display
 */
export function formatProjectLimitMessage(
  currentPlan: SubscriptionPlan,
  projectsUsed: number,
  projectLimit: number
): string {
  const remaining = projectLimit - projectsUsed;

  if (remaining <= 0) {
    return `You've reached your project limit of ${projectLimit} for the ${currentPlan} plan.`;
  }

  if (remaining === 1) {
    return `You have 1 project remaining on the ${currentPlan} plan.`;
  }

  return `You have ${remaining} projects remaining on the ${currentPlan} plan.`;
}

/**
 * Check if user is approaching project limit (80% threshold)
 */
export function isApproachingProjectLimit(projectsUsed: number, projectLimit: number): boolean {
  return projectsUsed / projectLimit >= 0.8;
}

/**
 * Get next available plan for upgrade
 */
export function getNextPlan(currentPlan: SubscriptionPlan): string | null {
  switch (currentPlan) {
    case 'FREE':
      return 'STARTER';
    case 'STARTER':
      return 'PRO';
    case 'PRO':
      return null; // Already on highest plan
    default:
      return null;
  }
}
