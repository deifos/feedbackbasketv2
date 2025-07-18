import { subscriptionService } from './subscription-service';
import prisma from '../prisma';
import type { SubscriptionPlan } from '@/app/generated/prisma';

export class BillingCycleService {
  /**
   * Reset usage for users whose billing cycle is due
   * This should be run daily to catch all users on their billing date
   */
  async resetDueBillingCycles(): Promise<void> {
    try {
      console.log('Starting billing cycle reset check...');

      const now = new Date();
      let resetCount = 0;
      let errorCount = 0;

      // Get FREE users who need monthly reset (based on signup anniversary)
      const freeUsersToReset = await this.getFreeUsersNeedingReset(now);

      // Get PAID users whose Stripe billing period has ended
      const paidUsersToReset = await this.getPaidUsersNeedingReset(now);

      const allUsersToReset = [...freeUsersToReset, ...paidUsersToReset];

      console.log(`Found ${allUsersToReset.length} users needing billing cycle reset`);

      // Reset each user
      for (const userId of allUsersToReset) {
        try {
          await subscriptionService.resetMonthlyUsage(userId);
          resetCount++;
          console.log(`Reset billing cycle for user ${userId}`);
        } catch (error) {
          console.error(`Failed to reset billing cycle for user ${userId}:`, error);
          errorCount++;
        }
      }

      console.log(`Billing cycle reset completed: ${resetCount} successful, ${errorCount} errors`);
    } catch (error) {
      console.error('Error in billing cycle reset:', error);
      throw error;
    }
  }

  /**
   * Get FREE users who need reset (1st of each month)
   */
  private async getFreeUsersNeedingReset(now: Date): Promise<string[]> {
    try {
      // Find FREE users to reset on the 1st of each month
      const subscriptions = await prisma.subscription.findMany({
        where: {
          plan: 'FREE',
        },
        select: {
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const usersToReset: string[] = [];

      for (const subscription of subscriptions) {
        if (this.shouldResetFreeUser(subscription.createdAt, now)) {
          usersToReset.push(subscription.userId);
        }
      }

      return usersToReset;
    } catch (error) {
      console.error('Error getting FREE users for reset:', error);
      return [];
    }
  }

  /**
   * Get PAID users whose Stripe billing period has ended
   */
  private async getPaidUsersNeedingReset(now: Date): Promise<string[]> {
    try {
      // Find PAID users where the current period has ended
      const subscriptions = await prisma.subscription.findMany({
        where: {
          plan: {
            in: ['STARTER', 'PRO'],
          },
          currentPeriodEnd: {
            lte: now, // Period has ended
          },
          status: 'ACTIVE', // Only reset active subscriptions
        },
        select: {
          userId: true,
          currentPeriodEnd: true,
        },
      });

      return subscriptions.map(sub => sub.userId);
    } catch (error) {
      console.error('Error getting PAID users for reset:', error);
      return [];
    }
  }

  /**
   * Check if a FREE user should be reset (1st of each month)
   */
  private shouldResetFreeUser(signupDate: Date, now: Date): boolean {
    // For FREE users, reset on the 1st of each month for simplicity
    // Check if today is the 1st of the month
    return now.getDate() === 1;
  }

  /**
   * Handle billing period transition for a specific user
   * Called when Stripe webhook indicates a new billing period
   */
  async handleBillingPeriodTransition(
    userId: string,
    newPeriodStart: Date,
    newPeriodEnd: Date
  ): Promise<void> {
    try {
      console.log(`Handling billing period transition for user ${userId}`);

      // Update the billing period in the subscription
      await prisma.subscription.update({
        where: { userId },
        data: {
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
        },
      });

      // Reset the usage for the new period
      await subscriptionService.resetMonthlyUsage(userId);

      console.log(`Billing period transition completed for user ${userId}`);
    } catch (error) {
      console.error(`Error handling billing period transition for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Handle mid-cycle plan changes
   * When a user upgrades/downgrades mid-cycle, we need to handle usage properly
   */
  async handleMidCyclePlanChange(
    userId: string,
    oldPlan: SubscriptionPlan,
    newPlan: SubscriptionPlan,
    _prorationDate: Date
  ): Promise<void> {
    try {
      console.log(`Handling mid-cycle plan change for user ${userId}: ${oldPlan} -> ${newPlan}`);

      // If upgrading to a higher plan, keep current usage but increase limits
      // If downgrading, may need to hide some feedback if over new limits
      if (this.isUpgrade(oldPlan, newPlan)) {
        console.log(`Plan upgrade: keeping current usage, increasing limits`);
        // Usage stays the same, limits increase automatically via plan config
      } else if (this.isDowngrade(oldPlan, newPlan)) {
        console.log(`Plan downgrade: may need to hide excess feedback`);
        // Update feedback visibility to respect new lower limits
        await subscriptionService.updateFeedbackVisibility(userId);
      }

      console.log(`Mid-cycle plan change completed for user ${userId}`);
    } catch (error) {
      console.error(`Error handling mid-cycle plan change for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a plan change is an upgrade
   */
  private isUpgrade(oldPlan: SubscriptionPlan, newPlan: SubscriptionPlan): boolean {
    const planHierarchy = { FREE: 0, STARTER: 1, PRO: 2 };
    return planHierarchy[newPlan] > planHierarchy[oldPlan];
  }

  /**
   * Check if a plan change is a downgrade
   */
  private isDowngrade(oldPlan: SubscriptionPlan, newPlan: SubscriptionPlan): boolean {
    const planHierarchy = { FREE: 0, STARTER: 1, PRO: 2 };
    return planHierarchy[newPlan] < planHierarchy[oldPlan];
  }

  /**
   * Get summary of upcoming billing cycle resets
   */
  async getUpcomingResets(daysAhead: number = 7): Promise<{
    freeUsers: number;
    paidUsers: number;
    totalUsers: number;
  }> {
    try {
      const now = new Date();
      const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      // Count FREE users with anniversaries in the next week
      const freeUsers = await prisma.subscription.count({
        where: {
          plan: 'FREE',
          // This is a simplified count - in practice you'd need more complex date logic
        },
      });

      // Count PAID users with billing periods ending in the next week
      const paidUsers = await prisma.subscription.count({
        where: {
          plan: {
            in: ['STARTER', 'PRO'],
          },
          currentPeriodEnd: {
            gte: now,
            lte: futureDate,
          },
          status: 'ACTIVE',
        },
      });

      return {
        freeUsers,
        paidUsers,
        totalUsers: freeUsers + paidUsers,
      };
    } catch (error) {
      console.error('Error getting upcoming resets:', error);
      return { freeUsers: 0, paidUsers: 0, totalUsers: 0 };
    }
  }
}

// Export singleton instance
export const billingCycleService = new BillingCycleService();
