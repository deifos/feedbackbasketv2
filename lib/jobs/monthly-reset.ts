import { usageTrackingService } from '@/lib/services/usage-tracking-service';
import { billingCycleService } from '@/lib/services/billing-cycle-service';

/**
 * Daily billing cycle reset job
 * This should be run as a scheduled job (e.g., cron job) daily to catch users
 * whose billing cycles are due for reset (respects individual billing periods)
 */
export async function runBillingCycleReset(): Promise<void> {
  console.log('Starting billing cycle reset job...');

  try {
    const startTime = Date.now();

    // Reset usage for users whose billing cycle is due
    await billingCycleService.resetDueBillingCycles();

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Billing cycle reset job completed successfully in ${duration}ms`);

    // Get summary after reset
    const summary = await usageTrackingService.getUsageSummary();
    console.log('Post-reset usage summary:', summary);
  } catch (error) {
    console.error('Billing cycle reset job failed:', error);
    throw error;
  }
}

/**
 * Legacy monthly usage reset job (for emergency use or initial setup)
 * This resets ALL users regardless of their billing cycle
 */
export async function runMonthlyUsageReset(): Promise<void> {
  console.log('Starting legacy monthly usage reset job...');
  console.warn('WARNING: This resets ALL users regardless of billing cycle. Consider using runBillingCycleReset() instead.');

  try {
    const startTime = Date.now();

    // Reset usage for all users
    await usageTrackingService.resetMonthlyUsageForAllUsers();

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Monthly usage reset job completed successfully in ${duration}ms`);

    // Get summary after reset
    const summary = await usageTrackingService.getUsageSummary();
    console.log('Post-reset usage summary:', summary);
  } catch (error) {
    console.error('Monthly usage reset job failed:', error);
    throw error;
  }
}

/**
 * Check for users approaching limits and log warnings
 * This can be run daily to monitor usage
 */
export async function checkUsageLimits(): Promise<void> {
  console.log('Checking usage limits...');

  try {
    const [usersApproaching, usersOver] = await Promise.all([
      usageTrackingService.getUsersApproachingLimits(0.9),
      usageTrackingService.getUsersOverLimits(),
    ]);

    if (usersApproaching.length > 0) {
      console.log(`${usersApproaching.length} users approaching their limits:`, usersApproaching);
    }

    if (usersOver.length > 0) {
      console.log(`${usersOver.length} users over their limits:`, usersOver);
    }

    if (usersApproaching.length === 0 && usersOver.length === 0) {
      console.log('All users are within their limits');
    }
  } catch (error) {
    console.error('Error checking usage limits:', error);
    throw error;
  }
}

/**
 * Get comprehensive usage report
 */
export async function generateUsageReport(): Promise<void> {
  console.log('Generating usage report...');

  try {
    const summary = await usageTrackingService.getUsageSummary();

    console.log('=== USAGE REPORT ===');
    console.log(`Total Users: ${summary.totalUsers}`);
    console.log(`Total Feedback: ${summary.totalFeedback}`);
    console.log(`Total Projects: ${summary.totalProjects}`);
    console.log('Plan Distribution:', summary.planDistribution);
    console.log(`Users Over Limit: ${summary.usersOverLimit}`);
    console.log(`Users Approaching Limit: ${summary.usersApproachingLimit}`);
    console.log('==================');
  } catch (error) {
    console.error('Error generating usage report:', error);
    throw error;
  }
}

// Export functions for use in API routes or scheduled jobs
export { usageTrackingService };
