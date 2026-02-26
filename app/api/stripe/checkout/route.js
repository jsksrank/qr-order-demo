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
    // 1. リクエストからパラメータを取得
    // ★ S31: trialDays を追加（101人目以降・紹介なしユーザーのトライアル用）
    const { priceId, accessToken, trialDays } = await request.json();
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

    // 3. storesテーブルから情報を取得 ★ S31: is_early_bird を追加
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, stripe_customer_id, email, store_name, referred_by, is_early_bird')
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
      await supabaseAdmin
        .from('stores')
        .update({ stripe_customer_id: customerId })
        .eq('id', store.id);
    }

    // ★ 5. VIP割引判定（先着100名 OR 紹介経由 → ¥500永久割引）
    // S30決定4: 先着100名期間中の紹介コード → 割引は¥500上限（重複なし）
    const isVip = store.is_early_bird || !!store.referred_by;
    let discounts = [];
    if (isVip) {
      try {
        const coupon = await getOrCreateVipCoupon();
        discounts = [{ coupon: coupon.id }];
        console.log(`VIP discount applied: store=${store.id}, early_bird=${store.is_early_bird}, referred=${!!store.referred_by}`);
      } catch (couponErr) {
        console.error('Failed to apply VIP coupon:', couponErr);
      }
    }

    // 6. Checkout Session作成
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const sessionParams = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${origin}/app?checkout=success`,
      cancel_url: `${origin}/app?checkout=canceled`,
      metadata: {
        store_id: store.id,
        referred_by: store.referred_by || '',
        is_early_bird: store.is_early_bird ? 'true' : 'false',
      },
    };

    // discountsがある場合のみ追加
    if (discounts.length > 0) {
      sessionParams.discounts = discounts;
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    // ★ S31: トライアル期間の設定（101人目以降・紹介なし用）
    if (trialDays && Number(trialDays) > 0) {
      sessionParams.subscription_data = {
        trial_period_days: Number(trialDays),
      };
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
 * VIP割引Couponを取得 or 作成
 * ★ S31: 先着100名と紹介経由の共通Coupon（¥500永久割引）
 * ID固定: zaiko_referral_500off（S29で作成済みのCouponを再利用）
 */
async function getOrCreateVipCoupon() {
  const COUPON_ID = 'zaiko_referral_500off';
  try {
    const existing = await stripe.coupons.retrieve(COUPON_ID);
    return existing;
  } catch (err) {
    if (err.statusCode === 404 || err.code === 'resource_missing') {
      const coupon = await stripe.coupons.create({
        id: COUPON_ID,
        amount_off: 500,
        currency: 'jpy',
        duration: 'forever',
        name: 'VIP特典（先着100名・紹介）: ¥500 OFF',
      });
      console.log('Created VIP coupon:', coupon.id);
      return coupon;
    }
    throw err;
  }
}
