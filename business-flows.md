# ECサイト業務フロー図（学習版）

本文書は、ECサイト学習プロジェクトの主要な業務フローをMermaid図で可視化したものです。Express + EJS + SQLiteのシンプルな構成でクリーンアーキテクチャの基本概念を学習できるよう設計されています。

## 学習アーキテクチャ特徴
- **MVC パターン**: Express Router → Controller → UseCase → Repository の流れ
- **クリーンアーキテクチャ**: 依存関係逆転原理の可視化と実践
- **アトミックデザイン**: EJSテンプレートでのコンポーネント階層学習
- **シンプル構成**: SQLite + Express Session で基本概念に集中

## 1. ユーザー購入フロー（Express MVC + クリーンアーキテクチャ学習）

```mermaid
flowchart TD
    A[ユーザーサイト訪問] --> B[Express Router<br/>routes/index.js]
    B --> C[HomeController<br/>controllers/HomeController.js]
    C --> D[ProductListUseCase<br/>usecases/ProductListUseCase.js]
    D --> E[ProductRepository<br/>repositories/ProductRepository.js]
    E --> F[SQLite Database<br/>products.db]

    F --> G[Product Entity<br/>entities/Product.js]
    G --> H[EJS Template Rendering<br/>views/pages/home.ejs]
    H --> I[Atomic Design Components<br/>atoms/organisms/templates]

    I --> J[商品一覧ページ表示]
    J --> K{商品詳細へ}
    K --> L[Express Router<br/>routes/products.js]
    L --> M[ProductController.show<br/>controllers/ProductController.js]

    M --> N[ProductDetailUseCase<br/>クリーンアーキテクチャ層]
    N --> O[ProductRepository.findById<br/>依存関係逆転]
    O --> P[Product Entity<br/>ドメインロジック]

    P --> Q[EJS商品詳細<br/>views/pages/product-detail.ejs]
    Q --> R{カートに追加}
    R --> S[CartController.add<br/>POSTリクエスト処理]

    S --> T[AddToCartUseCase<br/>ビジネスロジック]
    T --> U[CartRepository<br/>データ永続化]
    U --> V[Express Session<br/>カート状態保存]

    V --> W[Cart Entity<br/>カート計算ロジック]
    W --> X[カート更新完了<br/>リダイレクト]

    X --> Y{購入手続きへ}
    Y --> Z[CheckoutController<br/>チェックアウト開始]
    Z --> AA[CheckoutUseCase<br/>注文処理ロジック]

    AA --> BB{ログイン確認}
    BB -->|未ログイン| CC[AuthController<br/>ログイン画面]
    BB -->|ログイン済み| DD[注文確認画面]

    CC --> EE[LoginUseCase<br/>認証処理]
    EE --> FF[UserRepository<br/>ユーザー認証]
    FF --> GG{認証結果}
    GG -->|成功| DD
    GG -->|失敗| HH[ログインエラー]

    DD --> II[OrderUseCase<br/>注文作成処理]
    II --> JJ[OrderRepository<br/>注文データ保存]
    JJ --> KK[Order Entity<br/>注文ドメインロジック]

    KK --> LL[SQLite Transaction<br/>データ整合性保証]
    LL --> MM[注文完了<br/>views/pages/order-complete.ejs]

    style A fill:#e1f5fe
    style MM fill:#c8e6c9
    style HH fill:#ffcdd2
    style T fill:#f3e5f5
    style N fill:#fff3e0
```

## 2. 管理者商品管理フロー（Express MVC学習特化）

```mermaid
flowchart TD
    A[管理者アクセス] --> B[Express Router<br/>routes/admin.js]
    B --> C[AdminMiddleware<br/>認証・権限チェック]
    C --> D{認証・権限確認}

    D -->|認証失敗| E[AuthController<br/>ログイン画面へリダイレクト]
    D -->|権限不足| F[エラーページ表示<br/>403 Forbidden]
    D -->|認証成功| G[AdminController.dashboard<br/>管理画面表示]

    G --> H[AdminDashboardUseCase<br/>統計データ取得]
    H --> I[管理画面表示<br/>views/admin/dashboard.ejs]

    I --> J{管理操作選択}
    J -->|商品管理| K[ProductAdminController<br/>商品管理画面]
    J -->|注文管理| L[OrderAdminController<br/>注文管理画面]
    J -->|ユーザー管理| M[UserAdminController<br/>ユーザー管理画面]

    K --> N[ProductAdminController.create<br/>商品登録フォーム]
    N --> O[商品登録画面<br/>views/admin/products/create.ejs]
    O --> P[POSTリクエスト<br/>商品データ送信]
    P --> Q[CreateProductUseCase<br/>ビジネスロジック]

    Q --> R[商品データバリデーション<br/>validation/ProductValidator.js]
    R --> S{バリデーション結果}

    S -->|エラー| T[バリデーションエラー<br/>フォーム再表示]
    S -->|成功| U[ProductRepository.create<br/>SQLiteに保存]

    T --> O
    U --> V[Product Entity<br/>ドメインモデル]
    V --> W[商品保存完了<br/>成功メッセージ]
    W --> X[商品一覧へリダイレクト]

    L --> Y[OrderListUseCase<br/>注文一覧取得]
    Y --> Z[OrderRepository.findAll<br/>SQLiteから取得]
    Z --> AA[注文一覧表示<br/>views/admin/orders/index.ejs]

    AA --> BB{注文ステータス更新}
    BB --> CC[OrderAdminController.update<br/>ステータス変更]
    CC --> DD[UpdateOrderStatusUseCase<br/>ビジネスロジック]
    DD --> EE[OrderRepository.update<br/>SQLite更新]

    EE --> FF[Order Entity<br/>状態変更ロジック]
    FF --> GG[ステータス更新完了<br/>リダイレクト]

    M --> HH[UserListUseCase<br/>ユーザー一覧取得]
    HH --> II[UserRepository.findAll<br/>ユーザーデータ取得]
    II --> JJ[ユーザー一覧表示<br/>views/admin/users/index.ejs]

    X --> I
    GG --> I
    JJ --> I

    style A fill:#e1f5fe
    style I fill:#f3e5f5
    style E fill:#ffcdd2
    style F fill:#ffcdd2
    style T fill:#ffcdd2
    style Q fill:#fff3e0
    style DD fill:#fff3e0
```

## 3. ユーザー認証・セッション管理フロー（Express Session学習）

```mermaid
flowchart TD
    A[ユーザーアクセス] --> B[Express Session<br/>セッション状態確認]
    B --> C{セッション・認証状態}

    C -->|新規ユーザー| D[新規セッション生成<br/>Express Session Store]
    C -->|既存セッション・未認証| E[セッション継続<br/>ゲスト状態維持]
    C -->|認証済みセッション| F[認証ユーザーセッション]

    D --> G[AuthController.register<br/>会員登録フォーム]
    E --> H{ユーザー操作}
    F --> I[UserController.profile<br/>マイページ表示]

    G --> J[ユーザー登録画面<br/>views/auth/register.ejs]
    J --> K[RegisterUseCase<br/>ユーザー登録処理]
    K --> L[UserValidator<br/>入力値検証]
    L --> M{バリデーション結果}

    M -->|エラー| N[バリデーションエラー<br/>フォーム再表示]
    M -->|成功| O[UserRepository.create<br/>SQLiteにユーザー保存]
    N --> J

    O --> P[User Entity<br/>パスワードハッシュ化]
    P --> Q[アカウント作成完了<br/>自動ログイン]

    H -->|ログイン希望| R[AuthController.login<br/>ログインフォーム]
    H -->|商品閲覧継続| S[ゲスト状態で継続<br/>カート機能利用可能]

    R --> T[ログイン画面<br/>views/auth/login.ejs]
    T --> U[LoginUseCase<br/>認証処理]
    U --> V{認証結果}

    V -->|認証成功| W[Express Session更新<br/>user情報保存]
    V -->|認証失敗| X[ログインエラー表示]

    W --> Y[認証成功リダイレクト<br/>元のページまたはマイページ]
    Q --> Y

    Y --> I

    I --> Z{ユーザー操作選択}
    Z -->|プロフィール編集| AA[UserController.edit<br/>プロフィール編集]
    Z -->|注文履歴| BB[OrderController.history<br/>注文履歴表示]
    Z -->|ログアウト| CC[AuthController.logout<br/>ログアウト処理]

    AA --> DD[UpdateProfileUseCase<br/>プロフィール更新]
    DD --> EE[UserRepository.update<br/>SQLite更新]
    EE --> FF{更新結果}

    FF -->|成功| GG[更新成功メッセージ<br/>プロフィール画面]
    FF -->|エラー| HH[更新エラー表示<br/>フォーム再表示]

    BB --> II[OrderHistoryUseCase<br/>注文履歴取得]
    II --> JJ[OrderRepository.findByUserId<br/>ユーザーの注文取得]
    JJ --> KK[注文履歴表示<br/>views/user/order-history.ejs]

    CC --> LL[Express Session破棄<br/>req.session.destroy()]
    LL --> MM[ログアウト完了<br/>トップページリダイレクト]

    GG --> I
    HH --> I
    KK --> I
    X --> T
    S --> A

    style A fill:#e1f5fe
    style Q fill:#c8e6c9
    style W fill:#c8e6c9
    style MM fill:#f3e5f5
    style X fill:#ffcdd2
    style HH fill:#ffcdd2
    style K fill:#fff3e0
    style DD fill:#fff3e0
```

## 4. EJSアトミックデザイン・テンプレートレンダリングフロー（学習特化）

```mermaid
flowchart TD
    A[HTTPリクエスト] --> B[Express Router<br/>URLパターンマッチング]
    B --> C[Controller<br/>リクエスト処理開始]
    C --> D[UseCase<br/>ビジネスロジック実行]

    D --> E[Repository<br/>データアクセス層]
    E --> F[SQLite Database<br/>データ取得]
    F --> G[Entity<br/>ドメインオブジェクト生成]

    G --> H[View Data Preparation<br/>テンプレート用データ整形]
    H --> I[EJS Template Engine<br/>レンダリング開始]

    I --> J[Templates Layer<br/>views/templates/]
    J --> K[Page Template<br/>商品一覧・詳細等のページ全体]

    K --> L[Organisms Layer<br/>views/organisms/]
    L --> M[Header Component<br/>ナビゲーション・ロゴ]
    L --> N[Product List Component<br/>商品一覧表示]
    L --> O[Footer Component<br/>フッター情報]

    M --> P[Molecules Layer<br/>views/molecules/]
    N --> P
    O --> P

    P --> Q[Navigation Menu<br/>メニューリスト]
    P --> R[Product Card<br/>商品カード]
    P --> S[Search Form<br/>検索フォーム]

    Q --> T[Atoms Layer<br/>views/atoms/]
    R --> T
    S --> T

    T --> U[Button<br/>基本ボタン]
    T --> V[Input<br/>入力フィールド]
    T --> W[Image<br/>画像表示]
    T --> X[Link<br/>リンク要素]

    U --> Y[HTML Generation<br/>最終HTML生成]
    V --> Y
    W --> Y
    X --> Y

    Y --> Z[Response<br/>クライアントへ送信]

    style A fill:#e1f5fe
    style Z fill:#c8e6c9
    style K fill:#fff3e0
    style L fill:#f3e5f5
    style P fill:#e8f5e8
    style T fill:#fdf0e6
```

## 5. クリーンアーキテクチャ学習フロー（依存関係逆転の可視化）

```mermaid
flowchart TD
    A[外部リクエスト] --> B[🔵 Presentation Layer<br/>Express Routes + Controllers]
    B --> C[🟡 Application Layer<br/>Use Cases]
    C --> D[🟢 Domain Layer<br/>Entities + Business Logic]

    C --> E[🔴 Infrastructure Layer<br/>Repositories + External Services]
    E --> F[SQLite Database<br/>データ永続化]
    E --> G[External APIs<br/>外部サービス連携]

    D --> H[📋 依存関係逆転の学習ポイント]
    H --> I[Domain → Infrastructure<br/>❌ 直接依存禁止]
    H --> J[Domain ← Infrastructure<br/>✅ インターフェース経由]

    J --> K[Repository Interface<br/>Domain層で定義]
    K --> L[Repository Implementation<br/>Infrastructure層で実装]

    B --> M[Controller責務<br/>HTTPリクエスト処理のみ]
    C --> N[UseCase責務<br/>ビジネスフロー調整]
    D --> O[Entity責務<br/>コアビジネスルール]
    E --> P[Repository責務<br/>データアクセス詳細]

    style B fill:#e3f2fd
    style C fill:#fff9c4
    style D fill:#e8f5e8
    style E fill:#ffebee
    style I fill:#ffcdd2
    style J fill:#c8e6c9
```

## 6. 学習プロジェクト・アーキテクチャ対応表

### 🔵 Presentation Layer（表現層）- Express + EJS
- **Express Router**: URLルーティングとHTTPリクエスト処理
- **Controllers**: リクエスト/レスポンス変換とバリデーション
- **EJS Templates**: アトミックデザインによるコンポーネント階層
- **Middleware**: 認証、セッション管理、エラーハンドリング
- **Static Assets**: CSS、JavaScript、画像ファイル

### 🟡 Application Layer（アプリケーション層）- Use Cases
- **Use Cases**: ビジネスフローの調整とトランザクション境界
- **Service Classes**: 複数Entityにまたがる処理の調整
- **Validation**: 入力値検証とビジネスルール確認
- **Session Management**: Express Sessionによるユーザー状態管理
- **Error Handling**: アプリケーション例外の処理とログ記録

### 🟢 Domain Layer（ドメイン層）- コアビジネスロジック
- **Entities**: User, Product, Order, Cart等のビジネスオブジェクト
- **Value Objects**: Money, Email, Address等の値オブジェクト
- **Domain Services**: 複雑なビジネスルール（在庫管理、価格計算等）
- **Repository Interfaces**: データアクセスの抽象化定義
- **Business Rules**: ECサイトのコアルール（在庫制御、注文処理等）

### 🔴 Infrastructure Layer（インフラストラクチャ層）- 外部連携
- **SQLite Repository**: データ永続化の具体実装
- **Session Store**: Express Sessionのメモリストア実装
- **File System**: 画像アップロード、ログファイル管理
- **Configuration**: 環境設定、データベース接続設定
- **Logging**: アプリケーションログ記録とエラー追跡

## 学習のポイント

### 🎯 クリーンアーキテクチャの基本概念
1. **依存関係の方向**: 外側から内側へのみ依存
2. **関心の分離**: 各層が明確な責務を持つ
3. **テスタビリティ**: 各層を独立してテスト可能
4. **保守性**: 変更の影響が局所化される

### 🎨 アトミックデザインの習得
1. **Atoms**: 最小単位のUIコンポーネント
2. **Molecules**: Atomsを組み合わせた機能単位
3. **Organisms**: Moleculesを組み合わせた複雑なUI
4. **Templates**: ページレイアウトの枠組み
5. **Pages**: 実際のコンテンツが入った完成ページ

### 🛠️ Express MVC パターンの理解
1. **Model**: Entityとビジネスロジック
2. **View**: EJSテンプレートとアトミックデザイン
3. **Controller**: HTTPリクエスト処理とフロー制御
4. **Router**: URLパターンとController連携

この学習プロジェクトは、実践的なWebアプリケーション開発で必要な アーキテクチャパターン、設計原則、コンポーネント設計を、シンプルな構成で確実に習得できるよう設計されています。