'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { SubscriptionPlan } from '@/app/generated/prisma';

interface BillingActionsProps {
  currentPlan: SubscriptionPlan;
}

export function BillingActions({ currentPlan }: BillingActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const { portalUrl } = await response.json();
        window.location.href = portalUrl;
      } else {
        console.error('Failed to create portal session');
        alert('Unable to open subscription management. Please try again.');
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {currentPlan !== 'FREE' ? (
        <Button
          className="w-full"
          variant="outline"
          onClick={handleManageSubscription}
          disabled={loading}
        >
          {loading ? 'Opening...' : 'Manage Subscription'}
        </Button>
      ) : (
        <Button asChild className="w-full">
          <a href="/pricing">Upgrade Plan</a>
        </Button>
      )}
    </div>
  );
}
