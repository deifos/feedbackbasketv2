import { PLAN_CONFIGS } from '@/lib/config/plans';
import type { SubscriptionPlan, SubscriptionStatus } from '@/app/generated/prisma';
import prisma from '../prisma';

export interface UsageStats {
  currentPlan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingPeriod: {
    start: Date | null;
    end: Date | null;
  };
  feedback: {
    used: number;
    limit: number;
    percentage: number;
  };
  projects: {
    used: number;
    limit: number;
  };
  isOverLimit: boolean;
  daysUntilReset: number;
}

export class SubscriptionService {
  /**
   * Get the current subscription plan for a user
   */
  async getCurrentPlan(userId: string): Promise<SubscriptionPlan> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    return subscription?.plan ?? 'FREE';
  }

  /**
   * Initialize subscription for a new user (defaults to Free plan)
   */
  async initializeUserSubscription(userId: string): Promise<void> {
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (existingSubscription) {
      return; // Already initialized
    }

    const freeConfig = PLAN_CONFIGS.FREE;

    await prisma.subscription.create({
      data: {
        userId,
        plan: 'FREE',
        status: 'ACTIVE',
        feedbackLimit: freeConfig.feedbackPerMonth,
        projectLimit: freeConfig.projects,
        feedbackUsedThisPeriod: 0,
        projectCount: 0,
        // No billing period for free plan
        currentPeriodStart: null,
        currentPeriodEnd: null,
      },
    });
  }

  /**
   * Get current usage statistics for a user
   */
  async getCurrentUsage(userId: string): Promise<UsageStats> {
    // Ensure user has a subscription record
    await this.initializeUserSubscription(userId);

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new Error('Failed to initialize user subscription');
    }

    // Get actual project count
    const actualProjectCount = await prisma.project.count({
      where: { userId },
    });

    // Update project count in subscription if it's different
    if (actualProjectCount !== subscription.projectCount) {
      await prisma.subscription.update({
        where: { userId },
        data: { projectCount: actualProjectCount },
      });
    }

    const feedbackPercentage =
      subscription.feedbackLimit > 0
        ? (subscription.feedbackUsedThisPeriod / subscription.feedbackLimit) * 100
        : 0;

    const isOverLimit = subscription.feedbackUsedThisPeriod > subscription.feedbackLimit;

    // Calculate days until reset
    let daysUntilReset = 0;
    if (subscription.plan === 'FREE') {
      // For FREE plan, reset on the 1st of each month for simplicity
      const now = new Date();
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      daysUntilReset = Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } else if (subscription.currentPeriodEnd) {
      // For paid plans, use the actual billing period end
      const now = new Date();
      daysUntilReset = Math.ceil(
        (subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return {
      currentPlan: subscription.plan,
      status: subscription.status,
      billingPeriod: {
        start: subscription.currentPeriodStart,
        end: subscription.currentPeriodEnd,
      },
      feedback: {
        used: subscription.feedbackUsedThisPeriod,
        limit: subscription.feedbackLimit,
        percentage: Math.round(feedbackPercentage),
      },
      projects: {
        used: actualProjectCount,
        limit: subscription.projectLimit,
      },
      isOverLimit,
      daysUntilReset: Math.max(0, daysUntilReset),
    };
  }

  /**
   * Create a new subscription (for upgrading from free to paid)
   */
  async createSubscription(
    userId: string,
    plan: SubscriptionPlan,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    stripePriceId: string,
    currentPeriodStart: Date,
    currentPeriodEnd: Date
  ): Promise<void> {
    const planConfig = PLAN_CONFIGS[plan];

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: 'ACTIVE',
        stripeCustomerId,
        stripeSubscriptionId,
        stripePriceId,
        currentPeriodStart,
        currentPeriodEnd,
        feedbackLimit: planConfig.feedbackPerMonth,
        projectLimit: planConfig.projects,
        feedbackUsedThisPeriod: 0,
        projectCount: await prisma.project.count({ where: { userId } }),
      },
      update: {
        plan,
        status: 'ACTIVE',
        stripeCustomerId,
        stripeSubscriptionId,
        stripePriceId,
        currentPeriodStart,
        currentPeriodEnd,
        feedbackLimit: planConfig.feedbackPerMonth,
        projectLimit: planConfig.projects,
        // Keep existing usage counts when upgrading
      },
    });

    // Update feedback visibility when upgrading
    await this.updateFeedbackVisibility(userId);
  }

  /**
   * Update an existing subscription
   */
  async updateSubscription(
    userId: string,
    updates: {
      plan?: SubscriptionPlan;
      status?: SubscriptionStatus;
      stripePriceId?: string;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
    }
  ): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const updateData: Record<string, unknown> = { ...updates };

    // If plan is changing, update limits
    if (updates.plan && updates.plan !== subscription.plan) {
      const planConfig = PLAN_CONFIGS[updates.plan];
      updateData.feedbackLimit = planConfig.feedbackPerMonth;
      updateData.projectLimit = planConfig.projects;
    }

    await prisma.subscription.update({
      where: { userId },
      data: updateData,
    });

    // Update feedback visibility if plan changed
    if (updates.plan && updates.plan !== subscription.plan) {
      await this.updateFeedbackVisibility(userId);
    }
  }

  /**
   * Cancel a subscription (downgrade to free)
   */
  async cancelSubscription(userId: string): Promise<void> {
    const freeConfig = PLAN_CONFIGS.FREE;

    await prisma.subscription.update({
      where: { userId },
      data: {
        plan: 'FREE',
        status: 'ACTIVE',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        feedbackLimit: freeConfig.feedbackPerMonth,
        projectLimit: freeConfig.projects,
        // Reset usage for new free period
        feedbackUsedThisPeriod: 0,
      },
    });

    // Update feedback visibility for downgraded plan
    await this.updateFeedbackVisibility(userId);
  }

  /**
   * Increment feedback usage for a user
   */
  async incrementFeedbackUsage(userId: string): Promise<void> {
    await this.initializeUserSubscription(userId);

    const subscription = await prisma.subscription.update({
      where: { userId },
      data: {
        feedbackUsedThisPeriod: {
          increment: 1,
        },
      },
    });

    // Check if user is now over limit and update feedback visibility
    if (subscription.feedbackUsedThisPeriod > subscription.feedbackLimit) {
      await this.updateFeedbackVisibility(userId);
    }
  }

  /**
   * Reset monthly usage (called by billing cycle or monthly job)
   */
  async resetMonthlyUsage(userId: string): Promise<void> {
    await prisma.subscription.update({
      where: { userId },
      data: {
        feedbackUsedThisPeriod: 0,
      },
    });

    // Make all feedback visible again after reset
    await this.updateFeedbackVisibility(userId);
  }

  /**
   * Update feedback visibility based on current plan limits
   */
  async updateFeedbackVisibility(userId: string): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return;

    // Get all user's projects
    const projects = await prisma.project.findMany({
      where: { userId },
      select: { id: true },
    });

    const projectIds = projects.map(p => p.id);

    if (projectIds.length === 0) return;

    // Get all feedback for user's projects, ordered by creation date (newest first)
    const allFeedback = await prisma.feedback.findMany({
      where: {
        projectId: { in: projectIds },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    // Determine which feedback should be visible
    const visibleCount = Math.min(subscription.feedbackLimit, allFeedback.length);
    const visibleFeedbackIds = allFeedback.slice(0, visibleCount).map(f => f.id);
    const hiddenFeedbackIds = allFeedback.slice(visibleCount).map(f => f.id);

    // Update visibility and ranking
    if (visibleFeedbackIds.length > 0) {
      await prisma.feedback.updateMany({
        where: {
          id: { in: visibleFeedbackIds },
        },
        data: {
          isVisible: true,
        },
      });

      // Set visibility rank for visible feedback
      for (let i = 0; i < visibleFeedbackIds.length; i++) {
        await prisma.feedback.update({
          where: { id: visibleFeedbackIds[i] },
          data: { visibilityRank: i + 1 },
        });
      }
    }

    if (hiddenFeedbackIds.length > 0) {
      await prisma.feedback.updateMany({
        where: {
          id: { in: hiddenFeedbackIds },
        },
        data: {
          isVisible: false,
          visibilityRank: null,
        },
      });
    }
  }

  /**
   * Check if user can create a new project
   */
  async canCreateProject(userId: string): Promise<boolean> {
    const usage = await this.getCurrentUsage(userId);
    return usage.projects.used < usage.projects.limit;
  }

  /**
   * Get visible feedback for a project (respects plan limits)
   */
  async getVisibleFeedback(
    userId: string,
    projectId: string,
    options: {
      skip?: number;
      take?: number;
      orderBy?: 'createdAt' | 'visibilityRank';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ) {
    const { skip = 0, take = 50, orderBy = 'createdAt', orderDirection = 'desc' } = options;

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    return prisma.feedback.findMany({
      where: {
        projectId,
        isVisible: true,
      },
      orderBy: {
        [orderBy]: orderDirection,
      },
      skip,
      take,
      include: {
        project: {
          select: {
            name: true,
            url: true,
          },
        },
      },
    });
  }
  /**
   * Get Stripe customer ID for a user (returns existing or null)
   */
  async getStripeCustomerId(userId: string): Promise<string | null> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { stripeCustomerId: true },
    });

    return subscription?.stripeCustomerId || null;
  }

  /**
   * Update Stripe customer ID for a user
   */
  async updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
    await this.initializeUserSubscription(userId);

    await prisma.subscription.update({
      where: { userId },
      data: { stripeCustomerId },
    });
  }
}

// Export a singleton instance
export const subscriptionService = new SubscriptionService();

// Helper function to get plan configuration
export function getPlanConfig(plan: SubscriptionPlan) {
  return PLAN_CONFIGS[plan];
}

// Helper function to check if a plan is paid
export function isPaidPlan(plan: SubscriptionPlan): boolean {
  return plan !== 'FREE';
}

// Helper function to get upgrade options for a current plan
export function getUpgradeOptions(currentPlan: SubscriptionPlan): SubscriptionPlan[] {
  switch (currentPlan) {
    case 'FREE':
      return ['STARTER', 'PRO'];
    case 'STARTER':
      return ['PRO'];
    case 'PRO':
      return [];
    default:
      return [];
  }
}

// Helper function to calculate annual savings
export function getAnnualSavings(plan: Exclude<SubscriptionPlan, 'FREE'>): number {
  const config = PLAN_CONFIGS[plan];
  const monthlyTotal = config.price.monthly * 12;
  const annualTotal = config.price.annual * 12;
  return monthlyTotal - annualTotal;
}
