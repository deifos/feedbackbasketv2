import prisma from '../prisma';
import type { PaymentStatus, SubscriptionPlan } from '@/app/generated/prisma';

export interface PaymentRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  planAtPayment: SubscriptionPlan;
  billingCycle: string | null;
  paidAt: Date | null;
  createdAt: Date;
  description: string | null;
  failureReason: string | null;
  stripeInvoiceId: string;
}

export interface PaymentFilters {
  userId?: string;
  status?: PaymentStatus;
  planAtPayment?: SubscriptionPlan;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export class PaymentService {
  /**
   * Create a payment record from Stripe invoice data
   */
  async createPaymentRecord(
    userId: string,
    invoiceData: {
      stripeInvoiceId: string;
      stripePaymentIntentId?: string;
      stripeSubscriptionId?: string;
      amount: number;
      currency: string;
      status: PaymentStatus;
      planAtPayment: SubscriptionPlan;
      billingCycle?: string;
      paidAt?: Date;
      description?: string;
      failureReason?: string;
    }
  ): Promise<void> {
    console.log('🔥 PAYMENT SERVICE: Creating payment record');
    console.log('User ID:', userId);
    console.log('Invoice data:', invoiceData);

    try {
      const result = await prisma.payment.create({
        data: {
          userId,
          stripeInvoiceId: invoiceData.stripeInvoiceId,
          stripePaymentIntentId: invoiceData.stripePaymentIntentId,
          stripeSubscriptionId: invoiceData.stripeSubscriptionId,
          amount: invoiceData.amount,
          currency: invoiceData.currency,
          status: invoiceData.status,
          planAtPayment: invoiceData.planAtPayment,
          billingCycle: invoiceData.billingCycle,
          paidAt: invoiceData.paidAt,
          description: invoiceData.description,
          failureReason: invoiceData.failureReason,
        },
      });

      console.log('✅ PAYMENT RECORD CREATED IN DATABASE!');
      console.log('Payment ID:', result.id);
      console.log(
        `Payment record created for user ${userId}, invoice ${invoiceData.stripeInvoiceId}`
      );
    } catch (error) {
      console.error('❌ ERROR CREATING PAYMENT RECORD:', error);
      console.error('Error details:', {
        userId,
        invoiceData,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Update payment status (e.g., when payment succeeds or fails)
   */
  async updatePaymentStatus(
    stripeInvoiceId: string,
    status: PaymentStatus,
    paidAt?: Date,
    failureReason?: string
  ): Promise<void> {
    try {
      await prisma.payment.update({
        where: { stripeInvoiceId },
        data: {
          status,
          paidAt,
          failureReason,
          updatedAt: new Date(),
        },
      });

      console.log(`Payment status updated for invoice ${stripeInvoiceId}: ${status}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Get payment history with filtering and pagination
   */
  async getPaymentHistory(filters: PaymentFilters = {}): Promise<{
    payments: PaymentRecord[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const { userId, status, planAtPayment, dateFrom, dateTo, limit = 50, offset = 0 } = filters;

      // Build where clause
      const whereClause: Record<string, unknown> = {};

      if (userId) whereClause.userId = userId;
      if (status) whereClause.status = status;
      if (planAtPayment) whereClause.planAtPayment = planAtPayment;

      if (dateFrom || dateTo) {
        whereClause.paidAt = {} as any;
        if (dateFrom) (whereClause.paidAt as any).gte = dateFrom;
        if (dateTo) (whereClause.paidAt as any).lte = dateTo;
      }

      // Get payments with user data
      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          skip: offset,
        }),
        prisma.payment.count({ where: whereClause }),
      ]);

      // Transform to PaymentRecord format
      const paymentRecords: PaymentRecord[] = payments.map(payment => ({
        id: payment.id,
        userId: payment.userId,
        userName: payment.user.name,
        userEmail: payment.user.email,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        planAtPayment: payment.planAtPayment,
        billingCycle: payment.billingCycle,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        description: payment.description,
        failureReason: payment.failureReason,
        stripeInvoiceId: payment.stripeInvoiceId,
      }));

      return {
        payments: paymentRecords,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  }

  /**
   * Get payment summary statistics
   */
  async getPaymentSummary(): Promise<{
    totalPayments: number;
    totalRevenue: number;
    successfulPayments: number;
    failedPayments: number;
    planBreakdown: Record<SubscriptionPlan, { count: number; revenue: number }>;
  }> {
    try {
      const [totalStats, _successfulStats, _failedStats, planStats] = await Promise.all([
        // Total payments and revenue
        prisma.payment.aggregate({
          _count: { id: true },
          _sum: { amount: true },
        }),
        // Successful payments
        prisma.payment.count({
          where: { status: 'SUCCEEDED' },
        }),
        // Failed payments
        prisma.payment.count({
          where: { status: 'FAILED' },
        }),
        // Revenue by plan
        prisma.payment.groupBy({
          by: ['planAtPayment'],
          where: { status: 'SUCCEEDED' },
          _count: { id: true },
          _sum: { amount: true },
        }),
      ]);

      // Build plan breakdown
      const planBreakdown: Record<SubscriptionPlan, { count: number; revenue: number }> = {
        FREE: { count: 0, revenue: 0 },
        STARTER: { count: 0, revenue: 0 },
        PRO: { count: 0, revenue: 0 },
      };

      planStats.forEach(stat => {
        planBreakdown[stat.planAtPayment] = {
          count: stat._count.id,
          revenue: stat._sum.amount || 0,
        };
      });

      return {
        totalPayments: totalStats._count.id || 0,
        totalRevenue: totalStats._sum.amount || 0,
        successfulPayments: _successfulStats,
        failedPayments: _failedStats,
        planBreakdown,
      };
    } catch (error) {
      console.error('Error getting payment summary:', error);
      throw error;
    }
  }

  /**
   * Get payment record by Stripe invoice ID
   */
  async getPaymentByInvoiceId(stripeInvoiceId: string): Promise<PaymentRecord | null> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { stripeInvoiceId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!payment) return null;

      return {
        id: payment.id,
        userId: payment.userId,
        userName: payment.user.name,
        userEmail: payment.user.email,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        planAtPayment: payment.planAtPayment,
        billingCycle: payment.billingCycle,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        description: payment.description,
        failureReason: payment.failureReason,
        stripeInvoiceId: payment.stripeInvoiceId,
      };
    } catch (error) {
      console.error('Error getting payment by invoice ID:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
