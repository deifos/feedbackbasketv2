'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { SubscriptionPlan, SubscriptionStatus } from '@/app/generated/prisma';

interface BillingActionsProps {
  currentPlan: SubscriptionPlan;
  status?: SubscriptionStatus;
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
        const errorData = await response.json();
        console.error('Failed to create portal session:', errorData);

        if (errorData.error === 'Customer portal not configured') {
          alert(
            'Customer portal is not configured yet. Please contact support or try again later.'
          );
        } else {
          alert('Unable to open subscription management. Please try again.');
        }
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
        <>
          <Button
            className="w-full"
            variant="outline"
            onClick={handleManageSubscription}
            disabled={loading}
          >
            {loading ? 'Opening...' : 'Manage Subscription'}
          </Button>

          {/* {status === 'CANCELED' && (
            <div className="text-center">
              <p className="text-sm text-orange-600 mb-2">
                Subscription scheduled for cancellation
              </p>
              <Button className="w-full" onClick={handleManageSubscription} disabled={loading}>
                {loading ? 'Opening...' : 'Reactivate Subscription'}
              </Button>
            </div>
          )} */}
        </>
      ) : (
        <Button asChild className="w-full">
          <a href="/pricing">Upgrade Plan</a>
        </Button>
      )}
    </div>
  );
}
