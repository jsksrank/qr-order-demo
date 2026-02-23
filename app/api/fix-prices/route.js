// ★ 一時ファイル：tax_behavior修正用（実行後に削除すること！）
// ファイルパス: app/api/fix-prices/route.js
// アクセス方法: ブラウザで https://qr-order-demo-ten.vercel.app/api/fix-prices にアクセス

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET() {
  try {
    // 全アクティブなPriceを取得（QRオーダー商品のもの）
    const prices = await stripe.prices.list({
      active: true,
      limit: 10,
    });

    const results = [];

    for (const price of prices.data) {
      // tax_behaviorがunspecifiedのものだけ更新
      if (!price.tax_behavior || price.tax_behavior === "unspecified") {
        const updated = await stripe.prices.update(price.id, {
          tax_behavior: "exclusive",
        });
        results.push({
          id: updated.id,
          amount: updated.unit_amount,
          currency: updated.currency,
          tax_behavior: updated.tax_behavior,
          status: "✅ updated",
        });
      } else {
        results.push({
          id: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          tax_behavior: price.tax_behavior,
          status: "⏭️ already set",
        });
      }
    }

    return new Response(
      JSON.stringify(
        {
          message: "tax_behavior update complete",
          updated_prices: results,
        },
        null,
        2
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
