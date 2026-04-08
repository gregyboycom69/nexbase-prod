import Stripe from 'stripe'

// Lazy initialization to prevent build-time crashes
let stripeInstance: Stripe | null = null

export const getStripe = (): Stripe => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
  }

  return stripeInstance
}

export const PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || '',
  builder: process.env.STRIPE_BUILDER_PRICE_ID || '',
  agency: process.env.STRIPE_AGENCY_PRICE_ID || '',
}

export const PLAN_LIMITS = {
  free: {
    workspace_limit: 1,
    pages_limit: 5,
    rows_limit: 1000,
  },
  trial: {
    workspace_limit: 3,
    pages_limit: 999,
    rows_limit: 5000,
  },
  starter: {
    workspace_limit: 1,
    pages_limit: 5,
    rows_limit: 1000,
  },
  builder: {
    workspace_limit: 10,
    pages_limit: 999,
    rows_limit: 50000,
  },
  agency: {
    workspace_limit: 999,
    pages_limit: 999,
    rows_limit: 9999999,
  },
}

export const PLAN_PRICES = {
  starter: 19,
  builder: 49,
  agency: 149,
}
