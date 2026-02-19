import { NextResponse } from 'next/server';
import { stripe, getPlanByPriceId } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const runtime = 'nodejs';

export async function POST(request) {
  let event;

  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionChange(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSubscriptionChange(subscription) {
  const customerId = subscription.customer;
  const priceId = subscription.items.data[0]?.price?.id;
  const planInfo = getPlanByPriceId(priceId);

  const updateData = {
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan: planInfo.plan,
    max_sku: planInfo.max_sku,
    subscription_status: subscription.status,
  };

  const { error } = await supabaseAdmin
    .from('stores')
    .update(updateData)
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Failed to update store subscription:', error);
    throw error;
  }

  console.log(`Subscription updated: customer=${customerId}, plan=${planInfo.plan}, status=${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  const { error } = await supabaseAdmin
    .from('stores')
    .update({
      stripe_subscription_id: null,
      stripe_price_id: null,
      plan: 'free',
      max_sku: 10,
      subscription_status: 'canceled',
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Failed to handle subscription deletion:', error);
    throw error;
  }

  console.log(`Subscription canceled: customer=${customerId}, reverted to free plan`);
}

async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;

  const { error } = await supabaseAdmin
    .from('stores')
    .update({ subscription_status: 'past_due' })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Failed to update payment status:', error);
    throw error;
  }

  console.log(`Payment failed: customer=${customerId}, status set to past_due`);
}
