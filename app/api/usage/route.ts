import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { usageTrackingService } from '@/lib/services/usage-tracking-service';
import { headers } from 'next/headers';

// GET /api/usage - Get usage statistics for current user
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

    const stats = await usageTrackingService.getUsageStats(session.user.id);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json({ error: 'Failed to fetch usage statistics' }, { status: 500 });
  }
}

// POST /api/usage/reset - Reset monthly usage for current user (admin/testing)
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action } = body;

    if (action === 'reset_monthly') {
      await usageTrackingService.resetMonthlyUsage(session.user.id);

      return NextResponse.json({
        message: 'Monthly usage reset successfully',
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'update_visibility') {
      await usageTrackingService.updateFeedbackVisibility(session.user.id);

      return NextResponse.json({
        message: 'Feedback visibility updated successfully',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in usage action:', error);
    return NextResponse.json({ error: 'Failed to perform usage action' }, { status: 500 });
  }
}
