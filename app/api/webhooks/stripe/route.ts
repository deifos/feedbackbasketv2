import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/services/stripe-service';

// Disable body parsing for webhook
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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

    console.log(`Received Stripe webhook: ${event.type}`);

    // Handle the event
    await stripeService.handleWebhook(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);

    if (error instanceof Error && error.message === 'Invalid webhook signature') {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
