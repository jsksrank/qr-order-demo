export const metadata = {
  title: 'QRオーダー - 美容室向け発注管理',
  description: 'QR発注点方式による美容室向け在庫発注管理SaaS',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
