import { useState, useEffect } from 'react';
import type { UsageStats } from '@/lib/services/subscription-service';

export function useSubscription() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/subscription');
        if (!response.ok) {
          if (response.status === 401) {
            // User not authenticated, set default free plan state
            setUsage({
              currentPlan: 'FREE',
              billingPeriod: { start: null, end: null },
              feedback: { used: 0, limit: 100, percentage: 0 },
              projects: { used: 0, limit: 1 },
              isOverLimit: false,
              daysUntilReset: 30,
              status: 'ACTIVE',
            });
            return;
          }
          throw new Error('Failed to fetch subscription data');
        }

        const data = await response.json();
        setUsage(data.usage);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch subscription data');
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, []);

  const refetch = async () => {
    try {
      setError(null);

      const response = await fetch('/api/subscription');
      if (!response.ok) {
        throw new Error('Failed to refresh subscription data');
      }

      const data = await response.json();
      setUsage(data.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh subscription data');
    }
  };

  return {
    usage,
    loading,
    error,
    refetch,
    // Convenience getters
    currentPlan: usage?.currentPlan ?? 'FREE',
    isOverLimit: usage?.isOverLimit ?? false,
    canCreateProject: usage ? usage.projects.used < usage.projects.limit : false,
    feedbackUsage: usage?.feedback ?? { used: 0, limit: 100, percentage: 0 },
    projectUsage: usage?.projects ?? { used: 0, limit: 1 },
  };
}

// Hook for checking if user can perform specific actions
export function useSubscriptionLimits() {
  const { usage, loading } = useSubscription();

  const canCreateProject = async (): Promise<boolean> => {
    if (loading) return false;

    try {
      const response = await fetch('/api/subscription/can-create-project');
      if (!response.ok) return false;

      const data = await response.json();
      return data.canCreate;
    } catch {
      return false;
    }
  };

  const isApproachingLimit = (threshold: number = 0.9): boolean => {
    if (!usage) return false;
    return usage.feedback.percentage >= threshold * 100;
  };

  const shouldShowUpgradePrompt = (): boolean => {
    if (!usage) return false;
    return usage.isOverLimit || isApproachingLimit(0.9);
  };

  return {
    canCreateProject,
    isApproachingLimit,
    shouldShowUpgradePrompt,
    usage,
    loading,
  };
}
