import { NextResponse } from 'next/server';
import { stripe, getPlanByPriceId } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const runtime = 'nodejs';

/* ━━━ プラン別タグ配布枚数マップ ━━━ */
const TAG_QUOTA = {
  free: 36,
  entry: 36,
  light: 120,
  standard: 360,
  pro: 600,
};

/* ━━━ プラン表示名 ━━━ */
const PLAN_LABEL = {
  free: '無料',
  entry: 'エントリー（¥500）',
  light: 'ライト（¥2,980）',
  standard: 'スタンダード（¥5,980）',
  pro: 'プロ（¥9,800）',
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LINE 管理者通知
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
async function sendLineAdminNotification(message) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const userId = process.env.LINE_ADMIN_USER_ID;

  if (!token || !userId) {
    console.log('LINE admin notification skipped: missing LINE_CHANNEL_ACCESS_TOKEN or LINE_ADMIN_USER_ID');
    return;
  }

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: 'text', text: message }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('LINE admin notification failed:', res.status, errText);
    } else {
      console.log('LINE admin notification sent successfully');
    }
  } catch (err) {
    console.error('LINE admin notification error:', err);
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Webhook エントリーポイント
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
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
        await handleSubscriptionChange(subscription, event.type);
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

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   サブスクリプション変更ハンドラ
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
async function handleSubscriptionChange(subscription, eventType) {
  const customerId = subscription.customer;
  const priceId = subscription.items.data[0]?.price?.id;
  const planInfo = getPlanByPriceId(priceId);

  // ★ プラン変更検知のため、DB更新前に旧プラン情報を取得
  const { data: oldStoreData, error: oldStoreError } = await supabaseAdmin
    .from('stores')
    .select('id, plan, max_sku, store_name, email, referred_by, address_prefecture, address_city, address_line, phone')
    .eq('stripe_customer_id', customerId)
    .single();

  const oldPlan = oldStoreData?.plan || 'free';

  // DB更新
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

  // ★ プラン変更LINE通知
  try {
    const newPlan = planInfo.plan;
    const isNewSubscription = eventType === 'customer.subscription.created';
    const isPlanChanged = oldPlan !== newPlan;

    if (isNewSubscription || isPlanChanged) {
      const storeName = oldStoreData?.store_name || '（店舗名未設定）';
      const email = oldStoreData?.email || '（メール不明）';

      // 追加タグ枚数を計算
      const oldTagQuota = TAG_QUOTA[oldPlan] || 0;
      const newTagQuota = TAG_QUOTA[newPlan] || 0;
      const additionalTags = Math.max(0, newTagQuota - oldTagQuota);

      // 配送先住所
      const address = [
        oldStoreData?.address_prefecture,
        oldStoreData?.address_city,
        oldStoreData?.address_line,
      ].filter(Boolean).join('') || '（住所未登録）';
      const phone = oldStoreData?.phone || '（電話未登録）';

      let message;
      if (isNewSubscription) {
        // 新規課金開始
        message = [
          '🎉 新規課金開始！',
          '',
          `店舗: ${storeName}`,
          `メール: ${email}`,
          `プラン: ${PLAN_LABEL[newPlan] || newPlan}`,
          `タグ配布: ${newTagQuota}枚`,
          '',
          `📮 配送先:`,
          `${address}`,
          `TEL: ${phone}`,
          '',
          `→ タグ${newTagQuota}枚を準備・郵送してください`,
        ].join('\n');
      } else if (isPlanChanged) {
        // プラン変更
        const isUpgrade = (planInfo.max_sku || 0) > (oldStoreData?.max_sku || 0);

        if (isUpgrade) {
          message = [
            '⬆️ プランアップグレード！',
            '',
            `店舗: ${storeName}`,
            `メール: ${email}`,
            `変更: ${PLAN_LABEL[oldPlan] || oldPlan} → ${PLAN_LABEL[newPlan] || newPlan}`,
            `追加タグ: ${additionalTags}枚`,
            '',
            `📮 配送先:`,
            `${address}`,
            `TEL: ${phone}`,
            '',
            additionalTags > 0
              ? `→ 追加タグ${additionalTags}枚を準備・郵送してください`
              : `→ タグ追加不要`,
          ].join('\n');
        } else {
          // ダウングレード
          message = [
            '⬇️ プランダウングレード',
            '',
            `店舗: ${storeName}`,
            `メール: ${email}`,
            `変更: ${PLAN_LABEL[oldPlan] || oldPlan} → ${PLAN_LABEL[newPlan] || newPlan}`,
            `新SKU上限: ${planInfo.max_sku}`,
            '',
            '→ タグ郵送不要。SKUゲートで機能制限されます。',
          ].join('\n');
        }
      }

      if (message) {
        await sendLineAdminNotification(message);
      }
    }
  } catch (notifyErr) {
    // 通知失敗はログのみ（サブスクリプション処理は成功させる）
    console.error('Plan change notification error (non-fatal):', notifyErr);
  }

  // ★ タグ自動生成＋紹介者割引（既存ロジック）
  try {
    const storeId = oldStoreData?.id;
    const referredBy = oldStoreData?.referred_by;

    if (!storeId) {
      console.error('Store lookup for tag generation failed:', oldStoreError);
    } else {
      // --- タグ自動生成 ---
      const { count: existingTagCount, error: countError } = await supabaseAdmin
        .from('qr_tags')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId);

      if (countError) {
        console.error('Tag count query failed:', countError);
      } else {
        const newMaxSku = planInfo.max_sku;
        const currentCount = existingTagCount || 0;

        if (newMaxSku > currentCount) {
          const newTags = [];
          for (let i = currentCount + 1; i <= newMaxSku; i++) {
            newTags.push({
              store_id: storeId,
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
            console.log(`Tags auto-generated: ${currentCount + 1}~${newMaxSku} for store=${storeId}`);
          }
        }
      }

      // ★ 紹介者への割引適用
      if (referredBy && subscription.status === 'active') {
        try {
          await applyReferrerDiscount(referredBy);
        } catch (refErr) {
          console.error('Referrer discount error (non-fatal):', refErr);
        }
      }
    }
  } catch (tagErr) {
    console.error('Tag generation / referral error (non-fatal):', tagErr);
  }

  console.log(`Subscription updated: customer=${customerId}, plan=${planInfo.plan}, status=${subscription.status}`);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   紹介者割引（既存ロジック・変更なし）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
async function applyReferrerDiscount(referrerStoreId) {
  const { data: referrer, error: refError } = await supabaseAdmin
    .from('stores')
    .select('id, referral_count, stripe_subscription_id, stripe_customer_id')
    .eq('id', referrerStoreId)
    .single();

  if (refError || !referrer) {
    console.log('Referrer store not found:', referrerStoreId);
    return;
  }

  if (!referrer.stripe_subscription_id) {
    console.log(`Referrer ${referrerStoreId} has no active subscription, skipping discount`);
    return;
  }

  const discountAmount = (referrer.referral_count || 0) * 500;
  if (discountAmount <= 0) {
    console.log(`Referrer ${referrerStoreId} has 0 referrals, skipping`);
    return;
  }

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

  await stripe.subscriptions.update(referrer.stripe_subscription_id, {
    coupon: coupon.id,
  });

  console.log(`Referrer discount applied: store=${referrerStoreId}, amount=¥${discountAmount}, sub=${referrer.stripe_subscription_id}`);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   解約ハンドラ ★LINE通知追加
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  // 解約前の情報を取得（通知用）
  const { data: storeData } = await supabaseAdmin
    .from('stores')
    .select('store_name, email, plan')
    .eq('stripe_customer_id', customerId)
    .single();

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

  // LINE通知
  try {
    const storeName = storeData?.store_name || '（不明）';
    const email = storeData?.email || '（不明）';
    const oldPlan = storeData?.plan || '（不明）';

    await sendLineAdminNotification([
      '🚨 解約されました',
      '',
      `店舗: ${storeName}`,
      `メール: ${email}`,
      `旧プラン: ${PLAN_LABEL[oldPlan] || oldPlan}`,
      '',
      '→ 無料プランに戻りました',
    ].join('\n'));
  } catch (notifyErr) {
    console.error('Cancellation notification error (non-fatal):', notifyErr);
  }

  console.log(`Subscription canceled: customer=${customerId}, reverted to free plan`);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   支払い失敗ハンドラ ★LINE通知追加
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;

  // 店舗情報取得（通知用）
  const { data: storeData } = await supabaseAdmin
    .from('stores')
    .select('store_name, email, plan')
    .eq('stripe_customer_id', customerId)
    .single();

  const { error } = await supabaseAdmin
    .from('stores')
    .update({ subscription_status: 'past_due' })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Failed to update payment status:', error);
    throw error;
  }

  // LINE通知
  try {
    const storeName = storeData?.store_name || '（不明）';
    const email = storeData?.email || '（不明）';

    await sendLineAdminNotification([
      '⚠️ 支払い失敗',
      '',
      `店舗: ${storeName}`,
      `メール: ${email}`,
      `プラン: ${PLAN_LABEL[storeData?.plan] || storeData?.plan || '不明'}`,
      '',
      '→ Stripeダッシュボードで確認してください',
    ].join('\n'));
  } catch (notifyErr) {
    console.error('Payment failure notification error (non-fatal):', notifyErr);
  }

  console.log(`Payment failed: customer=${customerId}, status set to past_due`);
}
