import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ★ キャッシュ: 60秒間は同じ値を返す（Supabase負荷軽減）
let cache = { count: null, timestamp: 0 };
const CACHE_TTL = 60 * 1000; // 60秒

export async function GET() {
  try {
    const now = Date.now();

    // キャッシュが有効ならDB問い合わせをスキップ
    if (cache.count !== null && (now - cache.timestamp) < CACHE_TTL) {
      return NextResponse.json({
        remaining: cache.count,
        total: 100,
        closed: cache.count <= 0,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    // storesテーブルの総行数をカウント
    const { count, error } = await supabaseAdmin
      .from('stores')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Store count error:', error);
      return NextResponse.json({ remaining: null, error: 'DB error' }, { status: 500 });
    }

    const remaining = Math.max(0, 100 - (count || 0));

    // キャッシュ更新
    cache = { count: remaining, timestamp: now };

    return NextResponse.json({
      remaining,
      total: 100,
      closed: remaining <= 0,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (err) {
    console.error('Remaining count API error:', err);
    return NextResponse.json({ remaining: null, error: 'Internal error' }, { status: 500 });
  }
}
