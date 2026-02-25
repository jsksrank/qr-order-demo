import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client（service_role_keyでRLSバイパス）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // 1. リクエストからpriceIdとアクセストークンを取得
    const { priceId, accessToken } = await request.json();
    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 });
    }

    // 2. Supabase Authトークンを検証
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. storesテーブルからstripe_customer_idと紹介情報を取得
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, stripe_customer_id, email, store_name, referred_by')
      .eq('owner_auth_id', user.id)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // 4. Stripe Customerがなければ作成
    let customerId = store.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: store.email || user.email,
        metadata: {
          store_id: store.id,
          store_name: store.store_name,
        },
      });
      customerId = customer.id;
      // store に保存
      await supabaseAdmin
        .from('stores')
        .update({ stripe_customer_id: customerId })
        .eq('id', store.id);
    }

    // ★ 5. 紹介された側の場合、¥500永久割引Couponを適用
    let discounts = [];
    if (store.referred_by) {
      try {
        // 「紹介された側」用Couponを取得 or 作成
        const coupon = await getOrCreateReferredCoupon();
        discounts = [{ coupon: coupon.id }];
        console.log(`Referral discount applied: store=${store.id}, coupon=${coupon.id}`);
      } catch (couponErr) {
        // Coupon作成失敗はログのみ（Checkout自体は続行）
        console.error('Failed to apply referral coupon:', couponErr);
      }
    }

    // 6. Checkout Session作成
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const sessionParams = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: discounts.length === 0, // 紹介割引がない場合のみプロモコード入力可
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=canceled`,
      metadata: {
        store_id: store.id,
        referred_by: store.referred_by || '',
      },
    };

    // discountsがある場合のみ追加（空配列はStripeエラーになる）
    if (discounts.length > 0) {
      sessionParams.discounts = discounts;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 「紹介された側」用のCouponを取得 or 作成
 * ID固定: zaiko_referral_500off
 * ¥500/月 永久割引
 */
async function getOrCreateReferredCoupon() {
  const COUPON_ID = 'zaiko_referral_500off';
  try {
    // 既存Couponを取得
    const existing = await stripe.coupons.retrieve(COUPON_ID);
    return existing;
  } catch (err) {
    // 存在しない場合は作成
    if (err.statusCode === 404 || err.code === 'resource_missing') {
      const coupon = await stripe.coupons.create({
        id: COUPON_ID,
        amount_off: 500,
        currency: 'jpy',
        duration: 'forever',
        name: '紹介プログラム（紹介された方）: ¥500 OFF',
      });
      console.log('Created referral coupon:', coupon.id);
      return coupon;
    }
    throw err;
  }
}
