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

    // 3. storesテーブルからstripe_customer_idを取得
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, stripe_customer_id, email, store_name')
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

    // 5. Checkout Session作成
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=canceled`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
