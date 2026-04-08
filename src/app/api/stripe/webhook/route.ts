import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLAN_LIMITS } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan

        if (!userId || !plan) {
          console.error('Missing metadata in checkout session')
          break
        }

        const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free

        await supabase
          .from('user_profiles')
          .update({
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            workspace_limit: limits.workspace_limit,
            pages_limit: limits.pages_limit,
            rows_limit: limits.rows_limit,
            plan_expires_at: null, // Subscription active, no expiration
          })
          .eq('id', userId)

        // Log billing event
        await supabase.from('billing_events').insert({
          user_id: userId,
          event_type: 'subscription_created',
          plan,
          amount: session.amount_total || 0,
          currency: session.currency || 'eur',
          stripe_event_id: event.id,
        })

        console.log(`✅ Subscription created for user ${userId} on ${plan} plan`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by customer ID
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          console.error('User not found for customer:', customerId)
          break
        }

        // Determine plan from price ID
        let newPlan = 'free'
        const priceId = subscription.items.data[0]?.price.id

        if (priceId === process.env.STRIPE_STARTER_PRICE_ID) newPlan = 'starter'
        if (priceId === process.env.STRIPE_BUILDER_PRICE_ID) newPlan = 'builder'
        if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) newPlan = 'agency'

        const limits = PLAN_LIMITS[newPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free

        await supabase
          .from('user_profiles')
          .update({
            plan: newPlan,
            stripe_subscription_id: subscription.id,
            workspace_limit: limits.workspace_limit,
            pages_limit: limits.pages_limit,
            rows_limit: limits.rows_limit,
          })
          .eq('id', profile.id)

        console.log(`✅ Subscription updated for user ${profile.id} to ${newPlan} plan`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          console.error('User not found for customer:', customerId)
          break
        }

        await supabase
          .from('user_profiles')
          .update({
            plan: 'free',
            stripe_subscription_id: null,
            workspace_limit: 1,
            pages_limit: 5,
            rows_limit: 1000,
          })
          .eq('id', profile.id)

        await supabase.from('billing_events').insert({
          user_id: profile.id,
          event_type: 'subscription_deleted',
          plan: 'free',
          stripe_event_id: event.id,
        })

        console.log(`✅ Subscription deleted for user ${profile.id}, downgraded to free`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
