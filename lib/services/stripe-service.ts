import Stripe from 'stripe';
import { subscriptionService } from './subscription-service';
import { billingCycleService } from './billing-cycle-service';
import { paymentService } from './payment-service';
import { PLAN_CONFIGS } from '@/lib/config/plans';
import type { SubscriptionPlan, SubscriptionStatus } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export class StripeService {
  /**
   * Create a Stripe customer for a user
   */
  async createCustomer(user: { id: string; name: string; email: string }): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      });

      return customer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create Stripe customer');
    }
  }

  /**
   * Create a subscription for a customer
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    userId: string
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId,
        },
      });

      return subscription;
    } catch (error) {
      console.error('Error creating Stripe subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Update an existing subscription
   */
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string
  ): Promise<Stripe.Subscription> {
    try {
      // Get the current subscription
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Update the subscription with the new price
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Error updating Stripe subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      console.error('Error canceling Stripe subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Create a Checkout Session for subscription upgrade
   */
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
        },
        subscription_data: {
          metadata: {
            userId,
          },
        },
      });

      return session;
    } catch (error) {
      console.error('Error creating Checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Create a Customer Portal session for subscription management
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      console.error('Error creating portal session:', error);

      // Check if it's the configuration error
      if (error instanceof Error && error.message.includes('No configuration provided')) {
        throw new Error(
          'Customer portal not configured. Please set up your Stripe Customer Portal in the dashboard.'
        );
      }

      throw new Error('Failed to create portal session');
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          console.log('🔄 SUBSCRIPTION UPDATED - Checking for cancellation');
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          console.log('❌ SUBSCRIPTION DELETED - User will be downgraded to FREE');
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          console.log('🔥 INVOICE PAYMENT SUCCEEDED - Processing payment record');
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          console.log('❌ INVOICE PAYMENT FAILED - Processing failed payment');
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'charge.succeeded':
          console.log('💳 CHARGE SUCCEEDED - Processing charge payment');
          await this.handleChargeSucceeded(event.data.object as Stripe.Charge);
          break;

        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`Error handling webhook event ${event.type}:`, error);
      throw error;
    }
  }

  /**
   * Handle subscription created event
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    const plan = this.getPlanFromPriceId(subscription.items.data[0].price.id);
    if (!plan) {
      console.error('Unknown price ID:', subscription.items.data[0].price.id);
      return;
    }

    // Debug the subscription object
    const sub = subscription as any; // Type assertion to access all properties
    console.log('Subscription object debug:', {
      id: subscription.id,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      status: subscription.status,
      created: sub.created,
      keys: Object.keys(subscription),
      fullObject: JSON.stringify(subscription, null, 2),
    });

    // Validate dates before creating Date objects
    let periodStart = sub.current_period_start;
    let periodEnd = sub.current_period_end;

    // If period dates are missing or invalid, use fallback logic
    if (!periodStart || !periodEnd || periodStart === 0 || periodEnd === 0) {
      console.warn('Missing or invalid period dates, using fallback logic');

      // Use created date as base, or current time if that's also missing
      const baseTime = sub.created || Math.floor(Date.now() / 1000);
      periodStart = baseTime;
      periodEnd = baseTime + 30 * 24 * 60 * 60; // 30 days later

      console.log('Using fallback dates:', {
        originalStart: sub.current_period_start,
        originalEnd: sub.current_period_end,
        fallbackStart: periodStart,
        fallbackEnd: periodEnd,
        baseTime,
      });
    }

    await subscriptionService.createSubscription(
      userId,
      plan,
      subscription.customer as string,
      subscription.id,
      subscription.items.data[0].price.id,
      new Date(periodStart * 1000),
      new Date(periodEnd * 1000)
    );
  }

  /**
   * Handle subscription updated event
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    const plan = this.getPlanFromPriceId(subscription.items.data[0].price.id);
    if (!plan) {
      console.error('Unknown price ID:', subscription.items.data[0].price.id);
      return;
    }

    // Validate dates before creating Date objects
    const sub = subscription as any; // Type assertion to access all properties
    let periodStart = sub.current_period_start;
    let periodEnd = sub.current_period_end;

    // If period dates are missing or invalid, use fallback logic
    if (!periodStart || !periodEnd || periodStart === 0 || periodEnd === 0) {
      console.warn('Missing or invalid period dates in update, using fallback logic');

      // Use created date as base, or current time if that's also missing
      const baseTime = sub.created || Math.floor(Date.now() / 1000);
      periodStart = baseTime;
      periodEnd = baseTime + 30 * 24 * 60 * 60; // 30 days later

      console.log('Using fallback dates for update:', {
        originalStart: sub.current_period_start,
        originalEnd: sub.current_period_end,
        fallbackStart: periodStart,
        fallbackEnd: periodEnd,
      });
    }

    const newPeriodStart = new Date(periodStart * 1000);
    const newPeriodEnd = new Date(periodEnd * 1000);

    // Check if subscription is scheduled for cancellation
    const cancelAtPeriodEnd = (subscription as any).cancel_at_period_end;
    const cancelAt = (subscription as any).cancel_at;

    console.log(
      `Updating subscription for user ${userId}: plan=${plan}, status=${subscription.status}, cancel_at_period_end=${cancelAtPeriodEnd}, cancel_at=${cancelAt}`
    );

    // Get current subscription to check for plan changes and billing period transitions
    const currentSubscription = await subscriptionService.getCurrentPlan(userId);
    const oldPlan = currentSubscription || 'FREE';

    // Check if this is a billing period transition (new period started)
    const currentUsage = await subscriptionService.getCurrentUsage(userId);
    const hadPreviousPeriod = currentUsage.billingPeriod.end !== null;
    const isPeriodTransition =
      hadPreviousPeriod &&
      currentUsage.billingPeriod.end &&
      newPeriodStart > currentUsage.billingPeriod.end;

    // Determine the actual status based on cancellation
    let actualStatus = this.mapStripeStatus(subscription.status);
    if (cancelAtPeriodEnd && actualStatus === 'ACTIVE') {
      actualStatus = 'CANCELED'; // Mark as canceled even though still active until period end
      console.log(`🔄 Subscription scheduled for cancellation at period end`);
    }

    // Update the subscription
    await subscriptionService.updateSubscription(userId, {
      plan,
      status: actualStatus,
      stripePriceId: subscription.items.data[0].price.id,
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
    });

    console.log(`Subscription updated successfully for user ${userId}`);

    // Handle billing period transition (new billing cycle started)
    if (isPeriodTransition) {
      console.log(`Billing period transition detected for user ${userId}`);
      await billingCycleService.handleBillingPeriodTransition(userId, newPeriodStart, newPeriodEnd);
    }

    // Handle mid-cycle plan changes
    if (plan !== oldPlan) {
      console.log(`Plan change detected for user ${userId}: ${oldPlan} -> ${plan}`);
      await billingCycleService.handleMidCyclePlanChange(userId, oldPlan, plan, newPeriodStart);
    }
  }

  /**
   * Handle subscription deleted event
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    console.log(`🔥 CANCELLING SUBSCRIPTION for user: ${userId}`);
    console.log('Subscription ID:', subscription.id);

    await subscriptionService.cancelSubscription(userId);

    console.log(`✅ User ${userId} downgraded to FREE plan`);
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log(`🔥 PAYMENT SUCCEEDED HANDLER: ${invoice.id}`);
    console.log('Invoice amount_paid:', (invoice as any).amount_paid);
    console.log('Invoice currency:', invoice.currency);

    try {
      // Get subscription and user information
      let subscriptionId = (invoice as any).subscription as string;
      console.log('Subscription ID from invoice:', subscriptionId);

      // If no direct subscription ID, try to get it from line items
      if (!subscriptionId) {
        console.log('🔍 No direct subscription ID, checking line items...');
        const lines = (invoice as any).lines?.data || [];
        for (const line of lines) {
          if (line.subscription) {
            subscriptionId = line.subscription;
            console.log('✅ Found subscription ID in line item:', subscriptionId);
            break;
          }
        }
      }

      if (!subscriptionId) {
        console.warn('❌ No subscription ID found in invoice or line items');
        console.log('Invoice object keys:', Object.keys(invoice));
        console.log('Invoice lines:', (invoice as any).lines?.data || []);
        return;
      }

      console.log('📋 Retrieving subscription:', subscriptionId);
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata?.userId;
      console.log('User ID from subscription metadata:', userId);

      if (!userId) {
        console.error('No userId found in subscription metadata for payment');
        return;
      }

      const plan = this.getPlanFromPriceId(subscription.items.data[0].price.id);
      if (!plan) {
        console.error('Unknown price ID in payment:', subscription.items.data[0].price.id);
        return;
      }

      // Determine billing cycle from price
      const planConfig = PLAN_CONFIGS[plan];
      const isAnnual = subscription.items.data[0].price.id === planConfig.stripePriceIds.annual;
      const billingCycle = isAnnual ? 'annual' : 'monthly';

      // Update existing payment record or create new one
      console.log('🔍 Checking for existing payment record...');
      const existingPayment = await paymentService.getPaymentByInvoiceId(invoice.id!);
      console.log('Existing payment found:', !!existingPayment);

      if (existingPayment) {
        // Update existing record
        console.log('📝 Updating existing payment record');
        await paymentService.updatePaymentStatus(
          invoice.id!,
          'SUCCEEDED',
          new Date(
            (invoice as any).status_transitions?.paid_at
              ? (invoice as any).status_transitions.paid_at * 1000
              : Date.now()
          )
        );
        console.log('✅ Payment record updated successfully');
      } else {
        // Create new payment record
        console.log('🆕 Creating new payment record for user:', userId);
        console.log('Payment data:', {
          invoiceId: invoice.id,
          amount: (invoice as any).amount_paid || 0,
          currency: invoice.currency,
          plan,
          billingCycle,
        });

        await paymentService.createPaymentRecord(userId, {
          stripeInvoiceId: invoice.id!,
          stripePaymentIntentId: (invoice as any).payment_intent as string,
          stripeSubscriptionId: subscriptionId,
          amount: invoice.amount_paid || 0,
          currency: invoice.currency || 'usd',
          status: 'SUCCEEDED',
          planAtPayment: plan,
          billingCycle,
          paidAt: new Date(
            (invoice as any).status_transitions?.paid_at
              ? (invoice as any).status_transitions.paid_at * 1000
              : Date.now()
          ),
          description: invoice.description || `${plan} plan - ${billingCycle}`,
        });
        console.log('✅ NEW PAYMENT RECORD CREATED SUCCESSFULLY!');
      }
    } catch (error) {
      console.error('Error handling successful payment:', error);
    }
  }

  /**
   * Handle charge succeeded event (alternative to invoice.payment_succeeded)
   */
  private async handleChargeSucceeded(charge: Stripe.Charge): Promise<void> {
    console.log(`🔥 CHARGE SUCCEEDED HANDLER: ${charge.id}`);
    console.log('Charge object keys:', Object.keys(charge));
    console.log('Charge amount:', charge.amount);
    console.log('Charge currency:', charge.currency);

    try {
      // For subscription charges, we need to find the subscription through the customer
      const customerId = charge.customer as string;
      if (!customerId) {
        console.log('❌ No customer ID found in charge');
        return;
      }

      console.log('🔍 Finding subscription for customer:', customerId);

      // Get the most recent active subscription for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        console.log('❌ No active subscription found for customer');
        return;
      }

      const subscription = subscriptions.data[0];
      const userId = subscription.metadata?.userId;

      if (!userId) {
        console.log('❌ No userId found in subscription metadata');
        return;
      }

      console.log('✅ Found subscription and user:', { subscriptionId: subscription.id, userId });

      // Create payment record directly from charge data
      const plan = this.getPlanFromPriceId(subscription.items.data[0].price.id);
      if (!plan) {
        console.log('❌ Unknown price ID:', subscription.items.data[0].price.id);
        return;
      }

      const planConfig = PLAN_CONFIGS[plan];
      const isAnnual = subscription.items.data[0].price.id === planConfig.stripePriceIds.annual;
      const billingCycle = isAnnual ? 'annual' : 'monthly';

      console.log('🆕 Creating payment record from charge data');
      await paymentService.createPaymentRecord(userId, {
        stripeInvoiceId: `charge_${charge.id}`, // Use charge ID as invoice ID since we don't have invoice
        stripePaymentIntentId: (charge as any).payment_intent as string,
        stripeSubscriptionId: subscription.id,
        amount: charge.amount,
        currency: charge.currency,
        status: 'SUCCEEDED',
        planAtPayment: plan,
        billingCycle,
        paidAt: new Date(charge.created * 1000),
        description: charge.description || `${plan} plan - ${billingCycle}`,
      });
      console.log('✅ Payment record created from charge data');
    } catch (error) {
      console.error('❌ Error handling charge succeeded:', error);
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = (invoice as any).subscription as string;
    if (!subscriptionId) {
      console.warn('No subscription ID found in failed payment invoice');
      return;
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata?.userId;

      if (!userId) {
        console.error('No userId found in subscription metadata for failed payment');
        return;
      }

      // Update payment record with failure
      const existingPayment = await paymentService.getPaymentByInvoiceId(invoice.id!);
      const failureReason = (invoice as any).last_finalization_error?.message || 'Payment failed';

      if (existingPayment) {
        await paymentService.updatePaymentStatus(invoice.id!, 'FAILED', undefined, failureReason);
      } else {
        // Create payment record for failed payment
        const plan = this.getPlanFromPriceId(subscription.items.data[0].price.id);
        if (plan) {
          const planConfig = PLAN_CONFIGS[plan];
          const isAnnual = subscription.items.data[0].price.id === planConfig.stripePriceIds.annual;
          const billingCycle = isAnnual ? 'annual' : 'monthly';

          await paymentService.createPaymentRecord(userId, {
            stripeInvoiceId: invoice.id!,
            stripePaymentIntentId: (invoice as any).payment_intent as string,
            stripeSubscriptionId: subscriptionId,
            amount: invoice.amount_due || 0,
            currency: invoice.currency || 'usd',
            status: 'FAILED',
            planAtPayment: plan,
            billingCycle,
            description: invoice.description || `${plan} plan - ${billingCycle}`,
            failureReason,
          });
        }
      }

      // Check if this is an initial payment failure (subscription might not exist in our DB yet)

      // Get the subscription from the database to check stripe subscription ID
      const dbSubscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (dbSubscription && dbSubscription.stripeSubscriptionId === subscriptionId) {
        // Update existing subscription to past due
        await subscriptionService.updateSubscription(userId, {
          status: 'PAST_DUE',
        });
        console.log(`Updated subscription to PAST_DUE for user ${userId}`);
      } else {
        // This might be an initial payment failure - subscription creation failed
        console.log(`Initial payment failed for user ${userId}, subscription not created`);
      }
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  /**
   * Handle completed checkout session
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) {
      console.error('No userId in checkout session metadata');
      return;
    }

    console.log(`Checkout completed for user: ${userId}, session: ${session.id}`);

    // If this is a subscription checkout, the subscription.created/updated event will handle the actual subscription creation
    if (session.mode === 'subscription' && session.subscription) {
      console.log(`Subscription checkout completed: ${session.subscription}`);

      // Fetch the subscription to ensure we have the latest data
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        console.log(
          `Retrieved subscription for checkout: ${subscription.id}, status: ${subscription.status}`
        );

        // Handle the subscription creation/update
        if (subscription.status === 'active') {
          await this.handleSubscriptionUpdated(subscription);
        }
      } catch (error) {
        console.error('Error retrieving subscription after checkout:', error);
      }
    }
  }

  /**
   * Map Stripe subscription status to our internal status
   */
  private mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return 'ACTIVE';
      case 'past_due':
        return 'PAST_DUE';
      case 'canceled':
        return 'CANCELED';
      case 'incomplete':
        return 'INCOMPLETE';
      case 'incomplete_expired':
        return 'INCOMPLETE_EXPIRED';
      case 'trialing':
        return 'TRIALING';
      case 'unpaid':
        return 'UNPAID';
      default:
        return 'ACTIVE';
    }
  }

  /**
   * Get plan from Stripe price ID
   */
  private getPlanFromPriceId(priceId: string): SubscriptionPlan | null {
    for (const [planKey, config] of Object.entries(PLAN_CONFIGS)) {
      if (config.stripePriceIds.monthly === priceId || config.stripePriceIds.annual === priceId) {
        return planKey as SubscriptionPlan;
      }
    }
    return null;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    try {
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();
