import { auth } from '@/auth';
import { UserPaymentHistory } from '@/components/user-payment-history';
import { UsageDisplay } from '@/components/usage-display';
import { headers } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { subscriptionService } from '@/lib/services/subscription-service';
import { BillingActions } from '@/components/billing-actions';

export default async function BillingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <main className="container mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-500">Please sign in to view your billing information.</p>
        </div>
      </main>
    );
  }

  // Get current subscription info
  const usage = await subscriptionService.getCurrentUsage(session.user.id);

  return (
    <main className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Billing & Payments</h1>
        <p className="text-gray-600 mt-1">
          Manage your subscription, view payment history, and track usage.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Current Plan & Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Current Plan Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Current Plan
                <Badge variant={usage.currentPlan === 'FREE' ? 'secondary' : 'default'}>
                  {usage.currentPlan}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">
                    {usage.status === 'ACTIVE' ? 'Active' : usage.status}
                  </span>
                </div>
                {usage.billingPeriod.start && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Billing Period:</span>
                    <span className="font-medium">
                      {new Date(usage.billingPeriod.start).toLocaleDateString()} -{' '}
                      {usage.billingPeriod.end
                        ? new Date(usage.billingPeriod.end).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                )}
                {usage.daysUntilReset > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Next Reset:</span>
                    <span className="font-medium">
                      {usage.daysUntilReset} day{usage.daysUntilReset !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <BillingActions currentPlan={usage.currentPlan} />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Feedback Used</span>
                  <span className="font-medium">
                    {usage.feedback.used} / {usage.feedback.limit}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Projects</span>
                  <span className="font-medium">
                    {usage.projects.used} / {usage.projects.limit}
                  </span>
                </div>
                {usage.isOverLimit && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    ⚠️ You&rsquo;ve exceeded your limits. Consider upgrading.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Usage & Payment History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Usage Display */}
          <UsageDisplay compact={false} showUpgradePrompt={true} />

          {/* Payment History */}
          <UserPaymentHistory />
        </div>
      </div>
    </main>
  );
}
