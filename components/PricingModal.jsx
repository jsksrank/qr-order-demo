'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

const PLANS = [
  {
    id: 'light',
    name: 'ライト',
    price: '¥1,980',
    sku: '50 SKU',
    features: ['商品50点まで管理', 'QRスキャン無制限', 'LINE送信', 'クーポン利用可'],
  },
  {
    id: 'standard',
    name: 'スタンダード',
    price: '¥3,980',
    sku: '200 SKU',
    popular: true,
    features: ['商品200点まで管理', 'QRスキャン無制限', 'LINE送信', 'クーポン利用可'],
  },
  {
    id: 'pro',
    name: 'プロ',
    price: '¥5,980',
    sku: '無制限',
    features: ['商品数無制限', 'QRスキャン無制限', 'LINE送信', 'クーポン利用可'],
  },
];

const PRICE_IDS = {
  light: process.env.NEXT_PUBLIC_STRIPE_PRICE_LIGHT,
  standard: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD,
  pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
};

const C = {
  primary: '#2563eb',
  primaryLight: '#eff6ff',
  text: '#1a1a2e',
  textSub: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  card: '#fff',
  success: '#059669',
};

export default function PricingModal({ isOpen, onClose, currentPlan, accessToken }) {
  const [loading, setLoading] = useState(null);

  if (!isOpen) return null;

  const handleSubscribe = async (planId) => {
    const priceId = PRICE_IDS[planId];
    if (!priceId) {
      alert('料金設定が見つかりません。管理者に連絡してください。');
      return;
    }

    setLoading(planId);

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
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
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
            プランを選択
          </h2>
          <p style={{ fontSize: 12, color: C.textSub, margin: 0 }}>
            {isPaid
              ? `現在のプラン：${PLANS.find(p => p.id === currentPlan)?.name || currentPlan}`
              : '無料プランをご利用中です（10 SKUまで）'
            }
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;

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
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{plan.price}</div>
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
                    onClick={() => handleSubscribe(plan.id)}
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
