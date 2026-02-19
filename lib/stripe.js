import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Price ID → プラン情報のマッピング
export const PLAN_MAP = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_LIGHT]: {
    plan: 'light',
    max_sku: 50,
    label: 'ライト',
    price: 1980,
  },
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD]: {
    plan: 'standard',
    max_sku: 200,
    label: 'スタンダード',
    price: 3980,
  },
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO]: {
    plan: 'pro',
    max_sku: 99999,
    label: 'プロ',
    price: 5980,
  },
};

// Price IDからプラン情報を取得（見つからなければfree）
export function getPlanByPriceId(priceId) {
  return PLAN_MAP[priceId] || { plan: 'free', max_sku: 10, label: '無料', price: 0 };
}
