import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/services/stripe-service';

// Disable body parsing for webhook
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let eventType = 'unknown';
  let eventId = 'unknown';

  try {
    // Get the raw body as text
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify the webhook signature and construct the event
    const event = stripeService.verifyWebhookSignature(body, signature);
    eventType = event.type;
    eventId = event.id;

    console.log(`Received Stripe webhook: ${eventType} (${eventId})`);

    // Check if event has already been processed (deduplication)
    // Temporarily disabled due to prisma issues
    // const isAlreadyProcessed = await webhookService.isEventProcessed(eventId);
    // if (isAlreadyProcessed) {
    //   console.log(`Webhook event ${eventType} (${eventId}) already processed, skipping`);
    //   return NextResponse.json({ received: true, eventType, eventId, status: 'already_processed' });
    // }

    // Log the webhook event
    // Temporarily disabled due to prisma issues
    // await webhookService.logWebhookEvent(eventId, eventType, false);

    // Handle the event with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    //let lastError: Error | null = null;

    while (retryCount <= maxRetries) {
      try {
        await stripeService.handleWebhook(event);
        console.log(`Successfully processed webhook: ${eventType} (${eventId})`);

        // Mark as successfully processed
        // Temporarily disabled due to prisma issues
        // await webhookService.markEventProcessed(eventId);
        break;
      } catch (handlerError) {
        retryCount++;
        //lastError = handlerError instanceof Error ? handlerError : new Error('Unknown error');
        console.error(
          `Webhook handler attempt ${retryCount} failed for ${eventType} (${eventId}):`,
          handlerError
        );

        // Log the error
        // Temporarily disabled due to prisma issues
        // await webhookService.logWebhookEvent(eventId, eventType, false, //lastError.message);

        if (retryCount > maxRetries) {
          throw handlerError;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    return NextResponse.json({ received: true, eventType, eventId });
  } catch (error) {
    console.error(`Webhook error for ${eventType} (${eventId}):`, error);

    if (error instanceof Error) {
      if (error.message === 'Invalid webhook signature') {
        return NextResponse.json(
          {
            error: 'Invalid signature',
            eventType,
            eventId,
          },
          { status: 400 }
        );
      }

      if (error.message.includes('Subscription not found')) {
        console.error(`Subscription not found for webhook ${eventType} (${eventId})`);
        return NextResponse.json(
          {
            error: 'Subscription not found',
            eventType,
            eventId,
          },
          { status: 404 }
        );
      }
    }

    // For other errors, return 500 but still acknowledge receipt to prevent retries
    // Log the error for manual investigation
    console.error(`Critical webhook error for ${eventType} (${eventId}):`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: 'Webhook handler failed',
        eventType,
        eventId,
        message: 'Event acknowledged but processing failed - manual review required',
      },
      { status: 500 }
    );
  }
}
