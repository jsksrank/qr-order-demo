import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('stripe_customer_id')
      .eq('owner_auth_id', user.id)
      .single();

    if (storeError || !store || !store.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found. Please subscribe first.' },
        { status: 404 }
      );
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: store.stripe_customer_id,
      return_url: `${origin}/app`,
    });

    return NextResponse.json({ url: portalSession.url });

  } catch (error) {
    console.error('Portal error:', error);
    // ★ S1: 内部エラー詳細をクライアントに返さない
    return NextResponse.json(
      { error: 'ポータルの表示中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
