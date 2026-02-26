export const metadata = {
  title: '在庫番 | 美容室・サロンのQR発注点システム',
  description: 'QRタグをスキャンするだけで発注リストを自動生成。「数えない在庫管理」で深夜の棚卸しから解放。先着100名は完全無料。',
  metadataBase: new URL('https://zaiko-ban.com'),
  openGraph: {
    title: '在庫番 | QRスキャンだけで発注完了',
    description: '欠品1回の損失は約1万円。QRタグ×発注点方式で「数えない在庫管理」を実現。月額¥500〜。先着100名は無料。',
    url: 'https://zaiko-ban.com',
    siteName: '在庫番',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '在庫番 | QRスキャンだけで発注完了',
    description: '欠品1回の損失は約1万円。QRタグで「数えない在庫管理」を実現。先着100名は無料。',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800;900&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
