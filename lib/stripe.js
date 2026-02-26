import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Price ID → プラン情報のマッピング（S30更新：4段階プラン＋実Price ID）
export const PLAN_MAP = {
  'price_1T4w0SAhbUNgyEJI4FwYN1k7': {
    plan: 'entry',
    max_sku: 30,
    label: 'エントリー',
    price: 500,
  },
  'price_1T4wT5AhbUNgyEJIijNChOkl': {
    plan: 'light',
    max_sku: 100,
    label: 'ライト',
    price: 2980,
  },
  'price_1T4wHYAhbUNgyEJIDebcXfLJ': {
    plan: 'standard',
    max_sku: 300,
    label: 'スタンダード',
    price: 5980,
  },
  'price_1T4w6MAhbUNgyEJITZzQG7LP': {
    plan: 'pro',
    max_sku: 500,
    label: 'プロ',
    price: 9800,
  },
};

// Price IDからプラン情報を取得（見つからなければfree）
export function getPlanByPriceId(priceId) {
  return PLAN_MAP[priceId] || { plan: 'free', max_sku: 10, label: '無料', price: 0 };
}
