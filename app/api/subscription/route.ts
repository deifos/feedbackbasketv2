import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { subscriptionService } from '@/lib/services/subscription-service';
import { headers } from 'next/headers';

// GET /api/subscription - Get current subscription and usage
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

    const usage = await subscriptionService.getCurrentUsage(session.user.id);

    return NextResponse.json({ usage });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription data' }, { status: 500 });
  }
}

// POST /api/subscription/initialize - Initialize subscription for new user
export async function POST(_request: NextRequest) {
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

    await subscriptionService.initializeUserSubscription(session.user.id);
    const usage = await subscriptionService.getCurrentUsage(session.user.id);

    return NextResponse.json({
      message: 'Subscription initialized',
      usage,
    });
  } catch (error) {
    console.error('Error initializing subscription:', error);
    return NextResponse.json({ error: 'Failed to initialize subscription' }, { status: 500 });
  }
}
