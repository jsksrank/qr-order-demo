import LandingPage from "../components/LandingPage";

export const metadata = {
  title: '在庫番 | 美容室の発注管理をQRで自動化',
  description: 'QRタグをスキャンするだけで発注リストを自動作成。月次棚卸しから解放される、美容室専用の在庫管理SaaS。無料プランあり。',
  keywords: '美容室,在庫管理,発注管理,QRコード,サロン,カラー剤,棚卸し',
  openGraph: {
    title: '在庫番 | 美容室の発注管理をQRで自動化',
    description: 'QRタグをスキャンするだけで発注リストを自動作成。月次棚卸しから解放。',
    url: 'https://zaiko-ban.com',
    type: 'website',
  },
};

export default function Page() {
  return <LandingPage />;
}
