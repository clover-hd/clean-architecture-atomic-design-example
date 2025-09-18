# Controller Integration Guide
## EJSテンプレート統合準備事項

### 概要
アトミックデザインに基づくEJSテンプレートシステムが完成しました。Presentation層のControllerとの統合に必要な準備事項を以下に示します。

## 1. テンプレートレンダリング設定

### Express.js設定（確認項目）
```typescript
// src/infrastructure/web/app.ts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../../views'));
app.use(express.static(path.join(__dirname, '../../../public')));
```

### CSS統合設定
```html
<!-- views/partials/head.ejs に必要なCSS読み込み -->
<link rel="stylesheet" href="/css/main.css">
<link rel="stylesheet" href="/css/atoms.css">
<link rel="stylesheet" href="/css/molecules.css">
<link rel="stylesheet" href="/css/organisms.css">
<link rel="stylesheet" href="/css/templates.css">
```

## 2. Controller実装パターン

### 基本Controllerテンプレート
```typescript
export class ProductController {
  async getProductList(req: Request, res: Response): Promise<void> {
    try {
      const products = await this.productUseCase.getAllProducts();
      const page = parseInt(req.query.page as string) || 1;
      const limit = 12;

      // テンプレートに渡すデータ構造
      const templateData = {
        products: products.slice((page - 1) * limit, page * limit),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(products.length / limit),
          hasNext: page * limit < products.length,
          hasPrev: page > 1
        },
        meta: {
          title: '商品一覧',
          description: 'サンプルECサイトの商品一覧ページです。'
        }
      };

      res.render('pages/product-list', templateData);
    } catch (error) {
      res.status(500).render('pages/error', { error });
    }
  }
}
```

## 3. データ構造マッピング

### Product Entity → Template Data
```typescript
interface ProductTemplateData {
  productId: string;
  productName: string;
  productDescription: string;
  productPrice: number;
  productCurrency: string;
  productImageUrl: string;
  productImageAlt: string;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  stockCount: number;
  averageRating?: number;
  reviewCount?: number;
}

// Domain Entity から Template Data への変換
const mapProductToTemplateData = (product: Product): ProductTemplateData => ({
  productId: product.id.toString(),
  productName: product.name,
  productDescription: product.description,
  productPrice: product.price.amount,
  productCurrency: product.price.currency,
  productImageUrl: product.imageUrl || '/images/no-image.jpg',
  productImageAlt: product.name,
  stockStatus: product.stock > 10 ? 'in-stock' :
               product.stock > 0 ? 'low-stock' : 'out-of-stock',
  stockCount: product.stock
});
```

### User Authentication State
```typescript
interface UserTemplateData {
  isAuthenticated: boolean;
  user?: {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: 'admin' | 'customer';
  };
}

// Middlewareでres.localsに設定
app.use((req, res, next) => {
  res.locals.user = {
    isAuthenticated: !!req.session?.user,
    user: req.session?.user ? {
      userId: req.session.user.id,
      userName: req.session.user.name,
      userEmail: req.session.user.email,
      userRole: req.session.user.role
    } : undefined
  };
  next();
});
```

## 4. ルートとテンプレートのマッピング

### 主要ページルート
```typescript
// Public Pages
GET  /               → views/pages/home.ejs
GET  /products       → views/pages/product-list.ejs
GET  /products/:id   → views/pages/product-detail.ejs
GET  /cart          → views/pages/cart.ejs
GET  /checkout      → views/pages/checkout.ejs

// Auth Pages
GET  /login         → views/pages/auth/login.ejs
GET  /register      → views/pages/auth/register.ejs
GET  /profile       → views/pages/profile.ejs

// Admin Pages (requires admin auth)
GET  /admin         → views/pages/admin/dashboard.ejs
GET  /admin/products → views/pages/admin/product-management.ejs
GET  /admin/orders  → views/pages/admin/order-management.ejs
```

### エラーハンドリング
```typescript
// Error Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = (err as any).statusCode || 500;
  const templateData = {
    error: {
      message: err.message,
      statusCode,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  };

  res.status(statusCode).render('pages/error', templateData);
});
```

## 5. フォーム処理とバリデーション

### Login Form処理例
```typescript
async login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // バリデーション実行
    const validation = await this.validator.validate({ email, password });

    if (!validation.isValid) {
      // バリデーションエラー時は元のページに戻す
      return res.render('pages/auth/login', {
        errors: validation.errors,
        formData: { email }, // パスワードは再送信しない
        meta: { title: 'ログイン' }
      });
    }

    const authResult = await this.authUseCase.authenticate(email, password);

    if (authResult.success) {
      req.session.user = authResult.user;
      res.redirect('/');
    } else {
      res.render('pages/auth/login', {
        errors: [{ field: 'general', message: 'ログインに失敗しました。' }],
        formData: { email },
        meta: { title: 'ログイン' }
      });
    }
  } catch (error) {
    res.status(500).render('pages/error', { error });
  }
}
```

### Product Search処理例
```typescript
async searchProducts(req: Request, res: Response): Promise<void> {
  const { q: query, category, sort, page = 1 } = req.query;

  const searchParams = {
    query: query as string,
    category: category as string,
    sortBy: sort as string,
    page: parseInt(page as string),
    limit: 12
  };

  const result = await this.productUseCase.searchProducts(searchParams);

  const templateData = {
    products: result.products.map(mapProductToTemplateData),
    searchQuery: query,
    selectedCategory: category,
    selectedSort: sort,
    pagination: {
      currentPage: result.page,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrev: result.hasPrev
    },
    categories: await this.categoryUseCase.getAllCategories(),
    meta: {
      title: `検索結果: ${query || 'すべて'}`,
      description: `${query}の検索結果を表示しています。`
    }
  };

  res.render('pages/product-list', templateData);
}
```

## 6. セキュリティ設定

### CSRF保護
```typescript
// CSRFトークンをすべてのフォームで利用可能に
app.use(csrf());
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
```

### 認証Middleware
```typescript
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return res.redirect('/login');
  }
  next();
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).render('pages/error', {
      error: { message: 'アクセスが拒否されました。', statusCode: 403 }
    });
  }
  next();
};
```

## 7. パフォーマンス最適化

### テンプレートキャッシュ設定
```typescript
// Production環境でのみキャッシュを有効化
if (process.env.NODE_ENV === 'production') {
  app.set('view cache', true);
}
```

### 静的ファイル配信最適化
```typescript
app.use('/css', express.static(path.join(__dirname, '../../../public/css'), {
  maxAge: '1y',
  etag: false
}));

app.use('/js', express.static(path.join(__dirname, '../../../public/js'), {
  maxAge: '1y',
  etag: false
}));

app.use('/images', express.static(path.join(__dirname, '../../../public/images'), {
  maxAge: '30d'
}));
```

## 8. 必要なController実装

### 実装が必要なController一覧
```typescript
// 1. HomeController
export class HomeController {
  async getHome(req: Request, res: Response): Promise<void>;
}

// 2. ProductController
export class ProductController {
  async getProductList(req: Request, res: Response): Promise<void>;
  async getProductDetail(req: Request, res: Response): Promise<void>;
  async searchProducts(req: Request, res: Response): Promise<void>;
}

// 3. AuthController
export class AuthController {
  async getLogin(req: Request, res: Response): Promise<void>;
  async postLogin(req: Request, res: Response): Promise<void>;
  async getRegister(req: Request, res: Response): Promise<void>;
  async postRegister(req: Request, res: Response): Promise<void>;
  async logout(req: Request, res: Response): Promise<void>;
}

// 4. CartController
export class CartController {
  async getCart(req: Request, res: Response): Promise<void>;
  async addToCart(req: Request, res: Response): Promise<void>;
  async updateCartItem(req: Request, res: Response): Promise<void>;
  async removeFromCart(req: Request, res: Response): Promise<void>;
}

// 5. CheckoutController
export class CheckoutController {
  async getCheckout(req: Request, res: Response): Promise<void>;
  async processCheckout(req: Request, res: Response): Promise<void>;
}

// 6. ProfileController
export class ProfileController {
  async getProfile(req: Request, res: Response): Promise<void>;
  async updateProfile(req: Request, res: Response): Promise<void>;
}

// 7. AdminController (Admin用)
export class AdminController {
  async getDashboard(req: Request, res: Response): Promise<void>;
  async getProductManagement(req: Request, res: Response): Promise<void>;
  async getOrderManagement(req: Request, res: Response): Promise<void>;
}
```

## 9. フラッシュメッセージ処理

### Connect-flash設定
```typescript
import flash from 'connect-flash';

app.use(flash());

// フラッシュメッセージをテンプレートで利用可能に
app.use((req, res, next) => {
  res.locals.flashMessages = {
    success: req.flash('success'),
    error: req.flash('error'),
    warning: req.flash('warning'),
    info: req.flash('info')
  };
  next();
});

// Controller内での使用例
req.flash('success', '商品をカートに追加しました。');
res.redirect('/cart');
```

## 10. テスト準備

### Controllerテスト例
```typescript
describe('ProductController', () => {
  let controller: ProductController;
  let mockProductUseCase: jest.Mocked<ProductUseCase>;

  beforeEach(() => {
    mockProductUseCase = {
      getAllProducts: jest.fn(),
      getProductById: jest.fn()
    };
    controller = new ProductController(mockProductUseCase);
  });

  describe('getProductList', () => {
    it('should render product list page with products', async () => {
      const mockProducts = [/* mock data */];
      mockProductUseCase.getAllProducts.mockResolvedValue(mockProducts);

      const req = { query: { page: '1' } } as Request;
      const res = { render: jest.fn() } as unknown as Response;

      await controller.getProductList(req, res);

      expect(res.render).toHaveBeenCalledWith('pages/product-list',
        expect.objectContaining({
          products: expect.any(Array),
          pagination: expect.any(Object)
        })
      );
    });
  });
});
```

## 11. 次のステップ

1. **Controller実装**: 上記パターンに従ってControllerを実装
2. **ルーティング設定**: Express Routerでルートを定義
3. **ミドルウェア統合**: 認証、CSRF、セッション処理を追加
4. **エラーハンドリング**: グローバルエラーハンドラーを実装
5. **テスト実装**: Controllerとテンプレートの統合テストを作成
6. **パフォーマンステスト**: レンダリング速度とメモリ使用量を確認

## 備考

- すべてのテンプレートはTypeScript型安全性を考慮した設計
- BEM記法によるCSS設計により、スタイルの競合リスクを最小化
- アトミックデザインによる再利用可能なコンポーネント構造
- レスポンシブデザインとアクセシビリティ対応済み
- 実装完了後は統合テストで動作確認を推奨