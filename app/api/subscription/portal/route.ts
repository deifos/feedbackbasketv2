import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripeService } from '@/lib/services/stripe-service';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function POST(_request: NextRequest) {
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

    // Get user's subscription to find Stripe customer ID
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

    try {
      const portalSession = await stripeService.createPortalSession(
        subscription.stripeCustomerId,
        returnUrl
      );

      return NextResponse.json({
        portalUrl: portalSession.url,
      });
    } catch (error) {
      console.error('Error creating portal session:', error);
      return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in portal endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
