import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripeService } from '@/lib/services/stripe-service';
import { subscriptionService } from '@/lib/services/subscription-service';
import { PLAN_CONFIGS } from '@/lib/config/plans';
import type { SubscriptionPlan } from '@/app/generated/prisma';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { plan, billingCycle } = body;

    // Validate plan
    if (!plan || !['STARTER', 'PRO'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Validate billing cycle
    if (!billingCycle || !['monthly', 'annual'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    const planConfig = PLAN_CONFIGS[plan as SubscriptionPlan];
    const priceId = planConfig.stripePriceIds[billingCycle as 'monthly' | 'annual'];

    if (!priceId) {
      return NextResponse.json({ error: 'Price not found' }, { status: 400 });
    }

    // Get or create Stripe customer
    let customerId: string;

    try {
      // Check if user already has a Stripe customer ID
      const existingCustomerId = await subscriptionService.getStripeCustomerId(session.user.id);

      if (!existingCustomerId) {
        // Create new Stripe customer
        customerId = await stripeService.createCustomer({
          id: session.user.id,
          name: session.user.name || '',
          email: session.user.email || '',
        });

        // Store the customer ID
        await subscriptionService.updateStripeCustomerId(session.user.id, customerId);
      } else {
        customerId = existingCustomerId;
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }

    // Create checkout session
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=cancelled`;

    try {
      const checkoutSession = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        session.user.id,
        successUrl,
        cancelUrl
      );

      if (!checkoutSession.url) {
        console.error('Checkout session created but no URL returned');
        return NextResponse.json(
          { error: 'Failed to create checkout session URL' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('customer')) {
          return NextResponse.json({ error: 'Customer validation failed' }, { status: 400 });
        }
        if (error.message.includes('price')) {
          return NextResponse.json({ error: 'Invalid price configuration' }, { status: 400 });
        }
      }

      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in upgrade endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
