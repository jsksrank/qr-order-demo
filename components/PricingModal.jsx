'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

/* ━━━ プラン定義 ━━━ */
const ALL_PLANS = [
  {
    id: 'entry',
    name: 'エントリー',
    price: 500,
    sku: '30商品',
    priceId: 'price_1T4w0SAhbUNgyEJI4FwYN1k7',
    features: ['商品30点まで管理', 'QRスキャン無制限', 'LINE送信'],
  },
  {
    id: 'light',
    name: 'ライト',
    price: 2980,
    sku: '100商品',
    priceId: 'price_1T4wT5AhbUNgyEJIijNChOkl',
    features: ['商品100点まで管理', 'QRスキャン無制限', 'LINE送信'],
  },
  {
    id: 'standard',
    name: 'スタンダード',
    price: 5980,
    sku: '300商品',
    popular: true,
    priceId: 'price_1T4wHYAhbUNgyEJIDebcXfLJ',
    features: ['商品300点まで管理', 'QRスキャン無制限', 'LINE送信'],
  },
  {
    id: 'pro',
    name: 'プロ',
    price: 9800,
    sku: '500商品',
    priceId: 'price_1T4w6MAhbUNgyEJITZzQG7LP',
    features: ['商品500点まで管理', 'QRスキャン無制限', 'LINE送信'],
  },
];

const VIP_DISCOUNT = 500; // ¥500 OFF

const C = {
  primary: '#2563eb',
  primaryLight: '#eff6ff',
  text: '#1a1a2e',
  textSub: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  card: '#fff',
  success: '#059669',
  danger: '#dc2626',
};

function formatPrice(amount) {
  return `¥${amount.toLocaleString()}`;
}

export default function PricingModal({ isOpen, onClose, currentPlan, accessToken, isFreeAccess = false }) {
  const [loading, setLoading] = useState(null);

  if (!isOpen) return null;

  // ★ S31: フリーアクセスユーザー（先着100名 or 紹介）はEntry不要（既に同等の無料枠あり）
  // → Light以上を表示。割引あり。
  // 通常ユーザー（Entry課金済み）→ Light以上を表示。割引なし。
  const visiblePlans = ALL_PLANS.filter((p) => {
    // Entryは表示しない（フリーアクセスなら不要、Entry課金済みなら現プラン）
    if (p.id === 'entry') return false;
    // 現在のプランより上のプランのみ（同プランは「現在のプラン」表示）
    return true;
  });

  const handleSubscribe = async (plan) => {
    const priceId = plan.priceId;
    if (!priceId) {
      alert('料金設定が見つかりません。管理者に連絡してください。');
      return;
    }

    setLoading(plan.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, accessToken: token }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'エラーが発生しました');
      }
    } catch (err) {
      alert('通信エラーが発生しました');
    } finally {
      setLoading(null);
    }
  };

  const handleManage = async () => {
    setLoading('manage');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'エラーが発生しました');
      }
    } catch (err) {
      alert('通信エラーが発生しました');
    } finally {
      setLoading(null);
    }
  };

  const isPaid = currentPlan && currentPlan !== 'free';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 400, maxHeight: '90vh', overflowY: 'auto',
          background: C.card, borderRadius: 20, padding: '24px 20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🚀</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
            プランをアップグレード
          </h2>
          <p style={{ fontSize: 12, color: C.textSub, margin: '0 0 4px' }}>
            30商品を超えて管理するにはアップグレードが必要です
          </p>
          {/* ★ S31: VIP割引バナー */}
          {isFreeAccess && (
            <div style={{
              marginTop: 10, padding: '8px 14px', background: '#fef3c7',
              borderRadius: 10, border: '1px solid #fde68a',
              fontSize: 12, fontWeight: 600, color: '#92400e',
            }}>
              🎁 VIP特典：全プラン永久 {formatPrice(VIP_DISCOUNT)} OFF 適用中
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visiblePlans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const discountedPrice = isFreeAccess ? plan.price - VIP_DISCOUNT : plan.price;

            return (
              <div
                key={plan.id}
                style={{
                  padding: 16, borderRadius: 14,
                  border: plan.popular
                    ? `2px solid ${C.primary}`
                    : `1px solid ${C.border}`,
                  background: isCurrent ? C.primaryLight : C.card,
                  position: 'relative',
                }}
              >
                {plan.popular && !isCurrent && (
                  <div style={{
                    position: 'absolute', top: -10, right: 16,
                    background: C.primary, color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '2px 10px',
                    borderRadius: 10,
                  }}>
                    人気
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{plan.name}</div>
                    <div style={{ fontSize: 11, color: C.textSub }}>{plan.sku}まで</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {isFreeAccess ? (
                      <>
                        <div style={{ fontSize: 12, color: C.textMuted, textDecoration: 'line-through' }}>
                          {formatPrice(plan.price)}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: C.danger }}>
                          {formatPrice(discountedPrice)}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>
                        {formatPrice(plan.price)}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: C.textSub }}>/月（税込）</div>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ fontSize: 11, color: C.textSub, marginBottom: 2 }}>
                      ✓ {f}
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <div style={{
                    textAlign: 'center', padding: '10px',
                    fontSize: 13, fontWeight: 600, color: C.success,
                  }}>
                    ✅ 現在のプラン
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading !== null}
                    style={{
                      width: '100%', padding: '12px', border: 'none', borderRadius: 10,
                      background: plan.popular ? C.primary : `${C.primary}15`,
                      color: plan.popular ? '#fff' : C.primary,
                      fontSize: 13, fontWeight: 700,
                      cursor: loading ? 'default' : 'pointer',
                      opacity: loading && loading !== plan.id ? 0.5 : 1,
                    }}
                  >
                    {loading === plan.id ? '処理中...' : isPaid ? 'このプランに変更' : 'このプランにする'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 比較メッセージ */}
        <div style={{
          marginTop: 14, padding: '10px 14px', background: '#f8fafc',
          borderRadius: 10, border: '1px solid #e5e7eb',
          fontSize: 11, color: C.textSub, lineHeight: 1.7, textAlign: 'center',
        }}>
          💡 カラー剤1本の欠品＝約¥10,000の機会損失。<br/>
          在庫番で欠品ゼロを実現しましょう。
        </div>

        {isPaid && (
          <button
            onClick={handleManage}
            disabled={loading !== null}
            style={{
              width: '100%', padding: '12px', border: `1px solid ${C.border}`,
              borderRadius: 10, background: C.card, color: C.textSub,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 12,
            }}
          >
            {loading === 'manage' ? '処理中...' : '⚙️ サブスク管理（変更・解約・カード変更）'}
          </button>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '12px', border: 'none',
            borderRadius: 10, background: 'transparent', color: C.textMuted,
            fontSize: 13, cursor: 'pointer', marginTop: 8,
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
