# QRオーダー - 美容室向け発注管理デモ

美容室向けQR発注点SaaSのインタラクティブモック（v2）。
ヒアリング時にスマホで実際に操作してもらうためのデモアプリ。

## デプロイ手順（Vercel）

### 方法1：GitHubリポジトリ経由（推奨）
1. GitHubに新リポジトリを作成（例：`qr-order-demo`）
2. このフォルダをpush
3. Vercelダッシュボードで「Add New → Project」
4. GitHubリポジトリを選択してデプロイ

```bash
git init
git add .
git commit -m "QRオーダー デモアプリ v2"
git remote add origin https://github.com/jsksrank/qr-order-demo.git
git push -u origin main
```

### 方法2：Vercel CLI
```bash
npm i -g vercel
vercel
```

## 開発

```bash
npm install
npm run dev
```

http://localhost:3000 でアクセス

## 構成

- `app/` - Next.js App Router
- `components/SalonMock.jsx` - メインのモックコンポーネント
- 現在はデモデータのみ。MVP開発時にSupabase接続を追加予定。

## 技術スタック

- Next.js 14（App Router）
- React 18
- Vercel（ホスティング）
- フォント：Noto Sans JP（Google Fonts CDN）
