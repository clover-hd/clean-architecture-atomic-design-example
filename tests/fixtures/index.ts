/**
 * テストフィクスチャーシステム
 * 一貫性のあるテストデータ管理とシード機能
 */

import {
  User,
  Product,
  Cart,
  CartItem,
  Order,
  OrderItem
} from '../../src/domain/entities';
import {
  UserId,
  Email,
  Price,
  ProductId,
  OrderId,
  Quantity,
  ProductCategory,
  OrderStatus
} from '../../src/domain/value-objects';
import { TestDatabase } from '../helpers/TestDatabase';

export interface FixtureData {
  users: User[];
  products: Product[];
  cartItems: CartItem[];
  orders: Order[];
  orderItems: OrderItem[];
}

export class TestFixtures {
  private static instance: TestFixtures;
  private fixtures: FixtureData;

  private constructor() {
    this.fixtures = this.createFixtures();
  }

  public static getInstance(): TestFixtures {
    if (!TestFixtures.instance) {
      TestFixtures.instance = new TestFixtures();
    }
    return TestFixtures.instance;
  }

  /**
   * 標準的なテストフィクスチャーデータを作成
   */
  private createFixtures(): FixtureData {
    // ユーザーデータ
    const users: User[] = [
      User.create(
        UserId.create(1),
        Email.create('john.doe@example.com'),
        'John',
        'Doe',
        '555-0101'
      ),
      User.create(
        UserId.create(2),
        Email.create('jane.smith@example.com'),
        'Jane',
        'Smith',
        '555-0102'
      ),
      User.create(
        UserId.create(3),
        Email.create('admin@example.com'),
        'Admin',
        'User',
        '555-0100'
      ).promoteToAdmin(),
      User.create(
        UserId.create(4),
        Email.create('bob.wilson@example.com'),
        'Bob',
        'Wilson'
        // 電話番号なし
      ),
      User.create(
        UserId.create(5),
        Email.create('alice.johnson@example.com'),
        'Alice',
        'Johnson',
        '555-0105'
      )
    ];

    // 商品データ
    const products: Product[] = [
      Product.create(
        ProductId.create(1),
        'MacBook Pro 16"',
        Price.create(299800),
        Quantity.create(10),
        ProductCategory.create('electronics'),
        'Apple MacBook Pro 16インチ M2 Pro'
      ),
      Product.create(
        ProductId.create(2),
        'iPhone 15 Pro',
        Price.create(159800),
        Quantity.create(25),
        ProductCategory.create('electronics'),
        'Apple iPhone 15 Pro 128GB'
      ),
      Product.create(
        ProductId.create(3),
        'プログラミング入門書',
        Price.create(3200),
        Quantity.create(50),
        ProductCategory.create('books'),
        'TypeScriptとReactで学ぶプログラミング'
      ),
      Product.create(
        ProductId.create(4),
        'オーガニックTシャツ',
        Price.create(2800),
        Quantity.create(30),
        ProductCategory.create('fashion'),
        '100%オーガニックコットンTシャツ'
      ),
      Product.create(
        ProductId.create(5),
        'ワイヤレスイヤホン',
        Price.create(25000),
        Quantity.create(0), // 在庫切れ商品
        ProductCategory.create('electronics'),
        'ノイズキャンセリング対応'
      ).deactivate(), // 非アクティブ商品
      Product.create(
        ProductId.create(6),
        'コーヒー豆',
        Price.create(1200),
        Quantity.create(100),
        ProductCategory.create('food'),
        'エチオピア産スペシャリティコーヒー'
      )
    ];

    // カート項目データ
    const cartItems: CartItem[] = [
      CartItem.create(1, 'session_john', ProductId.create(1), Quantity.create(1)),
      CartItem.create(2, 'session_john', ProductId.create(3), Quantity.create(2)),
      CartItem.create(3, 'session_jane', ProductId.create(2), Quantity.create(1)),
      CartItem.create(4, 'session_jane', ProductId.create(4), Quantity.create(3)),
      CartItem.create(5, 'session_guest', ProductId.create(6), Quantity.create(5))
    ];

    // 注文データ
    const orders: Order[] = [
      Order.create(
        OrderId.create(1),
        UserId.create(1),
        OrderStatus.create('delivered'),
        Price.create(306200) // MacBook + 書籍2冊
      ),
      Order.create(
        OrderId.create(2),
        UserId.create(2),
        OrderStatus.create('shipped'),
        Price.create(168200) // iPhone + Tシャツ3枚
      ),
      Order.create(
        OrderId.create(3),
        UserId.create(1),
        OrderStatus.create('pending'),
        Price.create(6000) // コーヒー豆5袋
      ),
      Order.create(
        OrderId.create(4),
        UserId.create(4),
        OrderStatus.create('cancelled'),
        Price.create(25000) // ワイヤレスイヤホン（キャンセル済み）
      )
    ];

    // 注文項目データ
    const orderItems: OrderItem[] = [
      // 注文1の項目
      OrderItem.create(1, OrderId.create(1), ProductId.create(1), Quantity.create(1), Price.create(299800)),
      OrderItem.create(2, OrderId.create(1), ProductId.create(3), Quantity.create(2), Price.create(3200)),

      // 注文2の項目
      OrderItem.create(3, OrderId.create(2), ProductId.create(2), Quantity.create(1), Price.create(159800)),
      OrderItem.create(4, OrderId.create(2), ProductId.create(4), Quantity.create(3), Price.create(2800)),

      // 注文3の項目
      OrderItem.create(5, OrderId.create(3), ProductId.create(6), Quantity.create(5), Price.create(1200)),

      // 注文4の項目（キャンセル済み）
      OrderItem.create(6, OrderId.create(4), ProductId.create(5), Quantity.create(1), Price.create(25000))
    ];

    return {
      users,
      products,
      cartItems,
      orders,
      orderItems
    };
  }

  /**
   * フィクスチャーデータを取得
   */
  public getFixtures(): FixtureData {
    return this.fixtures;
  }

  /**
   * 特定のユーザーを取得
   */
  public getUser(email: string): User | undefined {
    return this.fixtures.users.find(user => user.email.value === email);
  }

  /**
   * 特定の商品を取得
   */
  public getProduct(name: string): Product | undefined {
    return this.fixtures.products.find(product => product.name === name);
  }

  /**
   * 管理者ユーザーを取得
   */
  public getAdminUser(): User {
    const admin = this.fixtures.users.find(user => user.isAdmin);
    if (!admin) {
      throw new Error('Admin user not found in fixtures');
    }
    return admin;
  }

  /**
   * 一般ユーザーを取得
   */
  public getRegularUsers(): User[] {
    return this.fixtures.users.filter(user => !user.isAdmin);
  }

  /**
   * アクティブな商品を取得
   */
  public getActiveProducts(): Product[] {
    return this.fixtures.products.filter(product => product.isActive);
  }

  /**
   * 在庫ありの商品を取得
   */
  public getInStockProducts(): Product[] {
    return this.fixtures.products.filter(product =>
      product.isAvailableForSale()
    );
  }

  /**
   * 特定カテゴリの商品を取得
   */
  public getProductsByCategory(category: string): Product[] {
    return this.fixtures.products.filter(product =>
      product.category.value === category
    );
  }

  /**
   * 特定ユーザーの注文を取得
   */
  public getOrdersByUser(userId: number): Order[] {
    return this.fixtures.orders.filter(order => order.userId.value === userId);
  }

  /**
   * 特定ステータスの注文を取得
   */
  public getOrdersByStatus(status: string): Order[] {
    return this.fixtures.orders.filter(order => order.status.value === status);
  }

  /**
   * セッション別のカート項目を取得
   */
  public getCartItemsBySession(sessionId: string): CartItem[] {
    return this.fixtures.cartItems.filter(item => item.sessionId === sessionId);
  }

  /**
   * データベースにフィクスチャーデータをシード
   */
  public async seedDatabase(testDb: TestDatabase): Promise<void> {
    try {
      await testDb.withTransaction(async () => {
        // ユーザーデータの挿入
        for (const user of this.fixtures.users) {
          await testDb.execute(
            'INSERT INTO users (id, email, first_name, last_name, phone, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              user.id.value,
              user.email.value,
              user.firstName,
              user.lastName,
              user.phone || null,
              user.isAdmin ? 1 : 0,
              new Date().toISOString(),
              new Date().toISOString()
            ]
          );
        }

        // 商品データの挿入
        for (const product of this.fixtures.products) {
          await testDb.execute(
            'INSERT INTO products (id, name, description, price, stock, category, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              product.id.value,
              product.name,
              product.description || null,
              product.price.value,
              product.stock.value,
              product.category.value,
              product.isActive ? 1 : 0,
              new Date().toISOString(),
              new Date().toISOString()
            ]
          );
        }

        // カート項目データの挿入
        for (const cartItem of this.fixtures.cartItems) {
          await testDb.execute(
            'INSERT INTO cart_items (id, session_id, product_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [
              cartItem.id,
              cartItem.sessionId,
              cartItem.productId.value,
              cartItem.quantity.value,
              new Date().toISOString(),
              new Date().toISOString()
            ]
          );
        }

        // 注文データの挿入
        for (const order of this.fixtures.orders) {
          await testDb.execute(
            'INSERT INTO orders (id, user_id, status, total_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [
              order.id.value,
              order.userId.value,
              order.status.value,
              order.totalAmount.value,
              new Date().toISOString(),
              new Date().toISOString()
            ]
          );
        }

        // 注文項目データの挿入
        for (const orderItem of this.fixtures.orderItems) {
          await testDb.execute(
            'INSERT INTO order_items (id, order_id, product_id, quantity, price, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [
              orderItem.id,
              orderItem.orderId.value,
              orderItem.productId.value,
              orderItem.quantity.value,
              orderItem.price.value,
              new Date().toISOString()
            ]
          );
        }
      });
    } catch (error) {
      console.error('Failed to seed database:', error);
      throw error;
    }
  }

  /**
   * テスト用の最小限データセット
   */
  public getMinimalDataset(): Partial<FixtureData> {
    return {
      users: [this.fixtures.users[0], this.fixtures.users[2]], // 一般ユーザー1人 + 管理者
      products: [this.fixtures.products[0], this.fixtures.products[2]], // 商品2つ
    };
  }

  /**
   * E2Eテスト用の完全データセット
   */
  public getCompleteDataset(): FixtureData {
    return this.fixtures;
  }

  /**
   * パフォーマンステスト用の大量データ生成
   */
  public generateLargeDataset(userCount: number, productCount: number): FixtureData {
    const users: User[] = [];
    const products: Product[] = [];

    // 大量ユーザー生成
    for (let i = 1; i <= userCount; i++) {
      users.push(User.create(
        UserId.create(i),
        Email.create(`user${i}@example.com`),
        `User`,
        `${i}`,
        i % 2 === 0 ? `555-${String(i).padStart(4, '0')}` : undefined
      ));
    }

    // 大量商品生成
    const categories = ['electronics', 'books', 'fashion', 'food'];
    for (let i = 1; i <= productCount; i++) {
      products.push(Product.create(
        ProductId.create(i),
        `Product ${i}`,
        Price.create(1000 + (i * 100)),
        Quantity.create(Math.floor(Math.random() * 100) + 1),
        ProductCategory.create(categories[i % categories.length]),
        `Description for product ${i}`
      ));
    }

    return {
      users,
      products,
      cartItems: [],
      orders: [],
      orderItems: []
    };
  }

  /**
   * 特定シナリオ用のカスタムデータセット
   */
  public createScenarioDataset(scenario: 'empty_cart' | 'full_cart' | 'checkout_ready' | 'order_history'): FixtureData {
    const baseUsers = [this.fixtures.users[0]]; // John Doe
    const baseProducts = this.fixtures.products.slice(0, 3); // 最初の3商品

    switch (scenario) {
      case 'empty_cart':
        return {
          users: baseUsers,
          products: baseProducts,
          cartItems: [],
          orders: [],
          orderItems: []
        };

      case 'full_cart':
        return {
          users: baseUsers,
          products: baseProducts,
          cartItems: this.fixtures.cartItems.filter(item => item.sessionId === 'session_john'),
          orders: [],
          orderItems: []
        };

      case 'checkout_ready':
        return {
          users: baseUsers,
          products: baseProducts,
          cartItems: this.fixtures.cartItems.filter(item => item.sessionId === 'session_john'),
          orders: [],
          orderItems: []
        };

      case 'order_history':
        return {
          users: baseUsers,
          products: baseProducts,
          cartItems: [],
          orders: this.fixtures.orders.filter(order => order.userId.value === 1),
          orderItems: this.fixtures.orderItems.filter(item =>
            [1, 3].includes(item.orderId.value) // John Doeの注文
          )
        };

      default:
        return this.fixtures;
    }
  }
}