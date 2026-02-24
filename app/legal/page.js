export const metadata = {
  title: '運営者情報 | 在庫番',
  description: '在庫番（zaiko-ban.com）の運営者情報・販売に関する情報',
};

export default function LegalPage() {
  return (
    <div style={{
      maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px",
      fontFamily: "'Noto Sans JP', system-ui, sans-serif",
      color: "#1a1a2e", lineHeight: 1.9, fontSize: 14,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* ヘッダー */}
      <div style={{ marginBottom: 40 }}>
        <a href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          textDecoration: "none", color: "#6b7280", fontSize: 13,
          marginBottom: 16,
        }}>
          ← トップに戻る
        </a>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>
          運営者情報
        </h1>
        <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>最終更新日：2026年2月25日</p>
      </div>

      {/* テーブル */}
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              ["販売事業者", "株式会社コクシ・ムソー"],
              ["所在地", "〒220-0073\n神奈川県横浜市西区岡野1-9-6 岡野町ビル701"],
              ["お問い合わせ", "FORM_LINK"],
              ["販売URL", "https://zaiko-ban.com"],
              ["販売価格", "各プランの月額料金はサービスサイトの料金ページに表示された金額となります\n・無料プラン：¥0\n・ライトプラン：¥1,980/月（税別）\n・スタンダードプラン：¥3,980/月（税別）\n・プロプラン：¥5,980/月（税別）"],
              ["販売価格以外の必要料金", "・インターネット接続に必要な通信費\n・QRタグ追加購入費用（必要な場合のみ）"],
              ["支払方法", "クレジットカード決済（Stripe経由）\n対応ブランド：Visa, Mastercard, American Express, JCB"],
              ["支払時期", "お申し込み時に初回決済が行われ、以後毎月同日に自動決済されます"],
              ["サービス提供時期", "お申し込み完了後、即時ご利用いただけます\nQRタグは登録住所へ別途郵送いたします（通常5営業日以内）"],
              ["返品・キャンセル", "・デジタルサービスの性質上、ご利用開始後の返金はいたしかねます\n・いつでも管理画面またはカスタマーポータルから解約可能です\n・解約後は無料プラン（10 SKU）に自動移行します\n・解約手数料はかかりません"],
              ["動作環境", "・スマートフォン：iOS 15以降（Safari）、Android 10以降（Chrome）\n・PC：最新版Chrome, Safari, Edge\n・インターネット接続が必要です"],
              ["その他", "代表者氏名、電話番号、メールアドレス等の連絡先情報は、\nお問い合わせフォームよりご請求いただければ遅滞なく開示いたします"],
            ].map(([label, value], i) => (
              <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <th style={{
                  padding: "16px 20px", textAlign: "left", verticalAlign: "top",
                  fontSize: 13, fontWeight: 700, color: "#475569",
                  background: "#f8fafc", width: "30%", minWidth: 120,
                  borderRight: "1px solid #e5e7eb",
                }}>
                  {label}
                </th>
                <td style={{
                  padding: "16px 20px", fontSize: 14, color: "#1a1a2e",
                  whiteSpace: "pre-line", lineHeight: 1.8,
                }}>
                  {label === "お問い合わせ" ? (
                    <a
                      href="https://forms.gle/KYf2N99PYUg1c4ke7"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0d9488", fontWeight: 600, textDecoration: "underline" }}
                    >
                      お問い合わせフォームはこちら
                    </a>
                  ) : value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* フッター */}
      <div style={{ marginTop: 40, textAlign: "center" }}>
        <a href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "12px 28px", background: "#0d9488", color: "#fff",
          borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 700,
        }}>
          ← トップページに戻る
        </a>
        <p style={{ marginTop: 20, fontSize: 11, color: "#9ca3af" }}>
          © 2026 株式会社コクシ・ムソー / 在庫番（zaiko-ban.com）
        </p>
      </div>
    </div>
  );
}
