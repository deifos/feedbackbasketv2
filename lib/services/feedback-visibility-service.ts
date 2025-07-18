import prisma from '@/lib/prisma';
import { subscriptionService } from './subscription-service';

export class FeedbackVisibilityService {
  /**
   * Update feedback visibility for a user based on their subscription limits
   * This implements the "newest first" visibility ranking system
   */
  async updateFeedbackVisibility(userId: string): Promise<void> {
    try {
      console.log(`Updating feedback visibility for user ${userId}`);

      // Get user's subscription to determine limits
      const usage = await subscriptionService.getCurrentUsage(userId);
      const feedbackLimit = usage.feedback.limit;

      // Get all user's projects
      const projects = await prisma.project.findMany({
        where: { userId },
        select: { id: true },
      });

      const projectIds = projects.map(p => p.id);

      if (projectIds.length === 0) {
        console.log(`No projects found for user ${userId}`);
        return;
      }

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
          projectId: true,
        },
      });

      console.log(`Found ${allFeedback.length} total feedback items for user ${userId}`);

      // Determine which feedback should be visible (newest first up to limit)
      const visibleCount = Math.min(feedbackLimit, allFeedback.length);
      const visibleFeedbackIds = allFeedback.slice(0, visibleCount).map(f => f.id);
      const hiddenFeedbackIds = allFeedback.slice(visibleCount).map(f => f.id);

      console.log(
        `Making ${visibleCount} feedback items visible, hiding ${hiddenFeedbackIds.length}`
      );

      // Update visibility for visible feedback (with ranking)
      if (visibleFeedbackIds.length > 0) {
        // First, mark all as visible
        await prisma.feedback.updateMany({
          where: {
            id: { in: visibleFeedbackIds },
          },
          data: {
            isVisible: true,
          },
        });

        // Then set visibility rank for each item (newest = rank 1)
        for (let i = 0; i < visibleFeedbackIds.length; i++) {
          await prisma.feedback.update({
            where: { id: visibleFeedbackIds[i] },
            data: { visibilityRank: i + 1 },
          });
        }
      }

      // Update visibility for hidden feedback
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

      console.log(`Feedback visibility updated successfully for user ${userId}`);
    } catch (error) {
      console.error(`Error updating feedback visibility for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Handle feedback creation and update visibility if needed
   */
  async handleFeedbackCreation(userId: string, feedbackId: string): Promise<void> {
    try {
      // Get current usage to check if we're over the limit
      const usage = await subscriptionService.getCurrentUsage(userId);

      if (usage.feedback.used > usage.feedback.limit) {
        console.log(
          `User ${userId} is over limit (${usage.feedback.used}/${usage.feedback.limit}), updating visibility`
        );
        await this.updateFeedbackVisibility(userId);
      } else {
        // If under limit, just ensure the new feedback is visible with proper ranking
        await this.ensureNewFeedbackVisible(userId, feedbackId);
      }
    } catch (error) {
      console.error(`Error handling feedback creation for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Ensure a newly created feedback item is visible and properly ranked
   */
  private async ensureNewFeedbackVisible(userId: string, feedbackId: string): Promise<void> {
    try {
      // Get the feedback item
      const feedback = await prisma.feedback.findUnique({
        where: { id: feedbackId },
        include: { project: true },
      });

      if (!feedback || feedback.project.userId !== userId) {
        throw new Error('Feedback not found or access denied');
      }

      // Since this is a new feedback item and we're under the limit,
      // it should be visible with rank 1 (newest)
      await prisma.feedback.update({
        where: { id: feedbackId },
        data: {
          isVisible: true,
          visibilityRank: 1,
        },
      });

      // Update ranks for other visible feedback (shift them down)
      await prisma.$executeRaw`
        UPDATE "feedback" 
        SET "visibilityRank" = "visibilityRank" + 1
        WHERE "projectId" IN (
          SELECT "id" FROM "project" WHERE "userId" = ${userId}
        )
        AND "isVisible" = true
        AND "id" != ${feedbackId}
        AND "visibilityRank" IS NOT NULL
      `;

      console.log(`New feedback ${feedbackId} set as visible with rank 1`);
    } catch (error) {
      console.error(`Error ensuring new feedback visibility:`, error);
      throw error;
    }
  }

  /**
   * Get visible feedback for a project with proper ordering
   */
  async getVisibleFeedback(
    userId: string,
    projectId: string,
    options: {
      skip?: number;
      take?: number;
      includeHidden?: boolean; // For admin/debugging purposes
    } = {}
  ) {
    const { skip = 0, take = 50, includeHidden = false } = options;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const whereClause: {
      projectId: string;
      isVisible?: boolean;
    } = {
      projectId,
    };

    if (!includeHidden) {
      whereClause.isVisible = true;
    }

    return prisma.feedback.findMany({
      where: whereClause,
      orderBy: [
        { visibilityRank: 'asc' }, // Primary sort by visibility rank (1 = newest visible)
        { createdAt: 'desc' }, // Secondary sort by creation date
      ],
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
   * Get feedback visibility statistics for a user
   */
  async getVisibilityStats(userId: string): Promise<{
    totalFeedback: number;
    visibleFeedback: number;
    hiddenFeedback: number;
    feedbackLimit: number;
    isOverLimit: boolean;
  }> {
    try {
      // Get user's projects
      const projects = await prisma.project.findMany({
        where: { userId },
        select: { id: true },
      });

      const projectIds = projects.map(p => p.id);

      if (projectIds.length === 0) {
        return {
          totalFeedback: 0,
          visibleFeedback: 0,
          hiddenFeedback: 0,
          feedbackLimit: 0,
          isOverLimit: false,
        };
      }

      // Get feedback counts
      const [totalCount, visibleCount] = await Promise.all([
        prisma.feedback.count({
          where: { projectId: { in: projectIds } },
        }),
        prisma.feedback.count({
          where: {
            projectId: { in: projectIds },
            isVisible: true,
          },
        }),
      ]);

      // Get user's subscription limits
      const usage = await subscriptionService.getCurrentUsage(userId);

      return {
        totalFeedback: totalCount,
        visibleFeedback: visibleCount,
        hiddenFeedback: totalCount - visibleCount,
        feedbackLimit: usage.feedback.limit,
        isOverLimit: usage.isOverLimit,
      };
    } catch (error) {
      console.error(`Error getting visibility stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Recalculate visibility for all users (maintenance function)
   */
  async recalculateAllVisibility(): Promise<void> {
    try {
      console.log('Starting visibility recalculation for all users...');

      // Get all users with subscriptions
      const subscriptions = await prisma.subscription.findMany({
        select: { userId: true },
      });

      let processedCount = 0;
      let errorCount = 0;

      for (const subscription of subscriptions) {
        try {
          await this.updateFeedbackVisibility(subscription.userId);
          processedCount++;
        } catch (error) {
          console.error(`Failed to update visibility for user ${subscription.userId}:`, error);
          errorCount++;
        }
      }

      console.log(
        `Visibility recalculation completed: ${processedCount} successful, ${errorCount} errors`
      );
    } catch (error) {
      console.error('Error in batch visibility recalculation:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const feedbackVisibilityService = new FeedbackVisibilityService();
