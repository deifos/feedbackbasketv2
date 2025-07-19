import prisma from '../prisma';

export interface WebhookEvent {
  id: string;
  eventType: string;
  stripeEventId: string;
  processed: boolean;
  processedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
}

export class WebhookService {
  /**
   * Check if webhook event has already been processed (deduplication)
   */
  async isEventProcessed(stripeEventId: string): Promise<boolean> {
    try {
      const existingEvent = await prisma.webhookEvent.findUnique({
        where: { stripeEventId },
      });

      return existingEvent?.processed || false;
    } catch (error) {
      console.error('Error checking webhook event status:', error);
      return false;
    }
  }

  /**
   * Log webhook event for tracking and deduplication
   */
  async logWebhookEvent(
    stripeEventId: string,
    eventType: string,
    processed: boolean = false,
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.webhookEvent.upsert({
        where: { stripeEventId },
        create: {
          stripeEventId,
          eventType,
          processed,
          errorMessage,
          retryCount: processed ? 0 : 1,
        },
        update: {
          processed,
          processedAt: processed ? new Date() : undefined,
          errorMessage,
          retryCount: {
            increment: processed ? 0 : 1,
          },
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error logging webhook event:', error);
      // Don't throw here to avoid breaking webhook processing
    }
  }

  /**
   * Mark webhook event as successfully processed
   */
  async markEventProcessed(stripeEventId: string): Promise<void> {
    try {
      await prisma.webhookEvent.update({
        where: { stripeEventId },
        data: {
          processed: true,
          processedAt: new Date(),
          errorMessage: null,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error marking webhook event as processed:', error);
    }
  }

  /**
   * Get webhook events for debugging
   */
  async getWebhookEvents(
    options: {
      limit?: number;
      eventType?: string;
      processed?: boolean;
      hasErrors?: boolean;
    } = {}
  ): Promise<WebhookEvent[]> {
    try {
      const { limit = 50, eventType, processed, hasErrors } = options;

      const whereClause: Record<string, unknown> = {};
      if (eventType) whereClause.eventType = eventType;
      if (processed !== undefined) whereClause.processed = processed;
      if (hasErrors) whereClause.errorMessage = { not: null };

      const events = await prisma.webhookEvent.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return events.map(event => ({
        id: event.id,
        eventType: event.eventType,
        stripeEventId: event.stripeEventId,
        processed: event.processed,
        processedAt: event.processedAt || undefined,
        errorMessage: event.errorMessage || undefined,
        retryCount: event.retryCount,
        createdAt: event.createdAt,
      }));
    } catch (error) {
      console.error('Error getting webhook events:', error);
      return [];
    }
  }

  /**
   * Clean up old webhook events (for maintenance)
   */
  async cleanupOldEvents(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.webhookEvent.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          processed: true,
        },
      });

      console.log(`Cleaned up ${result.count} old webhook events`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up webhook events:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const webhookService = new WebhookService();
