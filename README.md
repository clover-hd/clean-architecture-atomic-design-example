# TypeScript EC Site

> TypeScriptとClean Architectureの原則で構築されたモダンなeコマースプラットフォーム

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-green)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-lightblue)](https://www.sqlite.org/)
[![Jest](https://img.shields.io/badge/Jest-29-red)](https://jestjs.io/)
[![License](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)

## ⚠️ 開発状況についての注意書き

**このプロジェクトは現在開発途中です。** アーキテクチャの参考実装としての価値を提供していますが、完全に動作するeコマースサイトではありません。

### 現在の実装状況

#### ✅ 実装済み（動作確認済み）
- **Domain Layer（ドメイン層）**: エンティティ、バリューオブジェクト、ドメインサービス
- **Application Layer（アプリケーション層）**: ユースケース、コマンド/クエリパターン、DTOs
- **Infrastructure Layer（インフラ層）**: SQLiteリポジトリ、データベース設定
- **Presentation Layer（プレゼンテーション層）**: コントローラー、ルート、ミドルウェア

#### 🔄 開発中・未完成
- **フロントエンドテンプレート**: EJSビューの実装が部分的
- **ユーザーインターフェース**: 一部のページが未実装
- **統合テスト**: E2Eテストが未完成
- **エラーハンドリング**: 一部の例外処理が不完全

#### 📋 今後の予定
- フロントエンドの完全実装
- セキュリティ機能の強化
- パフォーマンス最適化
- デプロイメント環境の整備

### 利用上の注意

- **本番環境での使用は推奨しません**: セキュリティやパフォーマンスの最適化が未完成です
- **アーキテクチャ参考**: Clean Architectureの実装パターンの学習目的での利用を推奨します
- **開発環境**: ローカル開発環境での動作確認のみ行っています

このプロジェクトは主に**Clean Architectureの実装例**として価値を提供し、TypeScriptでの本格的なバックエンド開発の参考資料として活用いただけます。

## 🎯 プロジェクト概要

このTypeScriptベースのeコマースサイトは、4層設計パターンによるClean Architectureの本格的な実装を実証しています。保守性、テスト容易性、拡張性を重視して構築されており、機能的なeコマースプラットフォームとしてだけでなく、エンタープライズグレードのTypeScriptアプリケーションの参考実装としても機能します。

### 主要機能

- **🔐 ユーザー認証** - bcryptを使用したセキュアなセッションベース認証
- **🛍️ 商品カタログ** - 高度な検索、フィルタリング、カテゴリ分類機能
- **🛒 ショッピングカート** - 永続化機能付きリアルタイムカート管理
- **📦 注文処理** - ステータス追跡機能付き完全な注文ワークフロー
- **👨‍💼 管理者パネル** - コンテンツ管理用の管理インターフェース
- **🔒 セキュリティ** - CSRF保護、helmetセキュリティヘッダー、入力検証
- **📱 レスポンシブデザイン** - モダンCSSによるモバイルファーストEJSテンプレート

## 🏗️ アーキテクチャ概要

このプロジェクトは、厳格な依存関係ルールと明確な関心の分離を持つ**Clean Architecture**の原則に従っています：

```
┌─────────────────────────────────────────────────────────────┐
│                    🔵 プレゼンテーション層                    │
│  コントローラー • ルート • ミドルウェア • ビュー • HTTP処理  │
├─────────────────────────────────────────────────────────────┤
│                   🟡 アプリケーション層                      │
│   ユースケース • コマンド/クエリ • DTOs • ビジネスロジック     │
├─────────────────────────────────────────────────────────────┤
│                     🟢 ドメイン層                        │
│    エンティティ • バリューオブジェクト • ドメインサービス • ルール      │
├─────────────────────────────────────────────────────────────┤
│                  🔴 インフラストラクチャ層                    │
│   リポジトリ実装 • データベース • 外部API • I/O        │
└─────────────────────────────────────────────────────────────┘
```

### 依存関係ルール
依存関係は**内側のみを向く**ようになっています。ドメイン層は依存関係を持たず、外側の層はインターフェースを通じて内側の層に依存します。

### 各層の責務

- **🔵 プレゼンテーション層**: HTTP処理、ルーティング、テンプレートレンダリング、ユーザー入力検証
- **🟡 アプリケーション層**: ビジネスワークフロー、ユースケースオーケストレーション、DTOマッピング
- **🟢 ドメイン層**: コアビジネスロジック、エンティティ、バリューオブジェクト、ビジネスルール
- **🔴 インフラストラクチャ層**: データ永続化、外部統合、技術的な関心事

## 🚀 クイックスタート

### 前提条件

- **Node.js** 18.0以上
- **npm** 9.0以上
- **SQLite** 3（sqlite3パッケージに同梱）

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd typescript-ec-site

# 依存関係をインストール
npm install

# 環境設定
cp .env.example .env
# .envファイルを設定に合わせて編集

# データベースを初期化
mkdir -p data
npm run db:migrate
npm run db:seed

# 開発サーバーを起動
npm run dev
```

アプリケーションは `http://localhost:3000` でアクセス可能になります

### 本番環境デプロイメント

```bash
# 本番用ビルド
npm run build

# 本番サーバー起動
npm start
```

## 📁 プロジェクト構造

```
typescript-ec-site/
├── src/
│   ├── domain/                 # 🟢 ドメイン層
│   │   ├── entities/          # ビジネスエンティティ（User, Product, Order）
│   │   ├── value-objects/     # 不変値オブジェクト（Email, Price）
│   │   ├── repositories/      # リポジトリインターフェース
│   │   └── services/          # ドメインサービス
│   ├── application/           # 🟡 アプリケーション層
│   │   ├── usecases/         # ビジネスユースケース
│   │   ├── commands/         # コマンドパターン（CQRS）
│   │   ├── queries/          # クエリパターン（CQRS）
│   │   ├── dto/              # データ転送オブジェクト
│   │   └── services/         # アプリケーションサービス
│   ├── infrastructure/        # 🔴 インフラストラクチャ層
│   │   ├── database/         # データベース設定
│   │   ├── repositories/     # リポジトリ実装
│   │   └── mappers/          # データマッピングユーティリティ
│   ├── presentation/          # 🔵 プレゼンテーション層
│   │   ├── controllers/      # HTTPコントローラー
│   │   ├── routes/           # ルート定義
│   │   ├── middleware/       # カスタムミドルウェア
│   │   └── views/            # EJSテンプレート
│   └── shared/               # 共通ユーティリティ
│       ├── types/            # TypeScript型定義
│       ├── config/           # 設定管理
│       ├── constants/        # アプリケーション定数
│       ├── utils/            # ユーティリティ関数
│       └── errors/           # カスタムエラークラス
├── tests/                     # テストファイル（srcの構造をミラー）
├── views/                     # EJSテンプレート
├── public/                    # 静的アセット（CSS、JS、画像）
├── scripts/                   # データベースとユーティリティスクリプト
├── database/                  # SQLマイグレーションとシード
└── docs/                      # 追加ドキュメント
```

## 🧪 テスト戦略

### テストカバレッジ要件

- **ドメイン層**: 最低90%（ビジネスロジックが重要）
- **アプリケーション層**: 最低90%（ユースケース検証）
- **インフラストラクチャ層**: 最低70%
- **プレゼンテーション層**: 最低70%

### テスト実行

```bash
# 全テスト実行
npm test

# 開発用ウォッチモード
npm run test:watch

# カバレッジレポート生成
npm run test:coverage

# ブラウザでカバレッジ表示
open coverage/lcov-report/index.html
```

### テスト構造

```
tests/
├── unit/                      # ユニットテスト
│   ├── domain/               # ドメインエンティティとサービステスト
│   ├── application/          # ユースケーステスト
│   └── infrastructure/       # リポジトリ実装テスト
├── integration/              # 統合テスト
│   ├── api/                  # APIエンドポイントテスト
│   └── database/             # データベース統合テスト
└── e2e/                      # エンドツーエンドテスト
    └── user-flows/           # 完全なユーザージャーニーテスト
```

## 🛠️ 開発

### 利用可能なコマンド

```bash
# 開発
npm run dev          # ホットリロード付き開発サーバー起動
npm run build        # TypeScriptをJavaScriptにビルド
npm start           # 本番サーバー起動

# テスト
npm test            # テストスイート実行
npm run test:watch  # ウォッチモードでテスト実行
npm run test:coverage # カバレッジレポート生成

# コード品質
npm run lint        # ESLintでコードチェック
npm run lint:fix    # ESLintの問題を自動修正
npm run format      # Prettierでコード整形
npm run format:check # 変更せずにフォーマットチェック

# データベース
npm run db:migrate  # データベースマイグレーション実行
npm run db:seed     # サンプルデータを投入
```

### 開発ワークフロー

1. **機能開発**
   ```bash
   git checkout -b feature/your-feature-name
   npm run dev
   # 変更を加える
   npm test
   npm run lint
   git commit -m "feat: implement your feature"
   ```

2. **コミット前**
   ```bash
   npm run test:coverage  # カバレッジ要件を確認
   npm run lint:fix       # リントエラーを修正
   npm run format         # 一貫したフォーマットを確保
   npm run build          # TypeScriptコンパイルを検証
   ```

### コード品質基準

- **TypeScript Strict Mode**: 全てのコードはエラーなしでコンパイルされる必要があります
- **ESLint**: コミットされるコードは違反ゼロである必要があります
- **Prettier**: 一貫したコードフォーマット
- **テストカバレッジ**: 最低カバレッジ要件を満たす
- **Console Logsの禁止**: 本番コードでは適切なロギングを使用

## 📚 API ドキュメント

### 認証エンドポイント

```typescript
POST /auth/login      # ユーザーログイン
POST /auth/logout     # ユーザーログアウト
POST /auth/register   # ユーザー登録
```

### 商品エンドポイント

```typescript
GET  /products        # フィルタリング付き商品一覧
GET  /products/:id    # 商品詳細取得
POST /products/search # 高度な商品検索
```

### カートエンドポイント

```typescript
GET    /cart          # ユーザーのカート取得
POST   /cart/add      # カートに商品追加
PUT    /cart/update   # カート内商品数量更新
DELETE /cart/remove   # カートから商品削除
```

### 注文エンドポイント

```typescript
GET  /orders          # ユーザーの注文一覧
POST /orders/create   # 新規注文作成
GET  /orders/:id      # 注文詳細取得
```

## 🔧 設定

### 環境変数

`.env.example`を基に`.env`ファイルを作成してください：

```bash
# サーバー設定
NODE_ENV=development
PORT=3000
HOST=localhost

# データベース
DATABASE_PATH=./data/database.sqlite

# セッション設定
SESSION_SECRET=your-secret-key-here
SESSION_MAX_AGE=86400000

# セキュリティ
CSRF_SECRET=your-csrf-secret

# ログ
LOG_LEVEL=info
```

### TypeScript設定

このプロジェクトは厳格なTypeScript設定を使用しています：

- **パスエイリアス**: `@/domain/*`、`@/application/*`などを使ったクリーンなimport
- **Strict Mode**: 完全な型安全性の強制
- **ES2022 Target**: モダンなJavaScript機能
- **Module Resolution**: パスマッピング付きNode.jsスタイル

## 🏛️ アーキテクチャパターン

### Clean Architectureの利点

1. **独立性**: ビジネスロジックがフレームワーク、UI、データベースから独立
2. **テスト可能性**: ビジネスロジックを単体でテストしやすい
3. **柔軟性**: 外部依存関係（データベース、UIフレームワーク）を容易に変更可能
4. **保守性**: 関心の分離と依存関係が明確

### CQRS実装

アプリケーションはCommand Query Responsibility Segregation（コマンドクエリ責任分離）を実装しています：

- **Commands（コマンド）**: 状態を変更（CreateUser、AddToCart、PlaceOrder）
- **Queries（クエリ）**: データを読み取り（GetUser、GetProducts、GetOrderHistory）

### リポジトリパターン

インターフェースを通じてデータアクセスを抽象化：

```typescript
// ドメイン層インターフェース
interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  save(user: User): Promise<void>;
}

// インフラストラクチャ実装
class UserRepository implements IUserRepository {
  // SQLite固有の実装
}
```

### バリューオブジェクト

ビジネスルールと検証をカプセル化：

```typescript
class Email {
  constructor(private value: string) {
    if (!this.isValidEmail(value)) {
      throw new Error('Invalid email format');
    }
  }

  toString(): string {
    return this.value;
  }
}
```

## 🤝 コントリビューション

### 始め方

1. リポジトリをフォーク
2. 機能ブランチを作成: `git checkout -b feature/amazing-feature`
3. コーディング基準に従って変更を実装
4. テストが通ることを確認: `npm test`
5. 変更をコミット: `git commit -m 'feat: add amazing feature'`
6. ブランチにプッシュ: `git push origin feature/amazing-feature`
7. プルリクエストを開く

### コーディング基準

- 既存のコードスタイルと規則に従う
- 新機能には包括的なテストを記述
- API変更の場合はドキュメントを更新
- 慣例的なコミットメッセージを使用
- TypeScriptがエラーなしでコンパイルされることを確認

### プルリクエストガイドライン

- 変更内容の明確な説明を含める
- 関連するissueを参照
- 全てのテストが通ることを確認
- テストカバレッジを維持または改善
- 必要に応じてドキュメントを更新

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています - 詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## 🔗 技術スタック

| 技術 | バージョン | 用途 |
|------------|---------|---------|
| **TypeScript** | 5.3+ | 型安全なJavaScript開発 |
| **Node.js** | 18+ | JavaScript実行環境 |
| **Express.js** | 4.18 | Webアプリケーションフレームワーク |
| **EJS** | 3.1 | サーバーサイドテンプレートエンジン |
| **SQLite** | 3 | 軽量データベース |
| **Jest** | 29 | テストフレームワーク |
| **ESLint** | 8 | コードリンティングと品質管理 |
| **Prettier** | 3 | コードフォーマッティング |
| **bcryptjs** | 2.4 | パスワードハッシュ化 |
| **express-session** | 1.17 | セッション管理 |
| **helmet** | 7.1 | セキュリティミドルウェア |

## 🚦 プロジェクト状況

- ✅ **ドメイン層**: エンティティ、バリューオブジェクト、サービスが完成
- ✅ **アプリケーション層**: ユースケース、コマンド、クエリ、DTOsが実装済み
- ✅ **インフラストラクチャ層**: SQLiteリポジトリとデータベース設定が完成
- ✅ **プレゼンテーション層**: コントローラー、ルート、ミドルウェアが完成
- 🔄 **フロントエンドテンプレート**: EJSビューの実装が進行中
- 📋 **ドキュメント**: APIドキュメントとデプロイガイドが未完成

## 📞 サポート

質問、問題、またはコントリビューションについて：

- バグレポートや機能リクエストはissueを作成してください
- 一般的な質問はディスカッションを開始してください
- `/docs`フォルダーの既存ドキュメントを確認してください
- 実装例についてはコードベースをレビューしてください

---

**Clean Architectureの原則とモダンなTypeScriptプラクティスで❤️を込めて構築**