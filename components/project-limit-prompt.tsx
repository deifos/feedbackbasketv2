'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { SubscriptionPlan } from '@/app/generated/prisma';

interface ProjectLimitPromptProps {
  currentPlan: SubscriptionPlan;
  projectsUsed: number;
  projectLimit: number;
  upgradeOptions: Array<{
    plan: string;
    projects: number;
    price: { monthly: number; annual: number };
  }>;
  onUpgrade?: (plan: string, billingCycle: 'monthly' | 'annual') => void;
  onClose?: () => void;
  className?: string;
}

export function ProjectLimitPrompt({
  currentPlan,
  projectsUsed,
  projectLimit,
  upgradeOptions,
  onUpgrade,
  onClose,
  className = '',
}: ProjectLimitPromptProps) {
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'annual'>('monthly');
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    if (!onUpgrade) return;

    try {
      setUpgrading(plan);
      await onUpgrade(plan, selectedBilling);
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <Card className={`p-6 border-orange-200 bg-orange-50 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-orange-900">Project Limit Reached</h3>
            <p className="text-sm text-orange-700 mt-1">
              You&apos;ve used {projectsUsed} of {projectLimit} projects on the {currentPlan} plan.
            </p>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-orange-600 hover:text-orange-800"
            >
              ×
            </Button>
          )}
        </div>

        {/* Billing Toggle */}
        {upgradeOptions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-orange-900">Billing:</span>
              <div className="flex bg-white rounded-lg p-1 border">
                <button
                  onClick={() => setSelectedBilling('monthly')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedBilling === 'monthly'
                      ? 'bg-orange-100 text-orange-900 font-medium'
                      : 'text-orange-600 hover:text-orange-800'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedBilling('annual')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedBilling === 'annual'
                      ? 'bg-orange-100 text-orange-900 font-medium'
                      : 'text-orange-600 hover:text-orange-800'
                  }`}
                >
                  Annual
                  <span className="ml-1 text-xs text-green-600 font-medium">Save 10%</span>
                </button>
              </div>
            </div>

            {/* Upgrade Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-orange-900">
                Upgrade to create more projects:
              </h4>
              <div className="grid gap-3">
                {upgradeOptions.map(option => (
                  <div
                    key={option.plan}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{option.plan} Plan</div>
                      <div className="text-sm text-gray-600">Up to {option.projects} projects</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          ${option.price[selectedBilling]}/month
                        </div>
                        {selectedBilling === 'annual' && (
                          <div className="text-xs text-green-600">Billed annually</div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleUpgrade(option.plan)}
                        disabled={upgrading === option.plan}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {upgrading === option.plan ? 'Upgrading...' : 'Upgrade'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No upgrade options available */}
        {upgradeOptions.length === 0 && (
          <div className="text-center py-4">
            <p className="text-orange-700">
              You&apos;re already on the highest plan. Contact support if you need more projects.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// Simplified version for inline use
export function InlineProjectLimitWarning({
  projectsUsed,
  projectLimit,
  currentPlan,
}: {
  projectsUsed: number;
  projectLimit: number;
  currentPlan: SubscriptionPlan;
}) {
  const remaining = projectLimit - projectsUsed;

  if (remaining <= 0) {
    return (
      <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
        <span className="text-sm">
          ⚠️ Project limit reached ({projectsUsed}/{projectLimit}) on {currentPlan} plan
        </span>
      </div>
    );
  }

  if (remaining <= 1) {
    return (
      <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
        <span className="text-sm">
          ⚠️ {remaining} project{remaining !== 1 ? 's' : ''} remaining on {currentPlan} plan
        </span>
      </div>
    );
  }

  return null;
}
