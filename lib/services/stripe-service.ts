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
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'charge.succeeded':
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

    console.log(
      `Updating subscription for user ${userId}: plan=${plan}, status=${subscription.status}`
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

    // Update the subscription
    await subscriptionService.updateSubscription(userId, {
      plan,
      status: this.mapStripeStatus(subscription.status),
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

    await subscriptionService.cancelSubscription(userId);
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log(`Payment succeeded for invoice: ${invoice.id}`);

    try {
      // Get subscription and user information
      const subscriptionId = (invoice as any).subscription as string;
      if (!subscriptionId) {
        console.warn('No subscription ID found in successful payment invoice');
        return;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata?.userId;

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
      const existingPayment = await paymentService.getPaymentByInvoiceId(invoice.id!);

      if (existingPayment) {
        // Update existing record
        await paymentService.updatePaymentStatus(
          invoice.id!,
          'SUCCEEDED',
          new Date(
            (invoice as any).status_transitions?.paid_at
              ? (invoice as any).status_transitions.paid_at * 1000
              : Date.now()
          )
        );
      } else {
        // Create new payment record
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
      }
    } catch (error) {
      console.error('Error handling successful payment:', error);
    }
  }

  /**
   * Handle charge succeeded event (alternative to invoice.payment_succeeded)
   */
  private async handleChargeSucceeded(charge: Stripe.Charge): Promise<void> {
    console.log(`Charge succeeded: ${charge.id}`);

    try {
      // Get invoice from charge
      const invoiceId = (charge as any).invoice as string;
      if (!invoiceId) {
        console.log('No invoice ID found in charge, skipping payment record creation');
        return;
      }

      // Retrieve the invoice to get subscription details
      const invoice = await stripe.invoices.retrieve(invoiceId);

      // Delegate to the invoice payment succeeded handler
      await this.handlePaymentSucceeded(invoice);
    } catch (error) {
      console.error('Error handling charge succeeded:', error);
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
