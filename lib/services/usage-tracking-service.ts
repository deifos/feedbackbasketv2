import prisma from '../prisma';
import { subscriptionService } from './subscription-service';
import type { SubscriptionPlan } from '@/app/generated/prisma';

export interface UsageTrackingStats {
  userId: string;
  currentPlan: SubscriptionPlan;
  feedbackUsage: {
    used: number;
    limit: number;
    percentage: number;
    isOverLimit: boolean;
  };
  projectUsage: {
    used: number;
    limit: number;
    isAtLimit: boolean;
  };
  billingPeriod: {
    start: Date | null;
    end: Date | null;
    daysRemaining: number;
  };
}

export class UsageTrackingService {
  /**
   * Track feedback creation for a user
   */
  async trackFeedbackCreation(userId: string, projectId: string): Promise<void> {
    try {
      // Verify the project belongs to the user
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: userId,
        },
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      // Increment feedback usage in subscription
      await subscriptionService.incrementFeedbackUsage(userId);

      // Log the usage tracking event
      console.log(`Feedback usage tracked for user ${userId}, project ${projectId}`);
    } catch (error) {
      console.error('Error tracking feedback creation:', error);
      throw error;
    }
  }

  /**
   * Track project creation for a user
   */
  async trackProjectCreation(userId: string, _projectId: string): Promise<void> {
    try {
      // Update project count in subscription
      const actualProjectCount = await prisma.project.count({
        where: { userId },
      });

      await prisma.subscription.update({
        where: { userId },
        data: { projectCount: actualProjectCount },
      });

      console.log(`Project creation tracked for user ${userId}, new count: ${actualProjectCount}`);
    } catch (error) {
      console.error('Error tracking project creation:', error);
      throw error;
    }
  }

  /**
   * Track project deletion for a user
   */
  async trackProjectDeletion(userId: string): Promise<void> {
    try {
      // Update project count in subscription
      const actualProjectCount = await prisma.project.count({
        where: { userId },
      });

      await prisma.subscription.update({
        where: { userId },
        data: { projectCount: actualProjectCount },
      });

      console.log(`Project deletion tracked for user ${userId}, new count: ${actualProjectCount}`);
    } catch (error) {
      console.error('Error tracking project deletion:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive usage statistics for a user
   */
  async getUsageStats(userId: string): Promise<UsageTrackingStats> {
    try {
      // Get current usage from subscription service
      const usage = await subscriptionService.getCurrentUsage(userId);

      return {
        userId,
        currentPlan: usage.currentPlan,
        feedbackUsage: {
          used: usage.feedback.used,
          limit: usage.feedback.limit,
          percentage: usage.feedback.percentage,
          isOverLimit: usage.isOverLimit,
        },
        projectUsage: {
          used: usage.projects.used,
          limit: usage.projects.limit,
          isAtLimit: usage.projects.used >= usage.projects.limit,
        },
        billingPeriod: {
          start: usage.billingPeriod.start,
          end: usage.billingPeriod.end,
          daysRemaining: usage.daysUntilReset,
        },
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      throw error;
    }
  }

  /**
   * Check if user can create feedback (within limits)
   */
  async canCreateFeedback(userId: string): Promise<boolean> {
    try {
      const _stats = await this.getUsageStats(userId);
      // Always allow feedback creation (soft limits - store all, show limited)
      return true;
    } catch (error) {
      console.error('Error checking feedback creation limits:', error);
      return true; // Default to allowing feedback creation
    }
  }

  /**
   * Check if user can create project (within limits)
   */
  async canCreateProject(userId: string): Promise<boolean> {
    try {
      return await subscriptionService.canCreateProject(userId);
    } catch (error) {
      console.error('Error checking project creation limits:', error);
      return false; // Default to not allowing project creation on error
    }
  }

  /**
   * Reset monthly usage for a user
   */
  async resetMonthlyUsage(userId: string): Promise<void> {
    try {
      await subscriptionService.resetMonthlyUsage(userId);
      console.log(`Monthly usage reset for user ${userId}`);
    } catch (error) {
      console.error('Error resetting monthly usage:', error);
      throw error;
    }
  }

  /**
   * Reset monthly usage for all users (batch operation)
   */
  async resetMonthlyUsageForAllUsers(): Promise<void> {
    try {
      console.log('Starting monthly usage reset for all users...');

      // Get all users with subscriptions
      const subscriptions = await prisma.subscription.findMany({
        select: { userId: true },
      });

      let resetCount = 0;
      let errorCount = 0;

      // Reset usage for each user
      for (const subscription of subscriptions) {
        try {
          await this.resetMonthlyUsage(subscription.userId);
          resetCount++;
        } catch (error) {
          console.error(`Failed to reset usage for user ${subscription.userId}:`, error);
          errorCount++;
        }
      }

      console.log(`Monthly usage reset completed: ${resetCount} successful, ${errorCount} errors`);
    } catch (error) {
      console.error('Error in batch monthly usage reset:', error);
      throw error;
    }
  }

  /**
   * Get users approaching their limits (for notifications)
   */
  async getUsersApproachingLimits(threshold: number = 0.9): Promise<string[]> {
    try {
      // Use raw SQL to compare feedbackUsedThisPeriod with calculated threshold
      const subscriptions = await prisma.$queryRaw<Array<{ userId: string }>>`
        SELECT "userId" 
        FROM "subscription" 
        WHERE "feedbackUsedThisPeriod" >= FLOOR("feedbackLimit" * ${threshold})
        AND "feedbackUsedThisPeriod" < "feedbackLimit"
      `;

      return subscriptions.map(sub => sub.userId);
    } catch (error) {
      console.error('Error getting users approaching limits:', error);
      return [];
    }
  }

  /**
   * Get users who have exceeded their limits
   */
  async getUsersOverLimits(): Promise<string[]> {
    try {
      // Use raw SQL to compare feedbackUsedThisPeriod with feedbackLimit
      const subscriptions = await prisma.$queryRaw<Array<{ userId: string }>>`
        SELECT "userId" 
        FROM "subscription" 
        WHERE "feedbackUsedThisPeriod" > "feedbackLimit"
      `;

      return subscriptions.map(sub => sub.userId);
    } catch (error) {
      console.error('Error getting users over limits:', error);
      return [];
    }
  }

  /**
   * Update feedback visibility for a user (delegates to subscription service)
   */
  async updateFeedbackVisibility(userId: string): Promise<void> {
    try {
      // This is handled internally by the subscription service
      // We can trigger it by calling resetMonthlyUsage with current usage
      const usage = await subscriptionService.getCurrentUsage(userId);

      // Force a visibility update by incrementing and decrementing usage
      await subscriptionService.incrementFeedbackUsage(userId);

      // Decrement back to original value
      await prisma.subscription.update({
        where: { userId },
        data: {
          feedbackUsedThisPeriod: usage.feedback.used,
        },
      });

      console.log(`Feedback visibility updated for user ${userId}`);
    } catch (error) {
      console.error('Error updating feedback visibility:', error);
      throw error;
    }
  }

  /**
   * Get usage summary for admin/monitoring purposes
   */
  async getUsageSummary(): Promise<{
    totalUsers: number;
    totalFeedback: number;
    totalProjects: number;
    planDistribution: Record<SubscriptionPlan, number>;
    usersOverLimit: number;
    usersApproachingLimit: number;
  }> {
    try {
      const [
        totalUsers,
        totalFeedback,
        totalProjects,
        planDistribution,
        usersOverLimit,
        usersApproachingLimit,
      ] = await Promise.all([
        prisma.subscription.count(),
        prisma.feedback.count(),
        prisma.project.count(),
        prisma.subscription.groupBy({
          by: ['plan'],
          _count: { plan: true },
        }),
        this.getUsersOverLimits(),
        this.getUsersApproachingLimits(),
      ]);

      const planDist = planDistribution.reduce(
        (acc, item) => {
          acc[item.plan] = item._count.plan;
          return acc;
        },
        {} as Record<SubscriptionPlan, number>
      );

      return {
        totalUsers,
        totalFeedback,
        totalProjects,
        planDistribution: planDist,
        usersOverLimit: usersOverLimit.length,
        usersApproachingLimit: usersApproachingLimit.length,
      };
    } catch (error) {
      console.error('Error getting usage summary:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const usageTrackingService = new UsageTrackingService();
