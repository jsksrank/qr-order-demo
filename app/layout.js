export const metadata = {
  title: '在庫番 | 美容室の発注管理をQRで自動化',
  description: 'QRタグをスキャンするだけで発注リストを自動作成。美容室専用の在庫管理SaaS。',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
