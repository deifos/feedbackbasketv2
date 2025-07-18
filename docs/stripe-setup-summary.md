# Stripe Products and Prices Setup Summary

## Products Created

### 1. Starter Plan

- **Product ID**: `prod_ShjxS9By6XeY7N`
- **Name**: Starter Plan
- **Description**: Perfect for growing projects with 3 projects and 500 feedback items per month

### 2. Pro Plan

- **Product ID**: `prod_ShjxolpLaePSpe`
- **Name**: Pro Plan
- **Description**: For teams and businesses with 10 projects and 2000 feedback items per month

## Prices Created

### Starter Plan Prices

- **Monthly**: `price_1RmKdEQHtbdeU1744AmVxX3e` - $19/month
- **Annual**: `price_1RmKdNQHtbdeU174xDDv5UXJ` - $204/year ($17/month, 10% discount)

### Pro Plan Prices

- **Monthly**: `price_1RmKdwQHtbdeU174FWR07aeA` - $39/month
- **Annual**: `price_1RmKe9QHtbdeU174AeebmGHP` - $420/year ($35/month, 10% discount)

## Configuration Files Updated

1. **lib/config/plans.ts** - Contains plan configurations with Stripe price IDs
2. **lib/config/stripe-webhooks.ts** - Webhook configuration and event types
3. **.env.example** - Added required Stripe environment variables

## Webhook Events Configured

The following webhook events should be configured in Stripe Dashboard:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `invoice.created`
- `invoice.finalized`
- `customer.created`
- `customer.updated`
- `customer.deleted`
- `checkout.session.completed`
- `checkout.session.expired`

## Next Steps

1. Set up actual Stripe environment variables in `.env`
2. Create webhook endpoint in Stripe Dashboard pointing to `/api/webhooks/stripe`
3. Implement the webhook handler API route
4. Create subscription service to use these products and prices

## Free Plan Note

The FREE plan is intentionally NOT created in Stripe as it requires no payment processing. It's handled entirely in application logic with:

- 1 project limit
- 100 feedback items per month
- No Stripe customer or subscription required
