'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, ArrowRight, Zap } from 'lucide-react';
import { useProjectLimits } from '@/hooks/use-project-limits';
import { PricingTable } from '@/components/pricing-table';

interface AddProjectButtonProps {
  variant?: 'default' | 'card';
  className?: string;
}

export function AddProjectButton({ variant = 'default', className = '' }: AddProjectButtonProps) {
  const { limitInfo, loading, canCreateProject, needsUpgrade, upgradeOptions } = useProjectLimits();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();

  const handleAddProject = () => {
    if (canCreateProject) {
      router.push('/dashboard/projects/new');
    } else {
      setShowUpgradeModal(true);
    }
  };

  if (loading) {
    return (
      <Button disabled className={className}>
        <Plus className="w-4 h-4 mr-2" />
        Add Project
      </Button>
    );
  }

  // Convert upgradeOptions to match PricingTable expected format
  const pricingUpgradeOptions = upgradeOptions.map(option => ({
    ...option,
    feedback: option.plan === 'STARTER' ? 500 : option.plan === 'PRO' ? 2000 : 100,
  }));

  // Upgrade Dialog Component
  const UpgradeDialog = () => (
    <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Upgrade Your Plan
            </DialogTitle>
            <p className="text-gray-600 mt-2">
              {variant === 'card'
                ? "You've reached your project limit. Choose a plan that fits your needs."
                : `You've reached your project limit of ${limitInfo?.projectUsage.limit} on the ${limitInfo?.currentPlan} plan.`}
            </p>
          </DialogHeader>

          <div className="mt-6">
            <PricingTable
              currentPlan={limitInfo?.currentPlan || 'FREE'}
              upgradeOptions={pricingUpgradeOptions}
              showCurrentPlan={false}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (variant === 'card' && needsUpgrade) {
    return (
      <div>
        <Card className={`p-4 border-orange-200 bg-orange-50 ${className}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Project Limit Reached</h3>
                <p className="text-sm text-gray-600">
                  You&apos;ve used {limitInfo?.projectUsage.used} of {limitInfo?.projectUsage.limit}{' '}
                  projects on the{' '}
                  <Badge variant="secondary" className="text-xs">
                    {limitInfo?.currentPlan}
                  </Badge>{' '}
                  plan
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        </Card>
        <UpgradeDialog />
      </div>
    );
  }

  return (
    <div>
      <Button
        onClick={handleAddProject}
        disabled={loading}
        className={`${
          needsUpgrade ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
        } ${className}`}
      >
        <Plus className="w-4 h-4 mr-2" />
        {needsUpgrade ? 'Upgrade to Add Projects' : 'Add Project'}
      </Button>
      <UpgradeDialog />
    </div>
  );
}
