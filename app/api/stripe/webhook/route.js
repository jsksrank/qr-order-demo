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

  // ★ Step 7: プランアップグレード時にタグの差分を自動追加
  try {
    const { data: storeData, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, referred_by')
      .eq('stripe_customer_id', customerId)
      .single();

    if (storeError || !storeData) {
      console.error('Store lookup for tag generation failed:', storeError);
    } else {
      // --- タグ自動生成 ---
      const { count: existingTagCount, error: countError } = await supabaseAdmin
        .from('qr_tags')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeData.id);

      if (countError) {
        console.error('Tag count query failed:', countError);
      } else {
        const newMaxSku = planInfo.max_sku;
        const currentCount = existingTagCount || 0;

        if (newMaxSku > currentCount) {
          const newTags = [];
          for (let i = currentCount + 1; i <= newMaxSku; i++) {
            newTags.push({
              store_id: storeData.id,
              tag_code: `QRO-${String(i).padStart(3, '0')}`,
              status: 'unassigned',
              product_id: null,
            });
          }

          const { error: insertError } = await supabaseAdmin
            .from('qr_tags')
            .upsert(newTags, { onConflict: 'store_id,tag_code', ignoreDuplicates: true });

          if (insertError) {
            console.error('Tag auto-generation failed:', insertError);
          } else {
            console.log(`Tags auto-generated: ${currentCount + 1}~${newMaxSku} for store=${storeData.id}`);
          }
        }
      }

      // ★ Step B: 紹介者への割引適用
      // この店舗が紹介経由で登録された場合、紹介者のSubscriptionに割引を追加/更新
      if (storeData.referred_by && subscription.status === 'active') {
        try {
          await applyReferrerDiscount(storeData.referred_by);
        } catch (refErr) {
          // 紹介者割引の失敗はログのみ（サブスクリプション処理自体は成功）
          console.error('Referrer discount error (non-fatal):', refErr);
        }
      }
    }
  } catch (tagErr) {
    console.error('Tag generation / referral error (non-fatal):', tagErr);
  }

  console.log(`Subscription updated: customer=${customerId}, plan=${planInfo.plan}, status=${subscription.status}`);
}

/**
 * ★ 紹介者のSubscriptionに累積割引を適用
 * referral_count × ¥500 の永久Couponを作成し、紹介者のSubscriptionに設定
 * （既存の紹介者Couponを上書き）
 */
async function applyReferrerDiscount(referrerStoreId) {
  // 1. 紹介者の情報を取得
  const { data: referrer, error: refError } = await supabaseAdmin
    .from('stores')
    .select('id, referral_count, stripe_subscription_id, stripe_customer_id')
    .eq('id', referrerStoreId)
    .single();

  if (refError || !referrer) {
    console.log('Referrer store not found:', referrerStoreId);
    return;
  }

  // 2. 紹介者が有料プランでなければスキップ
  //    （無料ユーザーが将来課金した時にはCheckoutのallow_promotion_codesか手動対応）
  if (!referrer.stripe_subscription_id) {
    console.log(`Referrer ${referrerStoreId} has no active subscription, skipping discount`);
    return;
  }

  const discountAmount = (referrer.referral_count || 0) * 500;
  if (discountAmount <= 0) {
    console.log(`Referrer ${referrerStoreId} has 0 referrals, skipping`);
    return;
  }

  // 3. 紹介者用Couponを作成（金額ごとにユニークID）
  const couponId = `zaiko_referrer_${discountAmount}jpy`;
  let coupon;
  try {
    coupon = await stripe.coupons.retrieve(couponId);
  } catch (err) {
    if (err.statusCode === 404 || err.code === 'resource_missing') {
      coupon = await stripe.coupons.create({
        id: couponId,
        amount_off: discountAmount,
        currency: 'jpy',
        duration: 'forever',
        name: `紹介プログラム（紹介者）: ¥${discountAmount} OFF`,
      });
      console.log(`Created referrer coupon: ${couponId}`);
    } else {
      throw err;
    }
  }

  // 4. Subscriptionに適用（既存のCouponを上書き）
  await stripe.subscriptions.update(referrer.stripe_subscription_id, {
    coupon: coupon.id,
  });

  console.log(`Referrer discount applied: store=${referrerStoreId}, amount=¥${discountAmount}, sub=${referrer.stripe_subscription_id}`);
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
