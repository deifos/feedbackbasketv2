export const PLAN_CONFIGS = {
  FREE: {
    name: 'Free',
    projects: 1,
    feedbackPerMonth: 100,
    price: { monthly: 0, annual: 0 },
    stripePriceIds: { monthly: null, annual: null },
  },
  STARTER: {
    name: 'Starter',
    projects: 3,
    feedbackPerMonth: 500,
    price: { monthly: 19, annual: 17 },
    stripePriceIds: {
      monthly: 'price_1RmKdEQHtbdeU1744AmVxX3e', // $19/month
      annual: 'price_1RmKdNQHtbdeU174xDDv5UXJ', // $204/year ($17/month)
    },
  },
  PRO: {
    name: 'Pro',
    projects: 10,
    feedbackPerMonth: 2000,
    price: { monthly: 39, annual: 35 },
    stripePriceIds: {
      monthly: 'price_1RmKdwQHtbdeU174FWR07aeA', // $39/month
      annual: 'price_1RmKe9QHtbdeU174AeebmGHP', // $420/year ($35/month)
    },
  },
} as const;

export type SubscriptionPlan = keyof typeof PLAN_CONFIGS;
