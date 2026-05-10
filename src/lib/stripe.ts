import Stripe from 'stripe'

export const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { apiVersion: '2026-04-22.dahlia' })
}

export const PLANS = {
  starter: { price: process.env.STRIPE_STARTER_PRICE_ID || '', amount: 19 },
  builder: { price: process.env.STRIPE_BUILDER_PRICE_ID || '', amount: 49 },
  agency:  { price: process.env.STRIPE_AGENCY_PRICE_ID  || '', amount: 149 },
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
