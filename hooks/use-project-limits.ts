import { useState, useEffect } from 'react';
import type { SubscriptionPlan } from '@/app/generated/prisma';

export interface ProjectLimitInfo {
  canCreate: boolean;
  projectUsage: {
    used: number;
    limit: number;
  };
  currentPlan: SubscriptionPlan;
  upgradeOptions: Array<{
    plan: string;
    projects: number;
    price: { monthly: number; annual: number };
  }>;
  message: string;
}

export function useProjectLimits() {
  const [limitInfo, setLimitInfo] = useState<ProjectLimitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimitInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscription/can-create-project');
      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, set default state
          setLimitInfo({
            canCreate: false,
            projectUsage: { used: 0, limit: 1 },
            currentPlan: 'FREE',
            upgradeOptions: [],
            message: 'Please sign in to create projects.',
          });
          return;
        }
        throw new Error('Failed to fetch project limits');
      }

      const data = await response.json();
      setLimitInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project limits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimitInfo();
  }, []);

  const refetch = async () => {
    await fetchLimitInfo();
  };

  return {
    limitInfo,
    loading,
    error,
    refetch,
    // Convenience getters
    canCreateProject: limitInfo?.canCreate ?? false,
    isAtLimit: limitInfo ? limitInfo.projectUsage.used >= limitInfo.projectUsage.limit : false,
    projectsRemaining: limitInfo ? limitInfo.projectUsage.limit - limitInfo.projectUsage.used : 0,
    upgradeOptions: limitInfo?.upgradeOptions ?? [],
    needsUpgrade: limitInfo ? !limitInfo.canCreate && limitInfo.upgradeOptions.length > 0 : false,
  };
}

// Hook for project creation with automatic limit checking
export function useProjectCreation() {
  const { limitInfo, refetch } = useProjectLimits();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const createProject = async (projectData: {
    name: string;
    url: string;
    description?: string;
  }) => {
    try {
      setCreating(true);
      setCreateError(null);

      // Check limits before attempting creation
      if (limitInfo && !limitInfo.canCreate) {
        throw new Error(limitInfo.message);
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific limit exceeded error
        if (errorData.code === 'PROJECT_LIMIT_REACHED') {
          throw new Error(errorData.message);
        }

        throw new Error(errorData.message || 'Failed to create project');
      }

      const project = await response.json();

      // Refresh limit info after successful creation
      await refetch();

      return project;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setCreateError(errorMessage);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  return {
    createProject,
    creating,
    createError,
    clearError: () => setCreateError(null),
  };
}
