import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { subscriptionService } from '@/lib/services/subscription-service';

// GET /api/subscription/can-create-project - Check if user can create a new project
export async function GET(_request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const canCreate = await subscriptionService.canCreateProject(session.user.id);
    const usage = await subscriptionService.getCurrentUsage(session.user.id);

    // Get available upgrade options if user can't create projects
    const upgradeOptions = [];
    if (!canCreate) {
      if (usage.currentPlan === 'FREE') {
        upgradeOptions.push(
          { plan: 'STARTER', projects: 3, price: { monthly: 19, annual: 17 } },
          { plan: 'PRO', projects: 10, price: { monthly: 39, annual: 35 } }
        );
      } else if (usage.currentPlan === 'STARTER') {
        upgradeOptions.push({ plan: 'PRO', projects: 10, price: { monthly: 39, annual: 35 } });
      }
    }

    return NextResponse.json({
      canCreate,
      projectUsage: usage.projects,
      currentPlan: usage.currentPlan,
      upgradeOptions: !canCreate ? upgradeOptions : [],
      message: !canCreate
        ? `You've reached your project limit of ${usage.projects.limit} for the ${usage.currentPlan} plan.`
        : `You can create ${usage.projects.limit - usage.projects.used} more projects.`,
    });
  } catch (error) {
    console.error('Error checking project creation limit:', error);
    return NextResponse.json({ error: 'Failed to check project limits' }, { status: 500 });
  }
}
