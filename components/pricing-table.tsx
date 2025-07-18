'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { triggerUpgrade } from '@/lib/utils/project-limits';

interface PricingTableProps {
  currentPlan?: string;
  upgradeOptions?: Array<{
    plan: string;
    projects: number;
    feedback: number;
    price: { monthly: number; annual: number };
  }>;
  showCurrentPlan?: boolean;
  className?: string;
}

export function PricingTable({
  currentPlan = 'FREE',
  upgradeOptions = [],
  showCurrentPlan = true,
  className = '',
}: PricingTableProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [upgrading, setUpgrading] = useState<string | null>(null);

  // All available plans
  const allPlans = [
    {
      plan: 'FREE',
      name: 'Free',
      projects: 1,
      feedback: 100,
      price: { monthly: 0, annual: 0 },
      features: ['Up to 1 project', '100 feedback items/month', 'Basic analytics', 'Email support'],
    },
    {
      plan: 'STARTER',
      name: 'Starter',
      projects: 3,
      feedback: 500,
      price: { monthly: 19, annual: 17 },
      features: [
        'Up to 3 projects',
        '500 feedback items/month',
        'Advanced analytics',
        'Priority email support',
        'Custom branding',
      ],
    },
    {
      plan: 'PRO',
      name: 'Pro',
      projects: 10,
      feedback: 2000,
      price: { monthly: 39, annual: 35 },
      features: [
        'Up to 10 projects',
        '2,000 feedback items/month',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        'API access',
        'Export data',
      ],
    },
  ];

  // Filter plans to show based on upgrade options or show all
  const plansToShow = showCurrentPlan
    ? allPlans
    : upgradeOptions.length > 0
      ? [
          // Always include FREE plan for context and better visual balance
          allPlans.find(plan => plan.plan === 'FREE')!,
          // Include upgrade options
          ...allPlans.filter(plan => upgradeOptions.some(opt => opt.plan === plan.plan)),
        ]
      : allPlans; // Fallback to show all plans if no upgrade options

  const handleUpgrade = async (plan: string) => {
    if (plan === 'FREE' || plan === currentPlan) return;

    try {
      setUpgrading(plan);
      const result = await triggerUpgrade(plan, billingCycle);

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
      setUpgrading(null);
    }
  };

  const getButtonText = (plan: string) => {
    if (plan === currentPlan) return 'Current Plan';
    if (plan === 'FREE') return 'Free Forever';
    if (upgrading === plan) return 'Processing...';
    return 'Upgrade Now';
  };

  const isButtonDisabled = (plan: string) => {
    return plan === currentPlan || plan === 'FREE' || upgrading !== null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="ml-1 text-xs text-green-600 font-semibold">Save 10%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plansToShow.map(plan => {
          const isCurrentPlan = plan.plan === currentPlan;
          const isPopular = plan.plan === 'STARTER';
          const price = plan.price[billingCycle];
          const annualSavings =
            billingCycle === 'annual' && plan.price.monthly > 0
              ? (plan.price.monthly - plan.price.annual) * 12
              : 0;

          return (
            <Card
              key={plan.plan}
              className={`relative p-6 ${
                isCurrentPlan
                  ? 'border-blue-500 bg-blue-50'
                  : isPopular
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200'
              }`}
            >
              {/* Popular Badge */}
              {isPopular && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-orange-500 text-white">Most Popular</Badge>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Current Plan</Badge>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>

                <div className="mb-4">
                  {price === 0 ? (
                    <div className="text-3xl font-bold text-gray-900">Free</div>
                  ) : (
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        ${price}
                        <span className="text-lg font-normal text-gray-600">/month</span>
                      </div>
                      {billingCycle === 'annual' && annualSavings > 0 && (
                        <div className="text-sm text-green-600 font-medium">
                          Save ${annualSavings}/year
                        </div>
                      )}
                      {billingCycle === 'annual' && price > 0 && (
                        <div className="text-sm text-gray-500">
                          Billed annually (${price * 12}/year)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleUpgrade(plan.plan)}
                  disabled={isButtonDisabled(plan.plan)}
                  className={`w-full mb-6 ${
                    isCurrentPlan
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 cursor-default'
                      : isPopular
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                  variant={isCurrentPlan ? 'outline' : 'default'}
                >
                  {getButtonText(plan.plan)}
                </Button>

                <div className="space-y-3 text-left">
                  <div className="text-sm font-medium text-gray-900 mb-2">Features:</div>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {billingCycle === 'annual' && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            All annual plans include a 10% discount compared to monthly billing
          </p>
        </div>
      )}
    </div>
  );
}
