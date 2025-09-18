# ECサイト学習プロジェクト仕様書
*クリーンアーキテクチャ + アトミックデザイン 実践学習*

## 1. プロジェクト概要

### 1.1 プロジェクト名
**Simple E-Commerce Learning Platform (SELP)**

### 1.2 プロジェクト目的
このプロジェクトは、**クリーンアーキテクチャとアトミックデザインの実践学習**に特化した教材型ECサイトです。複雑な技術スタックに惑わされることなく、アーキテクチャとデザイン手法の本質を体系的に習得できます。

### 1.3 学習重視の設計方針
- **本質的学習**: 流行技術ではなく、普遍的な設計原則の習得
- **段階的理解**: 5つのフェーズによる体系的な実装進行
- **実感しやすい構成**: シンプルな技術スタックで効果が見えやすい設計
- **テスタブル設計**: 依存関係逆転によるテスト容易性の体感
- **再利用可能性**: アトミックデザインによるコンポーネント設計の理解

---

## 2. 学習用技術スタック

### 2.1 シンプル・実践重視の技術選択
```yaml
Backend:
  Runtime: "Node.js 18+"
  Framework: "Express.js 4.x"
  Template: "EJS"
  Database: "SQLite + Prisma"
  Testing: "Jest + Supertest"

Frontend:
  JavaScript: "Vanilla JS (ES6+)"
  CSS: "CSS3 + CSS Variables"
  Build: "Vite"

Development:
  TypeScript: "5.x"
  Validation: "Zod"
  Linting: "ESLint + Prettier"
```

### 2.2 技術スタック選択理由

#### 2.2.1 Express.js + EJS選択の学習メリット
- **本質集中**: フレームワーク機能に惑わされず、アーキテクチャ設計に集中
- **理解容易性**: MVCパターンから4層アーキテクチャへの自然な発展
- **デバッグ性**: 実行フローが追いやすく、問題箇所の特定が容易
- **汎用性**: 他のフレームワークへの応用が利きやすい

#### 2.2.2 SQLite選択の学習メリット
- **環境構築簡単**: ファイルベースで環境構築コストが最小
- **学習集中**: インフラ設定ではなく、データベース設計とクエリ最適化に集中
- **デバッグ容易**: SQLite Browser等でデータ状態を簡単に確認可能
- **本質理解**: SQL基礎とORMパターンの理解促進

#### 2.2.3 Vanilla JS + CSS選択の学習メリット
- **アトミックデザイン体感**: フレームワーク機能に頼らないコンポーネント設計
- **CSS理解深化**: CSS Modules、CSS-in-JS等の複雑さを排除し、CSSの本質理解
- **パフォーマンス意識**: 軽量性とパフォーマンスを自然に意識する設計

---

## 3. 4層クリーンアーキテクチャ設計

### 3.1 アーキテクチャ構造図
```
┌─────────────────────────────────────────────────────────┐
│                Presentation Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │ Controllers │ │     EJS     │ │      API        │   │
│  │ (Express)   │ │ Templates   │ │   Endpoints     │   │
│  │             │ │             │ │                 │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                Application Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │  Use Cases  │ │  Services   │ │  Validation     │   │
│  │ (Business   │ │ (Workflow   │ │     (Zod)       │   │
│  │  Logic)     │ │  Logic)     │ │                 │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                   Domain Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │  Entities   │ │   Value     │ │   Domain        │   │
│  │             │ │  Objects    │ │   Services      │   │
│  │             │ │             │ │                 │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│              Infrastructure Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │   SQLite    │ │   Prisma    │ │    File         │   │
│  │  Database   │ │ Repository  │ │   Storage       │   │
│  │             │ │             │ │                 │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 3.2 各層の学習ポイント

#### 3.2.1 Presentation Layer（表現層）
**責務**: HTTPリクエスト/レスポンス処理、ビューの描画
**学習ポイント**:
- HTTPプロトコルの理解
- RESTful API設計
- テンプレートエンジンパターン
- エラーハンドリング戦略

**実装例**:
```javascript
// controllers/ProductController.js
class ProductController {
  constructor(productUseCase) {
    this.productUseCase = productUseCase; // 依存性注入
  }

  async getProducts(req, res) {
    try {
      const products = await this.productUseCase.getAllProducts();
      res.render('products/index', { products });
    } catch (error) {
      res.status(500).render('error', { error: error.message });
    }
  }
}
```

#### 3.2.2 Application Layer（アプリケーション層）
**責務**: ビジネスフロー制御、外部サービス連携
**学習ポイント**:
- Use Caseパターン
- 依存性逆転の原則
- トランザクション管理
- ビジネスフロー設計

**実装例**:
```javascript
// usecases/ProductUseCase.js
class ProductUseCase {
  constructor(productRepository, imageService) {
    this.productRepository = productRepository;
    this.imageService = imageService;
  }

  async createProduct(productData) {
    // ビジネスロジック
    const product = new Product(productData);

    // ドメインルール検証
    if (!product.isValid()) {
      throw new ValidationError('Invalid product data');
    }

    // 永続化
    return await this.productRepository.save(product);
  }
}
```

#### 3.2.3 Domain Layer（ドメイン層）
**責務**: ビジネスルール、ドメイン知識の表現
**学習ポイント**:
- エンティティ設計
- 値オブジェクト設計
- ドメインサービス
- 不変性の原則

**実装例**:
```javascript
// domain/entities/Product.js
class Product {
  constructor(id, name, price, stock) {
    this.id = id;
    this.name = name;
    this.price = new Price(price); // Value Object
    this.stock = stock;
  }

  isAvailable() {
    return this.stock > 0; // ビジネスルール
  }

  reduceStock(quantity) {
    if (quantity > this.stock) {
      throw new InsufficientStockError();
    }
    this.stock -= quantity;
  }
}

// domain/valueobjects/Price.js
class Price {
  constructor(amount) {
    if (amount < 0) {
      throw new Error('Price cannot be negative');
    }
    this.amount = amount;
  }

  equals(other) {
    return this.amount === other.amount;
  }
}
```

#### 3.2.4 Infrastructure Layer（インフラストラクチャ層）
**責務**: 永続化、外部API、ファイルシステム
**学習ポイント**:
- リポジトリパターン
- アダプターパターン
- データマッピング
- 外部依存の抽象化

**実装例**:
```javascript
// infrastructure/repositories/PrismaProductRepository.js
class PrismaProductRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  async save(product) {
    const productData = {
      id: product.id,
      name: product.name,
      price: product.price.amount,
      stock: product.stock
    };

    return await this.prisma.product.create({
      data: productData
    });
  }

  async findById(id) {
    const data = await this.prisma.product.findUnique({
      where: { id }
    });

    if (!data) return null;

    return new Product(data.id, data.name, data.price, data.stock);
  }
}
```

---

## 4. アトミックデザイン実装

### 4.1 EJSによる5段階コンポーネント設計

#### 4.1.1 Atoms（原子） - 最小UI要素
**学習目的**: 再利用可能な最小単位の理解と実装

```html
<!-- views/components/atoms/button.ejs -->
<button
  class="btn btn--<%= variant %> btn--<%= size %>"
  <%= disabled ? 'disabled' : '' %>
  <%= onclick ? `onclick="${onclick}"` : '' %>>
  <%= text %>
</button>

<!-- views/components/atoms/input.ejs -->
<input
  type="<%= type %>"
  name="<%= name %>"
  class="input input--<%= variant %>"
  placeholder="<%= placeholder %>"
  value="<%= value || '' %>"
  <%= required ? 'required' : '' %> />

<!-- views/components/atoms/price.ejs -->
<span class="price price--<%= size %>">
  <span class="price__currency">¥</span>
  <span class="price__amount"><%= amount.toLocaleString() %></span>
</span>
```

**CSS Variables活用例**:
```css
/* styles/atoms/button.css */
.btn {
  --btn-padding: var(--space-md);
  --btn-radius: var(--radius-sm);
  --btn-font-size: var(--font-size-base);

  padding: var(--btn-padding);
  border-radius: var(--btn-radius);
  font-size: var(--btn-font-size);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn--primary {
  --btn-bg: var(--color-primary);
  --btn-color: var(--color-white);
  background-color: var(--btn-bg);
  color: var(--btn-color);
}

.btn--primary:hover {
  --btn-bg: var(--color-primary-dark);
}
```

#### 4.1.2 Molecules（分子） - 機能コンポーネント
**学習目的**: Atomsの組み合わせによる機能単位の実装

```html
<!-- views/components/molecules/product-card.ejs -->
<article class="product-card">
  <%- include('../atoms/image', {
    src: product.imageUrl,
    alt: product.name,
    class: 'product-card__image'
  }) %>

  <div class="product-card__content">
    <h3 class="product-card__name"><%= product.name %></h3>

    <%- include('../atoms/price', {
      amount: product.price,
      size: 'md'
    }) %>

    <div class="product-card__actions">
      <%- include('../atoms/button', {
        text: 'カートに追加',
        variant: 'primary',
        size: 'sm',
        onclick: `addToCart('${product.id}')`
      }) %>
    </div>
  </div>
</article>

<!-- views/components/molecules/search-form.ejs -->
<form class="search-form" method="GET" action="/products/search">
  <div class="search-form__field">
    <%- include('../atoms/input', {
      type: 'text',
      name: 'q',
      placeholder: '商品名で検索...',
      variant: 'search',
      value: query
    }) %>
  </div>

  <%- include('../atoms/button', {
    text: '検索',
    variant: 'primary',
    size: 'md'
  }) %>
</form>
```

#### 4.1.3 Organisms（有機体） - 独立UIセクション
**学習目的**: 複数のMoleculesを組み合わせた自律的コンポーネント

```html
<!-- views/components/organisms/header.ejs -->
<header class="main-header">
  <div class="main-header__container">
    <!-- ロゴ部分 -->
    <div class="main-header__logo">
      <%- include('../atoms/logo', { size: 'md' }) %>
    </div>

    <!-- 検索部分 -->
    <div class="main-header__search">
      <%- include('../molecules/search-form', { query: '' }) %>
    </div>

    <!-- ユーザーメニュー -->
    <nav class="main-header__nav">
      <%- include('../molecules/user-menu', { user: user }) %>
      <%- include('../molecules/cart-button', { itemCount: cartItemCount }) %>
    </nav>
  </div>
</header>

<!-- views/components/organisms/product-grid.ejs -->
<section class="product-grid">
  <div class="product-grid__header">
    <h2 class="product-grid__title"><%= title %></h2>
    <%- include('../molecules/sort-filter', { currentSort: sort }) %>
  </div>

  <div class="product-grid__items">
    <% products.forEach(product => { %>
      <%- include('../molecules/product-card', { product: product }) %>
    <% }) %>
  </div>

  <div class="product-grid__footer">
    <%- include('../molecules/pagination', {
      currentPage: page,
      totalPages: totalPages,
      baseUrl: '/products'
    }) %>
  </div>
</section>
```

#### 4.1.4 Templates（テンプレート） - ページレイアウト
**学習目的**: レイアウト構造とコンテンツ領域の定義

```html
<!-- views/templates/main-layout.ejs -->
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %> | Simple EC Site</title>
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <!-- ヘッダー -->
  <%- include('../components/organisms/header', {
    user: user,
    cartItemCount: cartItemCount
  }) %>

  <!-- メインコンテンツ -->
  <main class="main-content">
    <% if (locals.showBreadcrumb) { %>
      <%- include('../components/molecules/breadcrumb', {
        items: breadcrumb
      }) %>
    <% } %>

    <!-- ページ固有コンテンツ -->
    <%- body %>
  </main>

  <!-- フッター -->
  <%- include('../components/organisms/footer') %>

  <!-- JavaScript -->
  <script src="/scripts/main.js"></script>
</body>
</html>

<!-- views/templates/product-layout.ejs -->
<div class="product-layout">
  <!-- サイドバー -->
  <aside class="product-layout__sidebar">
    <%- include('../components/organisms/category-sidebar', {
      categories: categories,
      currentCategory: currentCategory
    }) %>

    <%- include('../components/organisms/filter-sidebar', {
      filters: filters
    }) %>
  </aside>

  <!-- メインコンテンツ -->
  <div class="product-layout__content">
    <%- body %>
  </div>
</div>
```

#### 4.1.5 Pages（ページ） - 最終実装
**学習目的**: 全コンポーネントの統合とページ固有ロジック

```html
<!-- views/pages/products/index.ejs -->
<% layout('templates/main-layout', {
  title: 'products.title',
  showBreadcrumb: true,
  breadcrumb: [
    { name: 'ホーム', url: '/' },
    { name: '商品一覧', url: '/products' }
  ]
}) %>

<% content('body') %>
  <%- include('../../templates/product-layout') %>

  <% content('body') %>
    <!-- 商品グリッド -->
    <%- include('../../components/organisms/product-grid', {
      title: 'すべての商品',
      products: products,
      sort: currentSort,
      page: currentPage,
      totalPages: totalPages
    }) %>

    <% if (featuredProducts && featuredProducts.length > 0) { %>
      <!-- おすすめ商品 -->
      <%- include('../../components/organisms/featured-products', {
        products: featuredProducts
      }) %>
    <% } %>
  <% end %>
<% end %>
```

### 4.2 Vanilla JavaScript コンポーネント連携

#### 4.2.1 コンポーネント間通信パターン
```javascript
// scripts/components/ProductCard.js
class ProductCard {
  constructor(element) {
    this.element = element;
    this.productId = element.dataset.productId;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    const addToCartBtn = this.element.querySelector('.product-card__add-to-cart');
    addToCartBtn.addEventListener('click', () => this.handleAddToCart());
  }

  async handleAddToCart() {
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: this.productId, quantity: 1 })
      });

      if (response.ok) {
        // カートカウント更新イベント発火
        window.dispatchEvent(new CustomEvent('cart:updated', {
          detail: { productId: this.productId }
        }));
      }
    } catch (error) {
      console.error('Add to cart failed:', error);
    }
  }
}

// scripts/components/CartButton.js
class CartButton {
  constructor(element) {
    this.element = element;
    this.countElement = element.querySelector('.cart-button__count');
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('cart:updated', () => this.updateCount());
  }

  async updateCount() {
    try {
      const response = await fetch('/api/cart/count');
      const { count } = await response.json();
      this.countElement.textContent = count;
      this.element.classList.toggle('cart-button--has-items', count > 0);
    } catch (error) {
      console.error('Cart count update failed:', error);
    }
  }
}
```

---

## 5. 学習特化機能要件

### 5.1 コア機能の絞り込み
**学習効果を最大化するため、重要機能に集中**

#### 5.1.1 商品管理機能
- **商品一覧表示**: ページネーション、検索、カテゴリフィルタ
- **商品詳細表示**: 画像、説明、価格、在庫状況
- **カテゴリ管理**: 階層構造のカテゴリ表示

#### 5.1.2 ショッピングカート機能
- **カート管理**: 商品追加、数量変更、削除
- **セッション永続化**: ブラウザ再訪時のカート状態維持
- **在庫チェック**: カート追加時の在庫確認

#### 5.1.3 注文管理機能
- **注文作成**: カートから注文への変換
- **注文履歴**: ユーザーの過去注文一覧
- **注文状態管理**: 注文、処理中、発送済み等のステータス

#### 5.1.4 ユーザー管理機能（簡易）
- **ユーザー登録**: メールアドレス、パスワード
- **ログイン**: セッション管理
- **プロフィール**: 基本情報、配送先住所

### 5.2 学習フェーズごとの機能実装

#### フェーズ1: 基盤設計（1週間）
**学習目標**: クリーンアーキテクチャの土台構築
- プロジェクト構造設定
- SQLiteデータベース設計
- 基本エンティティ実装（Product、User）
- リポジトリパターン実装

#### フェーズ2: 商品表示（1週間）
**学習目標**: ドメイン層とプレゼンテーション層の連携
- Product関連UseCase実装
- アトミックデザイン基盤コンポーネント作成
- 商品一覧・詳細ページ実装
- 検索・フィルタ機能実装

#### フェーズ3: カート機能（1週間）
**学習目標**: 状態管理とセッション処理
- Cart Entity実装
- セッション管理実装
- カートUIコンポーネント実装
- 在庫管理ビジネスロジック実装

#### フェーズ4: 注文・ユーザー管理（1週間）
**学習目標**: 複雑なビジネスフロー実装
- Order Entity、User Entity実装
- 認証システム実装
- 注文プロセス実装
- ユーザーページ実装

#### フェーズ5: テスト・最適化（1週間）
**学習目標**: テスト戦略と品質保証
- ユニットテスト実装
- 統合テスト実装
- パフォーマンス最適化
- エラーハンドリング強化

### 5.3 意図的に除外する機能
**学習集中のため、以下は実装しない**
- 決済システム（Stripe等の連携）
- メール配信システム
- レビュー・評価システム
- 在庫連動システム
- リアルタイム通知
- 管理画面（複雑な権限管理等）

---

## 6. SQLiteデータベース設計

### 6.1 学習特化の軽量データベース設計

#### 6.1.1 シンプル・実践重視のER図
```
Users (ユーザー)
  ├─ Orders (注文)
  │  └─ OrderItems (注文商品)
  └─ CartItems (カート商品)

Products (商品)
  ├─ ProductImages (商品画像)
  ├─ Categories (カテゴリ)
  ├─ OrderItems (注文商品詳細)
  └─ CartItems (カート商品詳細)

Categories (カテゴリ)
  ├─ Products (商品)
  └─ 自己参照（parent_id）
```

### 6.2 Prismaスキーマ設計（SQLite）

#### 6.2.1 基本設定
```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

#### 6.2.2 ユーザー関連テーブル
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String?
  lastName  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // リレーション
  orders    Order[]
  cartItems CartItem[]

  @@map("users")
}
```

#### 6.2.3 商品関連テーブル
```prisma
model Product {
  id          String  @id @default(cuid())
  name        String
  description String?
  price       Int     // 円単位で保存
  stock       Int     @default(0)
  imageUrl    String?
  categoryId  String?
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // リレーション
  category   Category?  @relation(fields: [categoryId], references: [id])
  orderItems OrderItem[]
  cartItems  CartItem[]

  @@map("products")
}

model Category {
  id       String  @id @default(cuid())
  name     String
  parentId String?
  isActive Boolean @default(true)

  // リレーション
  parent   Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
  products Product[]

  @@map("categories")
}
```

#### 6.2.4 注文関連テーブル
```prisma
model Order {
  id          String      @id @default(cuid())
  userId      String
  totalAmount Int         // 円単位
  status      OrderStatus @default(PENDING)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // リレーション
  user  User        @relation(fields: [userId], references: [id])
  items OrderItem[]

  @@map("orders")
}

model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Int    // 注文時の価格

  // リレーション
  order   Order   @relation(fields: [orderId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}

enum OrderStatus {
  PENDING    // 注文受付
  CONFIRMED  // 注文確定
  SHIPPED    // 発送済み
  DELIVERED  // 配送完了
  CANCELLED  // キャンセル
}
```

#### 6.2.5 カート関連テーブル
```prisma
model CartItem {
  id        String   @id @default(cuid())
  userId    String
  productId String
  quantity  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // リレーション
  user    User    @relation(fields: [userId], references: [id])
  product Product @relation(fields: [productId], references: [id])

  // ユーザーと商品の組み合わせは一意
  @@unique([userId, productId])
  @@map("cart_items")
}
```

### 6.3 初期データ設計（seeds）

#### 6.3.1 学習用サンプルデータ
```javascript
// prisma/seeds/sample-data.js
const sampleCategories = [
  { id: '1', name: '本・雑誌', parentId: null },
  { id: '2', name: '小説', parentId: '1' },
  { id: '3', name: '技術書', parentId: '1' },
  { id: '4', name: '電子機器', parentId: null },
  { id: '5', name: 'スマートフォン', parentId: '4' },
];

const sampleProducts = [
  {
    id: '1',
    name: 'クリーンアーキテクチャ',
    description: 'ソフトウェア設計の基本原則',
    price: 3200,
    stock: 10,
    categoryId: '3',
    imageUrl: '/images/clean-architecture.jpg'
  },
  {
    id: '2',
    name: 'JavaScript入門',
    description: 'Web開発の基礎を学ぶ',
    price: 2800,
    stock: 15,
    categoryId: '3',
    imageUrl: '/images/js-book.jpg'
  },
  // ... 他のサンプル商品
];

const sampleUsers = [
  {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: '太郎',
    lastName: '山田'
  }
];
```

### 6.4 データベース操作の学習ポイント

#### 6.4.1 基本的なCRUD操作
```javascript
// 商品検索（ページネーション付き）
const getProducts = async (page = 1, limit = 10, categoryId = null) => {
  const skip = (page - 1) * limit;

  return await prisma.product.findMany({
    where: {
      isActive: true,
      ...(categoryId && { categoryId })
    },
    include: {
      category: true
    },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
};

// カート商品追加
const addToCart = async (userId, productId, quantity) => {
  return await prisma.cartItem.upsert({
    where: {
      userId_productId: { userId, productId }
    },
    update: {
      quantity: { increment: quantity }
    },
    create: {
      userId,
      productId,
      quantity
    }
  });
};
```

#### 6.4.2 トランザクション処理（注文作成）
```javascript
const createOrder = async (userId) => {
  return await prisma.$transaction(async (tx) => {
    // 1. カート商品取得
    const cartItems = await tx.cartItem.findMany({
      where: { userId },
      include: { product: true }
    });

    if (cartItems.length === 0) {
      throw new Error('カートが空です');
    }

    // 2. 在庫チェック
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        throw new Error(`${item.product.name}の在庫不足`);
      }
    }

    // 3. 注文作成
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const order = await tx.order.create({
      data: {
        userId,
        totalAmount,
        status: 'PENDING'
      }
    });

    // 4. 注文商品作成
    await tx.orderItem.createMany({
      data: cartItems.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price
      }))
    });

    // 5. 在庫減少
    for (const item of cartItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    // 6. カート削除
    await tx.cartItem.deleteMany({
      where: { userId }
    });

    return order;
  });
};
```

---

## 7. ディレクトリ構造（学習特化）

### 7.1 クリーンアーキテクチャ準拠のプロジェクト構造
```
simple-ecommerce-learning/
├── src/
│   ├── presentation/           # 表現層
│   │   ├── controllers/        # Express Controllers
│   │   │   ├── ProductController.js
│   │   │   ├── CartController.js
│   │   │   ├── OrderController.js
│   │   │   └── UserController.js
│   │   ├── routes/             # ルート定義
│   │   │   ├── index.js
│   │   │   ├── products.js
│   │   │   ├── cart.js
│   │   │   └── auth.js
│   │   ├── middleware/         # Express Middleware
│   │   │   ├── auth.js
│   │   │   ├── validation.js
│   │   │   └── errorHandler.js
│   │   └── validators/         # リクエスト検証
│   │       ├── productValidators.js
│   │       ├── cartValidators.js
│   │       └── userValidators.js
│   │
│   ├── application/            # アプリケーション層
│   │   ├── usecases/           # ビジネスロジック
│   │   │   ├── ProductUseCase.js
│   │   │   ├── CartUseCase.js
│   │   │   ├── OrderUseCase.js
│   │   │   └── UserUseCase.js
│   │   ├── services/           # サービス層
│   │   │   ├── SessionService.js
│   │   │   ├── ImageService.js
│   │   │   └── ValidationService.js
│   │   └── dto/                # Data Transfer Objects
│   │       ├── ProductDTO.js
│   │       ├── CartDTO.js
│   │       └── OrderDTO.js
│   │
│   ├── domain/                 # ドメイン層
│   │   ├── entities/           # エンティティ
│   │   │   ├── Product.js
│   │   │   ├── Cart.js
│   │   │   ├── Order.js
│   │   │   ├── User.js
│   │   │   └── Category.js
│   │   ├── valueobjects/       # 値オブジェクト
│   │   │   ├── Price.js
│   │   │   ├── Email.js
│   │   │   ├── ProductId.js
│   │   │   └── UserId.js
│   │   ├── repositories/       # リポジトリインターフェース
│   │   │   ├── IProductRepository.js
│   │   │   ├── ICartRepository.js
│   │   │   ├── IOrderRepository.js
│   │   │   └── IUserRepository.js
│   │   └── services/           # ドメインサービス
│   │       ├── OrderCalculationService.js
│   │       └── StockManagementService.js
│   │
│   ├── infrastructure/         # インフラストラクチャ層
│   │   ├── database/           # データベース設定
│   │   │   ├── prisma.js
│   │   │   └── migrations/
│   │   ├── repositories/       # リポジトリ実装
│   │   │   ├── PrismaProductRepository.js
│   │   │   ├── PrismaCartRepository.js
│   │   │   ├── PrismaOrderRepository.js
│   │   │   └── PrismaUserRepository.js
│   │   ├── external/           # 外部サービス
│   │   │   └── ImageStorageService.js
│   │   └── config/             # 設定ファイル
│   │       ├── database.js
│   │       └── session.js
│   │
│   ├── shared/                 # 共通機能
│   │   ├── constants/          # 定数
│   │   │   ├── orderStatus.js
│   │   │   └── errorCodes.js
│   │   ├── utils/              # ユーティリティ
│   │   │   ├── password.js
│   │   │   ├── validation.js
│   │   │   └── formatters.js
│   │   ├── types/              # 型定義（TypeScript使用時）
│   │   │   └── index.d.ts
│   │   └── errors/             # エラークラス
│   │       ├── DomainError.js
│   │       ├── ValidationError.js
│   │       └── NotFoundError.js
│   │
│   └── main.js                 # エントリーポイント
│
├── views/                      # EJSテンプレート（アトミックデザイン）
│   ├── components/
│   │   ├── atoms/              # 原子レベル
│   │   │   ├── button.ejs
│   │   │   ├── input.ejs
│   │   │   ├── price.ejs
│   │   │   ├── image.ejs
│   │   │   └── badge.ejs
│   │   ├── molecules/          # 分子レベル
│   │   │   ├── product-card.ejs
│   │   │   ├── search-form.ejs
│   │   │   ├── cart-item.ejs
│   │   │   ├── pagination.ejs
│   │   │   └── breadcrumb.ejs
│   │   ├── organisms/          # 有機体レベル
│   │   │   ├── header.ejs
│   │   │   ├── footer.ejs
│   │   │   ├── product-grid.ejs
│   │   │   ├── category-sidebar.ejs
│   │   │   └── cart-summary.ejs
│   │   └── templates/          # テンプレートレベル
│   │       ├── main-layout.ejs
│   │       ├── product-layout.ejs
│   │       └── auth-layout.ejs
│   │
│   └── pages/                  # ページレベル
│       ├── index.ejs           # ホームページ
│       ├── products/
│       │   ├── index.ejs       # 商品一覧
│       │   └── detail.ejs      # 商品詳細
│       ├── cart/
│       │   └── index.ejs       # カート画面
│       ├── orders/
│       │   ├── index.ejs       # 注文履歴
│       │   └── detail.ejs      # 注文詳細
│       ├── auth/
│       │   ├── login.ejs       # ログイン
│       │   └── register.ejs    # 会員登録
│       └── error.ejs           # エラーページ
│
├── public/                     # 静的ファイル
│   ├── styles/                 # CSS（アトミックデザイン対応）
│   │   ├── main.css            # メインCSS
│   │   ├── atoms/              # 原子レベルCSS
│   │   │   ├── button.css
│   │   │   ├── input.css
│   │   │   └── typography.css
│   │   ├── molecules/          # 分子レベルCSS
│   │   │   ├── product-card.css
│   │   │   └── search-form.css
│   │   ├── organisms/          # 有機体レベルCSS
│   │   │   ├── header.css
│   │   │   └── footer.css
│   │   └── variables.css       # CSS Variables
│   │
│   ├── scripts/                # JavaScript
│   │   ├── main.js             # メインJS
│   │   ├── components/         # コンポーネントJS
│   │   │   ├── ProductCard.js
│   │   │   ├── CartButton.js
│   │   │   └── SearchForm.js
│   │   └── utils/              # ユーティリティJS
│   │       ├── api.js
│   │       └── helpers.js
│   │
│   └── images/                 # 画像ファイル
│       ├── products/
│       └── icons/
│
├── tests/                      # テストファイル
│   ├── unit/                   # ユニットテスト
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   └── valueobjects/
│   │   ├── application/
│   │   │   └── usecases/
│   │   └── infrastructure/
│   │       └── repositories/
│   ├── integration/            # 統合テスト
│   │   ├── api/
│   │   └── database/
│   └── fixtures/               # テストデータ
│       ├── products.json
│       └── users.json
│
├── prisma/                     # Prisma設定
│   ├── schema.prisma           # スキーマ定義
│   ├── migrations/             # マイグレーション
│   └── seeds/                  # 初期データ
│       └── sample-data.js
│
├── docs/                       # ドキュメント
│   ├── architecture.md         # アーキテクチャ説明
│   ├── atomic-design.md        # アトミックデザイン説明
│   └── api.md                  # API仕様
│
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

### 7.2 学習ポイント別ディレクトリ説明

#### 7.2.1 クリーンアーキテクチャの体感
- **依存関係の方向**: `domain` → `application` → `infrastructure` → `presentation`
- **インターフェース分離**: `domain/repositories/` に抽象化、`infrastructure/repositories/` に実装
- **テスタビリティ**: 各層を独立してテスト可能

#### 7.2.2 アトミックデザインの実践
- **段階的組み立て**: Atoms → Molecules → Organisms → Templates → Pages
- **再利用性**: 小さなコンポーネントの組み合わせ
- **保守性**: 変更の影響範囲の局所化

---

## 8. 5段階学習フェーズ

### 8.1 フェーズ1: 基盤設計（1週間）
**学習目標**: クリーンアーキテクチャの土台構築

#### 実装項目
- [x] プロジェクト構造設定
- [x] SQLiteデータベース設計
- [x] Prismaスキーマ定義
- [x] 基本エンティティ実装（Product、User）
- [x] リポジトリインターフェース定義
- [x] エラーハンドリング基盤

#### 学習ポイント
- **依存関係逆転**: インターフェースと実装の分離
- **エンティティ設計**: ビジネスルールを持つドメインオブジェクト
- **値オブジェクト**: 不変性と等価性の理解
- **リポジトリパターン**: データアクセスの抽象化

#### 理解度確認
```javascript
// 正しい依存関係になっているか確認
// Domain → Application → Infrastructure → Presentation

// ✅ 正しい例
class ProductUseCase {
  constructor(productRepository) { // インターフェースに依存
    this.productRepository = productRepository;
  }
}

// ❌ 間違い例
class ProductUseCase {
  constructor() {
    this.productRepository = new PrismaProductRepository(); // 具象に依存
  }
}
```

### 8.2 フェーズ2: 商品表示機能（1週間）
**学習目標**: ドメイン層とプレゼンテーション層の連携

#### 実装項目
- [x] Product関連UseCase実装
- [x] アトミックデザイン基盤コンポーネント作成
- [x] 商品一覧ページ実装
- [x] 商品詳細ページ実装
- [x] 検索・フィルタ機能実装
- [x] ページネーション実装

#### 学習ポイント
- **UseCase設計**: ビジネスフローの表現
- **アトミックデザイン**: Atoms→Molecules→Organismsの段階的構築
- **テンプレートエンジン**: EJSによるサーバーサイドレンダリング
- **CSS Variables**: 再利用可能なスタイル設計

#### 理解度確認
```javascript
// アトミックデザインの階層が正しくできているか
// Atoms: button.ejs, input.ejs
// Molecules: product-card.ejs (ButtonとImageの組み合わせ)
// Organisms: product-grid.ejs (複数のMoleculesの組み合わせ)
```

### 8.3 フェーズ3: カート機能（1週間）
**学習目標**: 状態管理とセッション処理

#### 実装項目
- [x] Cart Entity実装
- [x] セッション管理実装
- [x] カートUIコンポーネント実装
- [x] 在庫管理ビジネスロジック実装
- [x] カート→注文変換機能

#### 学習ポイント
- **セッション管理**: ステートフルなWebアプリケーション
- **ビジネスルール**: 在庫チェック、価格計算
- **トランザクション**: データ整合性の保証
- **JavaScript連携**: サーバーサイドとクライアントサイドの協調

#### 理解度確認
```javascript
// セッション管理が正しく実装されているか
// 1. カート追加時にセッションに保存
// 2. ページ再読み込み時にセッションから復元
// 3. 在庫不足時の適切なエラーハンドリング
```

### 8.4 フェーズ4: 注文・ユーザー管理（1週間）
**学習目標**: 複雑なビジネスフロー実装

#### 実装項目
- [x] Order Entity実装
- [x] User Entity実装
- [x] 認証システム実装
- [x] 注文プロセス実装
- [x] ユーザーページ実装
- [x] 注文履歴機能

#### 学習ポイント
- **認証・認可**: セキュリティの基本概念
- **複雑なトランザクション**: 注文作成時の複数テーブル更新
- **ワークフロー管理**: 注文ステータスの遷移
- **データ整合性**: 在庫減少と注文作成の同期

#### 理解度確認
```javascript
// 注文作成のトランザクションが正しく実装されているか
// 1. 在庫チェック
// 2. 注文作成
// 3. 在庫減少
// 4. カート削除
// すべてが成功するか、すべてが失敗するか（All or Nothing）
```

### 8.5 フェーズ5: テスト・最適化（1週間）
**学習目標**: テスト戦略と品質保証

#### 実装項目
- [x] ユニットテスト実装
- [x] 統合テスト実装
- [x] パフォーマンス最適化
- [x] エラーハンドリング強化
- [x] セキュリティ強化

#### 学習ポイント
- **テストピラミッド**: Unit > Integration > E2E
- **モックとスタブ**: 依存関係の分離
- **パフォーマンス計測**: ボトルネックの特定
- **セキュリティ**: 基本的な脆弱性対策

#### 理解度確認
```javascript
// テストが各層で適切に書けているか
// Domain Layer: エンティティのビジネスルールテスト
// Application Layer: UseCaseのフローテスト
// Infrastructure Layer: リポジトリの実装テスト
// Presentation Layer: APIエンドポイントのテスト
```

---

## 9. 学習効果とキャリア価値

### 9.1 習得できるスキル体系

#### 9.1.1 アーキテクチャ設計スキル
**クリーンアーキテクチャの実践**
- **依存関係逆転の原則**: 抽象に依存し、具象に依存しない設計
- **単一責任の原則**: 各クラスが一つの責任のみを持つ設計
- **テスタブル設計**: モックやスタブを活用した単体テスト設計
- **関心の分離**: ビジネスロジックとインフラの明確な分離

**実務応用性**
- マイクロサービス設計の基礎理解
- レガシーシステムのリファクタリング手法
- 大規模システムの保守性向上

#### 9.1.2 UI設計・フロントエンド技術
**アトミックデザインの実践**
- **段階的コンポーネント設計**: 小さな部品からの組み立て手法
- **再利用性の追求**: DRYな UI コンポーネント設計
- **デザインシステム構築**: 一貫性のある UI ライブラリ設計
- **CSS設計手法**: BEM、OOCSS等の実践的な CSS 設計

**実務応用性**
- React、Vue等のモダンフレームワークへの応用
- デザイナーとの協業におけるコンポーネント思考
- 大規模フロントエンド開発での保守性確保

#### 9.1.3 データベース設計・SQLスキル
**正規化とパフォーマンス最適化**
- **リレーショナル設計**: 適切な正規化レベルの選択
- **インデックス戦略**: クエリパフォーマンスの最適化
- **トランザクション設計**: データ整合性の保証手法
- **Prisma ORM活用**: モダンなデータアクセス手法

**実務応用性**
- PostgreSQL、MySQL等への知識転用
- 大規模データベースの設計・運用
- NoSQLデータベースとの使い分け理解

### 9.2 技術トレンドとの関連性

#### 9.2.1 現代的開発手法との親和性
**DDD（ドメイン駆動設計）**
- エンティティ・値オブジェクトの実践的理解
- ドメインサービスとアプリケーションサービスの使い分け
- ビジネスルールの表現手法

**TDD（テスト駆動開発）**
- レッド・グリーン・リファクタのサイクル実践
- モックオブジェクトを活用したテスト設計
- テストファーストの開発フロー習得

#### 9.2.2 モダンフレームワークへの展開
**React/Next.js での応用**
- アトミックデザインによるコンポーネント設計
- カスタムフックでのビジネスロジック分離
- Context API でのステート管理

**Vue.js での応用**
- Composition API での関心の分離
- Pinia でのストア設計
- コンポーザブル関数の活用

### 9.3 キャリア開発における価値

#### 9.3.1 エンジニアレベル別の効果

**ジュニアエンジニア**
- 基礎的な設計原則の理解
- 読みやすく保守しやすいコードの書き方
- チーム開発でのコード品質向上

**ミドルエンジニア**
- アーキテクチャ設計の意思決定能力
- テクニカルリードとしての技術選択力
- レガシーコード改善の実践的手法

**シニアエンジニア**
- システム全体の設計思想の統一
- チームメンバーへの技術指導・レビュー能力
- ビジネス要件のアーキテクチャへの落とし込み

#### 9.3.2 転職市場での競争優位性
**求められるスキルセット**
- モダンな設計手法の実践経験
- フロントエンド・バックエンドの両方での設計経験
- テスト設計の実践的な知識

**具体的なアピールポイント**
- 「クリーンアーキテクチャを用いた保守性の高いシステム設計経験」
- 「アトミックデザインによる再利用可能なコンポーネント設計経験」
- 「テスト駆動開発による品質保証の実践経験」

### 9.4 学習継続のロードマップ

#### 9.4.1 発展学習の方向性
**技術深化**
- マイクロサービスアーキテクチャの学習
- イベント駆動アーキテクチャの実践
- CQRS（Command Query Responsibility Segregation）の導入

**スケーラビリティ**
- Redis、Elasticsearch等の NoSQL データベース活用
- CDN、ロードバランサー等のインフラ構成
- CI/CD パイプラインの構築

#### 9.4.2 関連技術の習得推奨順序
1. **TypeScript**: 型安全性の強化
2. **Docker**: コンテナ化による環境統一
3. **GraphQL**: APIの柔軟性向上
4. **AWS/GCP**: クラウドインフラの活用
5. **Kubernetes**: コンテナオーケストレーション

---

## 10. まとめ

このECサイト学習プロジェクトは、**クリーンアーキテクチャとアトミックデザインの実践的習得**に特化した教材として設計されています。複雑な技術スタックを排除し、本質的な設計原則と実装手法に集中することで、深い理解と実践的なスキルを効率的に習得できます。

### 10.1 プロジェクトの特徴
- **学習重視の技術選択**: Express.js + EJS + SQLite によるシンプル構成
- **段階的理解促進**: 5週間の体系的な学習フェーズ
- **実感しやすい設計**: 複雑さを排除した本質的な学習体験
- **実用的スキル**: 実務で即活用できる設計手法の習得

### 10.2 期待される学習成果
**技術的成果**
- クリーンアーキテクチャの 4 層設計の完全理解
- アトミックデザインによる体系的な UI コンポーネント設計
- テスト駆動開発による品質保証の実践手法
- データベース設計とトランザクション処理の理解

**キャリア的成果**
- モダンな設計手法の実践経験による市場価値向上
- チーム開発での技術リーダーシップ能力の向上
- レガシーシステム改善の実践的なアプローチ習得
- エンジニアとしての技術的な意思決定能力の向上

### 10.3 継続的な成長への基盤
このプロジェクトで習得した設計原則と実装手法は、技術トレンドの変化に左右されない普遍的な価値を持ちます。React、Vue、Angular 等のモダンフレームワークや、マイクロサービス、クラウドネイティブ等の新しいアーキテクチャパターンにも応用可能な、強固な技術基盤を構築できます。

**継続学習のすすめ**
- 習得した設計原則を他の技術スタックで実践
- より大規模なシステムでのアーキテクチャ設計に挑戦
- チームメンバーへの技術指導やレビューでの知識共有
- オープンソースプロジェクトでの実践的な貢献

このプロジェクトを通じて身につけた **設計思考** と **実装力** は、エンジニアとしてのキャリアを通じて価値を発揮し続ける、貴重な財産となるでしょう。
