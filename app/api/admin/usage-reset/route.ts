import { NextRequest, NextResponse } from 'next/server';
import {
  runMonthlyUsageReset,
  checkUsageLimits,
  generateUsageReport,
} from '@/lib/jobs/monthly-reset';

// POST /api/admin/usage-reset - Trigger monthly usage reset (admin only)
export async function POST(request: NextRequest) {
  try {
    // Basic security check - in production, you'd want proper admin authentication
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ADMIN_API_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'reset_monthly':
        await runMonthlyUsageReset();
        return NextResponse.json({
          message: 'Monthly usage reset completed successfully',
          timestamp: new Date().toISOString(),
        });

      case 'check_limits':
        await checkUsageLimits();
        return NextResponse.json({
          message: 'Usage limits check completed',
          timestamp: new Date().toISOString(),
        });

      case 'generate_report':
        await generateUsageReport();
        return NextResponse.json({
          message: 'Usage report generated (check logs)',
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: reset_monthly, check_limits, or generate_report' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in admin usage reset:', error);
    return NextResponse.json({ error: 'Failed to perform admin action' }, { status: 500 });
  }
}

// GET /api/admin/usage-reset - Get usage summary (admin only)
export async function GET(request: NextRequest) {
  try {
    // Basic security check
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ADMIN_API_TOKEN;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { usageTrackingService } = await import('@/lib/jobs/monthly-reset');
    const summary = await usageTrackingService.getUsageSummary();

    return NextResponse.json({
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting usage summary:', error);
    return NextResponse.json({ error: 'Failed to get usage summary' }, { status: 500 });
  }
}
