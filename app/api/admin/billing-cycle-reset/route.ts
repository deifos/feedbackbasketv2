import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { runBillingCycleReset } from '@/lib/jobs/monthly-reset';
import { billingCycleService } from '@/lib/services/billing-cycle-service';

// POST /api/admin/billing-cycle-reset - Trigger billing cycle reset
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

    // For demo purposes, allow any authenticated user to trigger this
    // In production, you'd want admin-only access
    console.log(`Billing cycle reset triggered by user ${session.user.id}`);

    const body = await request.json();
    const { mode = 'due-only' } = body;

    let result;
    if (mode === 'due-only') {
      // Only reset users whose billing cycle is actually due
      await runBillingCycleReset();
      result = { message: 'Billing cycle reset completed for due users' };
    } else if (mode === 'preview') {
      // Just preview who would be reset
      const upcoming = await billingCycleService.getUpcomingResets(0);
      result = { 
        message: 'Preview mode - no resets performed',
        upcomingResets: upcoming
      };
    } else {
      return NextResponse.json({ error: 'Invalid mode. Use "due-only" or "preview"' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in billing cycle reset endpoint:', error);
    return NextResponse.json({ error: 'Failed to trigger billing cycle reset' }, { status: 500 });
  }
}

// GET /api/admin/billing-cycle-reset - Get upcoming resets preview
export async function GET(request: NextRequest) {
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

    const url = new URL(request.url);
    const daysAhead = parseInt(url.searchParams.get('days') || '7');

    const upcoming = await billingCycleService.getUpcomingResets(daysAhead);

    return NextResponse.json({
      upcomingResets: upcoming,
      daysAhead,
      message: `Found ${upcoming.totalUsers} users with billing cycles due in the next ${daysAhead} days`
    });
  } catch (error) {
    console.error('Error getting upcoming resets:', error);
    return NextResponse.json({ error: 'Failed to get upcoming resets' }, { status: 500 });
  }
}