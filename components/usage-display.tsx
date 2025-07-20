'use client';

import { useState } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PricingTable } from '@/components/pricing-table';
import { triggerUpgrade } from '@/lib/utils/project-limits';

interface UsageDisplayProps {
  showUpgradePrompt?: boolean;
  compact?: boolean;
  className?: string;
}

export function UsageDisplay({
  showUpgradePrompt = true,
  compact = false,
  className = '',
}: UsageDisplayProps) {
  const { usage, loading, error, refetch } = useSubscription();

  const [managingSubscription, setManagingSubscription] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  if (loading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
          <div className="h-2 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (error || !usage) {
    return (
      <Card className={`p-4 border-red-200 bg-red-50 ${className}`}>
        <div className="text-red-700">
          <p className="font-medium">Unable to load usage information</p>
          <p className="text-sm mt-1">{error || 'Unknown error occurred'}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const handleManageSubscription = async () => {
    try {
      setManagingSubscription(true);

      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { portalUrl } = await response.json();
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Error opening subscription portal:', error);
      alert('Unable to open subscription management. Please try again.');
    } finally {
      setManagingSubscription(false);
    }
  };

  const handleQuickUpgrade = async () => {
    if (upgradeOptions.length === 0) return;

    try {
      setUpgrading(true);
      // Default to the first upgrade option (STARTER for FREE users, PRO for STARTER users)
      const targetPlan = upgradeOptions[0].plan;
      const result = await triggerUpgrade(targetPlan, 'monthly');

      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        console.error('Upgrade failed:', result.error);
        alert(result.error || 'Failed to start upgrade process');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('An error occurred while starting the upgrade process');
    } finally {
      setUpgrading(false);
    }
  };

  const isApproachingFeedbackLimit = usage.feedback.percentage >= 90;
  const isOverFeedbackLimit = usage.isOverLimit;
  const isAtProjectLimit = usage.projects.used >= usage.projects.limit;

  // Get upgrade options
  const upgradeOptions: Array<{
    plan: string;
    projects: number;
    feedback: number;
    price: { monthly: number; annual: number };
  }> = [];
  if (usage.currentPlan === 'FREE') {
    upgradeOptions.push(
      { plan: 'STARTER', projects: 3, feedback: 500, price: { monthly: 19, annual: 17 } },
      { plan: 'PRO', projects: 10, feedback: 2000, price: { monthly: 39, annual: 35 } }
    );
  } else if (usage.currentPlan === 'STARTER') {
    upgradeOptions.push({
      plan: 'PRO',
      projects: 10,
      feedback: 2000,
      price: { monthly: 39, annual: 35 },
    });
  }

  if (compact) {
    return (
      <Card className={`p-3 ${className}`}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge
                variant={usage.currentPlan === 'FREE' ? 'secondary' : 'default'}
                className="text-xs"
              >
                {usage.currentPlan}
              </Badge>
              <span className="text-xs text-gray-500">
                {usage.daysUntilReset > 0 && `Resets in ${usage.daysUntilReset}d`}
              </span>
            </div>
            {(isOverFeedbackLimit || isAtProjectLimit) && upgradeOptions.length > 0 && (
              <Button
                size="sm"
                onClick={handleQuickUpgrade}
                disabled={upgrading}
                className="bg-orange-600 hover:bg-orange-700 text-xs px-2 py-1 h-6"
              >
                {upgrading ? 'Processing...' : 'Upgrade'}
              </Button>
            )}
          </div>

          {/* Compact Progress Bars */}
          <div className="space-y-2">
            {/* Feedback Usage */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Feedback</span>
                <span
                  className={`${isOverFeedbackLimit ? 'text-red-600 font-medium' : 'text-gray-700'}`}
                >
                  {usage.feedback.used}/{usage.feedback.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isOverFeedbackLimit
                      ? 'bg-red-500'
                      : isApproachingFeedbackLimit
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(usage.feedback.percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Project Usage */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Projects</span>
                <span
                  className={`${isAtProjectLimit ? 'text-red-600 font-medium' : 'text-gray-700'}`}
                >
                  {usage.projects.used}/{usage.projects.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isAtProjectLimit ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min((usage.projects.used / usage.projects.limit) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Show upgrade prompt for compact version */}
          {showUpgradePrompt &&
            (isOverFeedbackLimit || isAtProjectLimit || isApproachingFeedbackLimit) &&
            upgradeOptions.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    {isOverFeedbackLimit || isAtProjectLimit
                      ? 'Limits reached'
                      : 'Approaching limits'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => (window.location.href = '/pricing')}
                    className="text-xs h-5 px-2 text-blue-600 hover:text-blue-700"
                  >
                    View Plans
                  </Button>
                </div>
              </div>
            )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Usage & Limits</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={usage.currentPlan === 'FREE' ? 'secondary' : 'default'}>
                {usage.currentPlan} Plan
              </Badge>
              {usage.daysUntilReset > 0 && (
                <span className="text-sm text-gray-500">
                  Limits reset in {usage.daysUntilReset} day{usage.daysUntilReset !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          {/* Manage Subscription Button - Only show for paid plans */}
          {usage.currentPlan !== 'FREE' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageSubscription}
              disabled={managingSubscription}
              className="text-gray-600 hover:text-gray-800"
            >
              {managingSubscription ? 'Opening...' : 'Manage Subscription'}
            </Button>
          )}
        </div>

        {/* Feedback Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Feedback This Month</span>
            <span className="text-sm text-gray-600">
              {usage.feedback.used.toLocaleString()} / {usage.feedback.limit.toLocaleString()}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isOverFeedbackLimit
                  ? 'bg-red-500'
                  : isApproachingFeedbackLimit
                    ? 'bg-orange-500'
                    : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(usage.feedback.percentage, 100)}%` }}
            />
          </div>

          {isOverFeedbackLimit && (
            <p className="text-sm text-red-600">
              ⚠️ You&apos;ve exceeded your feedback limit. Older feedback is hidden but preserved.
            </p>
          )}
          {isApproachingFeedbackLimit && !isOverFeedbackLimit && (
            <p className="text-sm text-orange-600">
              ⚠️ You&apos;re approaching your feedback limit ({usage.feedback.percentage}% used).
            </p>
          )}
        </div>

        {/* Project Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Projects</span>
            <span className="text-sm text-gray-600">
              {usage.projects.used} / {usage.projects.limit}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isAtProjectLimit ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min((usage.projects.used / usage.projects.limit) * 100, 100)}%`,
              }}
            />
          </div>

          {isAtProjectLimit && (
            <p className="text-sm text-red-600">
              ⚠️ You&apos;ve reached your project limit. Upgrade to create more projects.
            </p>
          )}
        </div>

        {/* Upgrade Prompt */}
        {showUpgradePrompt &&
          (isOverFeedbackLimit || isAtProjectLimit || isApproachingFeedbackLimit) &&
          upgradeOptions.length > 0 && (
            <div className="border-t pt-6">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  {isOverFeedbackLimit || isAtProjectLimit
                    ? 'Upgrade Required'
                    : 'Consider Upgrading'}
                </h4>
                <p className="text-sm text-gray-600">
                  {isOverFeedbackLimit || isAtProjectLimit
                    ? "You've reached your limits. Choose a plan that fits your needs."
                    : "You're approaching your limits. Upgrade for more capacity."}
                </p>
              </div>

              <div className="flex justify-center">
                <div className="max-w-4xl w-full">
                  <PricingTable
                    currentPlan={usage.currentPlan}
                    upgradeOptions={upgradeOptions}
                    showCurrentPlan={false}
                  />
                </div>
              </div>
            </div>
          )}

        {/* Subscription Status Info */}
        {usage.currentPlan !== 'FREE' && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Subscription Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span
                  className={`ml-2 font-medium ${
                    usage.status === 'CANCELED'
                      ? 'text-orange-600'
                      : usage.status === 'ACTIVE'
                        ? 'text-green-600'
                        : 'text-gray-600'
                  }`}
                >
                  {usage.status === 'CANCELED'
                    ? 'Cancels at period end'
                    : usage.status === 'ACTIVE'
                      ? 'Active'
                      : usage.status}
                </span>
              </div>
              {usage.daysUntilReset > 0 && (
                <div>
                  <span className="text-gray-600">Usage resets:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {usage.daysUntilReset} day{usage.daysUntilReset !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Cancellation Notice */}
            {usage.status === 'CANCELED' && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-orange-600">⚠️</span>
                  </div>
                  <div className="ml-2">
                    <h5 className="text-sm font-medium text-orange-800">
                      Subscription Scheduled for Cancellation
                    </h5>
                    <p className="text-sm text-orange-700 mt-1">
                      Your subscription will end on{' '}
                      {usage.billingPeriod.end
                        ? new Date(usage.billingPeriod.end).toLocaleDateString()
                        : 'the end of your billing period'}
                      . You&rsquo;ll be downgraded to the Free plan and your usage will be limited.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No upgrade needed */}
        {usage.currentPlan === 'PRO' && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-600">
              You&apos;re on the Pro plan with maximum capacity! 🎉
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// Simplified usage bar component for inline use
export function UsageBar({
  label,
  used,
  limit,
  className = '',
}: {
  label: string;
  used: number;
  limit: number;
  className?: string;
}) {
  const percentage = (used / limit) * 100;
  const isOver = used > limit;
  const isApproaching = percentage >= 90;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`${isOver ? 'text-red-600' : 'text-gray-600'}`}>
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            isOver ? 'bg-red-500' : isApproaching ? 'bg-orange-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
