import { auth } from '@/auth';
import { PricingTable } from '@/components/pricing-table';
import { subscriptionService } from '@/lib/services/subscription-service';
import { headers } from 'next/headers';

export default async function PricingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let currentPlan = 'FREE';

  if (session) {
    try {
      const usage = await subscriptionService.getCurrentUsage(session.user.id);
      currentPlan = usage.currentPlan;
    } catch (error) {
      console.error('Error fetching user plan:', error);
    }
  }

  return (
    <main className="container mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Select the perfect plan for your feedback collection needs. All plans include full access
          to features with different capacity limits.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="max-w-5xl w-full">
          <PricingTable currentPlan={currentPlan} showCurrentPlan={true} />
        </div>
      </div>

      <div className="mt-12 text-center">
        <div className="bg-gray-50 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                What happens to my data if I downgrade?
              </h4>
              <p className="text-sm text-gray-600">
                All your data is preserved. If you exceed new limits, older feedback will be hidden
                but can be restored by upgrading again.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Can I change plans anytime?</h4>
              <p className="text-sm text-gray-600">
                Yes! Upgrades take effect immediately. Downgrades take effect at your next billing
                cycle.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Is there a free trial?</h4>
              <p className="text-sm text-gray-600">
                The Free plan is available forever with no time limits. Upgrade when you need more
                capacity.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                What payment methods do you accept?
              </h4>
              <p className="text-sm text-gray-600">
                We accept all major credit cards through Stripe&apos;s secure payment processing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
