# ECサイトシステム デプロイメントガイド

## 🚀 起動方法

### 前提条件
- Node.js v18以上
- npm v8以上
- Git

### 1. 開発環境セットアップ

```bash
# プロジェクトクローン（既存の場合はスキップ）
cd /Users/mitaka/development/carol_20250919/example1

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.development
```

### 2. データベース初期化

```bash
# データベースマイグレーション実行
npm run db:migrate

# シードデータ投入
npm run db:seed
```

### 3. アプリケーション起動

#### 開発モード（推奨）
```bash
# ホットリロード付き開発サーバー
npm run dev
```

#### 本番モード
```bash
# TypeScriptビルド
npm run build

# 本番サーバー起動
npm start
```

## 🔗 アクセス情報

- **開発サーバー**: http://localhost:3000
- **ヘルスチェック**: http://localhost:3000/health
- **API Base URL**: http://localhost:3000/api

## 📋 主要機能と動作確認

### ✅ 動作確認済み機能

1. **サーバー基盤**
   - Express.js サーバー起動
   - ヘルスチェックエンドポイント
   - エラーハンドリング

2. **データベース**
   - SQLite データベース作成
   - マイグレーション実行
   - シードデータ投入

3. **コード品質**
   - ESLint チェック通過
   - Prettier フォーマット準拠

### ⚠️ 実装中の機能

1. **ユーザー認証**
   - 登録・ログイン機能（バックエンド実装済み）
   - ビューテンプレート未実装

2. **商品管理**
   - 商品一覧・詳細（バックエンド実装済み）
   - フロントエンド統合未完了

3. **カート機能**
   - カート操作（バックエンド実装済み）
   - UI統合未完了

## 🛠️ 開発コマンド一覧

### サーバー操作
```bash
npm run dev          # 開発サーバー起動
npm start           # 本番サーバー起動
npm run build       # TypeScriptビルド
```

### データベース操作
```bash
npm run db:migrate  # マイグレーション実行
npm run db:seed     # シードデータ投入
```

### コード品質
```bash
npm run lint        # ESLintチェック
npm run lint:fix    # ESLint自動修正
npm run format      # Prettierフォーマット
npm run format:check # フォーマットチェック
```

### テスト（設定修正必要）
```bash
npm test           # 全テスト実行（現在エラー）
npm run test:watch # テスト監視モード
npm run test:coverage # カバレッジ測定
```

## 🔧 環境設定

### 環境変数設定

`.env.development` ファイル設定例：
```bash
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_PATH=./database/development.db

# Session
SESSION_SECRET=your-session-secret-key
SESSION_MAX_AGE=86400000

# Security
BCRYPT_ROUNDS=10
```

### TypeScript設定

現在の設定：
- `exactOptionalPropertyTypes: false` （一時的に緩和）
- `strict: true`
- パスエイリアス設定済み（`@/*` → `src/*`）

## 🏗️ アーキテクチャ構成

### ディレクトリ構造
```
src/
├── domain/           # ドメイン層
│   ├── entities/     # エンティティ
│   ├── value-objects/ # 値オブジェクト
│   ├── repositories/ # リポジトリインターフェース
│   └── services/     # ドメインサービス
├── application/      # アプリケーション層
│   ├── usecases/     # ユースケース
│   ├── commands/     # コマンド
│   ├── queries/      # クエリ
│   └── dto/          # データ転送オブジェクト
├── infrastructure/   # インフラストラクチャ層
│   ├── repositories/ # リポジトリ実装
│   └── database/     # データベース設定
└── presentation/     # プレゼンテーション層
    ├── controllers/  # コントローラー
    ├── routes/       # ルーティング
    └── middleware/   # ミドルウェア
```

### 技術スタック
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.3+
- **Web Framework**: Express.js 4.18
- **Template Engine**: EJS 3.1
- **Database**: SQLite 3
- **Authentication**: bcryptjs, express-session
- **Security**: helmet, cors
- **Testing**: Jest 29 (設定修正必要)

## 🐛 トラブルシューティング

### よくある問題と解決方法

#### 1. サーバー起動エラー
```bash
Error: Cannot find module 'bcrypt'
```
**解決**: bcryptjsインポート修正済み（`import * as bcrypt from 'bcryptjs'`）

#### 2. ビューテンプレートエラー
```bash
Failed to lookup view "auth/login"
```
**解決**: 必要なEJSファイル作成が必要

#### 3. TypeScriptビルドエラー
```bash
Constructor of class 'UserId' is private
```
**解決**: Value Objectのfactoryメソッド使用（`UserId.create()`）

### ログ確認
```bash
# 開発サーバーログ
npm run dev

# プロセス確認
ps aux | grep node

# ポート使用確認
lsof -i :3000
```

## 📊 パフォーマンス設定

### 現在の設定
- **メモリ使用量**: RSS=67MB, Heap=16MB
- **データベースサイズ**: 139KB
- **起動時間**: 約2-3秒

### 最適化推奨事項
1. **本番環境**:
   - クラスタモード有効化
   - HTTPS設定
   - リバースプロキシ（nginx等）

2. **データベース**:
   - インデックス最適化済み
   - クエリパフォーマンス監視

## 🔒 セキュリティ設定

### 現在実装済み
- ✅ Helmet.js セキュリティヘッダー
- ✅ CORS設定
- ✅ Session管理
- ✅ bcryptjs パスワードハッシュ化
- ✅ SQL Injection対策（パラメータ化クエリ）

### 本番環境推奨
- HTTPS証明書設定
- 環境変数機密情報管理
- レート制限実装
- CSP（Content Security Policy）設定

## 🎯 次のステップ

### 短期目標（1-2週間）
1. **ビューテンプレート完成**
2. **TypeScript型エラー完全解決**
3. **テストスイート修正**

### 中期目標（1-2ヶ月）
1. **フロントエンド完全統合**
2. **E2Eテスト実装**
3. **CI/CD パイプライン構築**

### 長期目標（3-6ヶ月）
1. **本番環境デプロイ**
2. **パフォーマンス最適化**
3. **機能拡張（決済、レコメンド等）**

---
**作成者**: Claude Code Assistant
**更新日**: 2025年9月18日
**バージョン**: 1.0.0