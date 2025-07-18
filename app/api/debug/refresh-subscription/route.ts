import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { subscriptionService } from '@/lib/services/subscription-service';
import { headers } from 'next/headers';

// GET /api/debug/refresh-subscription - Refresh subscription calculation
export async function GET(_request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get fresh usage calculation
    const usage = await subscriptionService.getCurrentUsage(session.user.id);

    return NextResponse.json({
      message: 'Subscription refreshed',
      usage,
      debug: {
        currentDate: new Date().toISOString(),
        nextResetCalculation: {
          now: new Date(),
          nextReset: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          daysUntilReset: Math.ceil(
            (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime() -
              new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        },
      },
    });
  } catch (error) {
    console.error('Error refreshing subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
