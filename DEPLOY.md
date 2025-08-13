# 🚀 デプロイ手順

KPIアラート・ダッシュボードを各種プラットフォームにデプロイする手順です。

## 📋 前提条件

- Node.js 18以上がインストールされていること
- プロジェクトが正常にビルドできること

```bash
npm install
npm run build
```

## 🌐 GitHub Pages

### 1. GitHubリポジトリの作成
1. GitHub.comで新しいリポジトリを作成
2. リポジトリ名: `kpi-alert-dashboard`（推奨）

### 2. コードのアップロード
- GitHub Desktopを使用する場合:
  1. GitHub Desktopでリポジトリをクローン
  2. プロジェクトファイルをコピー
  3. コミットしてプッシュ

- GitHub Webを使用する場合:
  1. リポジトリページで「Add file」→「Upload files」
  2. プロジェクトファイルをアップロード
  3. コミット

### 3. GitHub Pagesの有効化
1. リポジトリの「Settings」タブ
2. 左メニューから「Pages」
3. Source: 「GitHub Actions」を選択
4. 自動的にデプロイが開始されます

### 4. アクセス
- URL: `https://[ユーザー名].github.io/kpi-alert-dashboard/`

## 🌟 Netlify

### 方法1: ドラッグ&ドロップ（簡単）
1. [Netlify](https://netlify.com)にアクセス
2. `dist`フォルダをドラッグ&ドロップ
3. 自動的にデプロイされます

### 方法2: GitHub連携（推奨）
1. Netlifyで「New site from Git」
2. GitHubリポジトリを選択
3. 設定:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. デプロイ

### カスタムドメイン
- Netlifyダッシュボードでカスタムドメインを設定可能

## ⚡ Vercel

### 1. Vercel CLIを使用
```bash
npm i -g vercel
vercel
```

### 2. GitHub連携
1. [Vercel](https://vercel.com)でGitHubリポジトリをインポート
2. 自動的に設定が読み込まれます
3. デプロイ

## 🔥 Firebase Hosting

### 1. Firebase CLIのインストール
```bash
npm install -g firebase-tools
```

### 2. プロジェクトの初期化
```bash
firebase login
firebase init hosting
```

### 3. デプロイ
```bash
firebase deploy
```

## 📱 モバイル対応

すべてのプラットフォームで以下の機能が利用可能：
- レスポンシブデザイン
- タッチ操作対応
- PWA対応（必要に応じて追加設定）

## 🔧 環境変数

本番環境で必要に応じて設定：
```bash
# .env.production
VITE_API_URL=https://your-api.com
VITE_APP_TITLE=KPIアラート・ダッシュボード
```

## 📊 パフォーマンス最適化

- 画像の最適化
- コード分割
- キャッシュ設定
- CDN利用

## 🛠️ トラブルシューティング

### よくある問題

1. **404エラー**
   - SPAルーティングの設定を確認
   - `index.html`へのリダイレクト設定

2. **ビルドエラー**
   - Node.jsバージョンを確認
   - 依存関係を再インストール

3. **アセット読み込みエラー**
   - パスの設定を確認
   - キャッシュをクリア

## 📞 サポート

問題が発生した場合は：
1. ブラウザの開発者ツールでエラーを確認
2. デプロイログを確認
3. 必要に応じてサポートに連絡
