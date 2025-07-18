// Stripe webhook configuration
export const STRIPE_WEBHOOK_EVENTS = [
  // Subscription lifecycle events
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',

  // Payment events
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'invoice.created',
  'invoice.finalized',

  // Customer events
  'customer.created',
  'customer.updated',
  'customer.deleted',

  // Checkout events
  'checkout.session.completed',
  'checkout.session.expired',
] as const;

export const WEBHOOK_ENDPOINT_URL =
  process.env.NODE_ENV === 'production'
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`
    : 'http://localhost:3000/api/webhooks/stripe';

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
