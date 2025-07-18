'use client';

import { useSubscription } from '@/hooks/use-subscription';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UsageWidgetProps {
  variant?: 'default' | 'minimal' | 'sidebar';
  showUpgrade?: boolean;
  className?: string;
}

export function UsageWidget({
  variant = 'default',
  showUpgrade = true,
  className = '',
}: UsageWidgetProps) {
  const { usage, loading, error } = useSubscription();

  if (loading) {
    return (
      <Card className={`p-3 ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-gray-200 rounded w-16"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
          <div className="h-2 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  if (error || !usage) {
    return (
      <Card className={`p-3 border-red-200 bg-red-50 ${className}`}>
        <div className="text-xs text-red-600">Usage unavailable</div>
      </Card>
    );
  }

  const feedbackPercentage = usage.feedback.percentage;
  const projectPercentage = (usage.projects.used / usage.projects.limit) * 100;
  const isOverLimit = usage.isOverLimit;
  const isApproaching = feedbackPercentage >= 90 || projectPercentage >= 90;

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge variant={usage.currentPlan === 'FREE' ? 'secondary' : 'default'} className="text-xs">
          {usage.currentPlan}
        </Badge>
        <div className="text-xs text-gray-600">
          {usage.feedback.used}/{usage.feedback.limit}
        </div>
        {isOverLimit && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <Card className={`p-2.5 ${className}`}>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Usage</span>
            <Badge
              variant={usage.currentPlan === 'FREE' ? 'secondary' : 'default'}
              className="text-xs px-1.5 py-0.5"
            >
              {usage.currentPlan}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Feedback</span>
              <span className={isOverLimit ? 'text-red-600 font-medium' : 'text-gray-600'}>
                {usage.feedback.used}/{usage.feedback.limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className={`h-1 rounded-full ${
                  isOverLimit
                    ? 'bg-red-500'
                    : feedbackPercentage >= 90
                      ? 'bg-orange-500'
                      : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(feedbackPercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Projects</span>
              <span className="text-gray-600">
                {usage.projects.used}/{usage.projects.limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className={`h-1 rounded-full ${
                  projectPercentage >= 100
                    ? 'bg-red-500'
                    : projectPercentage >= 90
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(projectPercentage, 100)}%` }}
              />
            </div>
          </div>

          {showUpgrade && (isOverLimit || isApproaching) && usage.currentPlan !== 'PRO' && (
            <Button size="sm" className="w-full text-xs bg-orange-600 hover:bg-orange-700 h-6 px-2">
              Upgrade
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">Current Usage</h4>
          <Badge variant={usage.currentPlan === 'FREE' ? 'secondary' : 'default'}>
            {usage.currentPlan}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Feedback</span>
              <span className={isOverLimit ? 'text-red-600 font-medium' : 'text-gray-900'}>
                {usage.feedback.used.toLocaleString()} / {usage.feedback.limit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isOverLimit
                    ? 'bg-red-500'
                    : feedbackPercentage >= 90
                      ? 'bg-orange-500'
                      : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(feedbackPercentage, 100)}%` }}
              />
            </div>
            {isOverLimit && <p className="text-xs text-red-600 mt-1">Limit exceeded</p>}
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Projects</span>
              <span className="text-gray-900">
                {usage.projects.used} / {usage.projects.limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  projectPercentage >= 100
                    ? 'bg-red-500'
                    : projectPercentage >= 90
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(projectPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {showUpgrade && (isOverLimit || isApproaching) && usage.currentPlan !== 'PRO' && (
          <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
            Upgrade Plan
          </Button>
        )}

        {usage.daysUntilReset > 0 && (
          <p className="text-xs text-gray-500 text-center">Resets in {usage.daysUntilReset} days</p>
        )}
      </div>
    </Card>
  );
}
