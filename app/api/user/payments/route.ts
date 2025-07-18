import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { paymentService, type PaymentFilters } from '@/lib/services/payment-service';
import type { PaymentStatus, SubscriptionPlan } from '@/app/generated/prisma';

// GET /api/admin/payments - Get payment history with filtering
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
    const searchParams = url.searchParams;

    // Parse query parameters - always filter to current user only for security
    const filters: PaymentFilters = {
      userId: session.user.id, // Always use current user's ID
    };

    // Status filter
    const status = searchParams.get('status') as PaymentStatus | null;
    if (status && ['SUCCEEDED', 'FAILED', 'PENDING', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(status)) {
      filters.status = status;
    }

    // Plan filter
    const plan = searchParams.get('plan') as SubscriptionPlan | null;
    if (plan && ['FREE', 'STARTER', 'PRO'].includes(plan)) {
      filters.planAtPayment = plan;
    }

    // Date range filters
    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      const parsed = new Date(dateFrom);
      if (!isNaN(parsed.getTime())) {
        filters.dateFrom = parsed;
      }
    }

    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      const parsed = new Date(dateTo);
      if (!isNaN(parsed.getTime())) {
        filters.dateTo = parsed;
      }
    }

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    filters.limit = Math.min(limit, 100); // Cap at 100
    filters.offset = Math.max(offset, 0);

    // Get payment history
    const result = await paymentService.getPaymentHistory(filters);

    // Also get summary if requested
    const includeSummary = searchParams.get('includeSummary') === 'true';
    let summary = null;
    if (includeSummary) {
      summary = await paymentService.getPaymentSummary();
    }

    return NextResponse.json({
      ...result,
      summary,
      filters: {
        ...filters,
        dateFrom: filters.dateFrom?.toISOString(),
        dateTo: filters.dateTo?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in payments admin API:', error);
    return NextResponse.json({ error: 'Failed to fetch payment data' }, { status: 500 });
  }
}