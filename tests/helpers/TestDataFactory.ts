/**
 * テストデータファクトリー
 * テストで使用するエンティティとバリューオブジェクトを生成
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

export interface UserTestData {
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isAdmin?: boolean;
}

export interface ProductTestData {
  id?: number;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  isActive?: boolean;
}

export interface CartItemTestData {
  id?: number;
  sessionId?: string;
  productId?: number;
  quantity?: number;
}

export interface OrderTestData {
  id?: number;
  userId?: number;
  status?: string;
  totalAmount?: number;
}

export class TestDataFactory {
  private static counter = 1;

  /**
   * 一意のIDを生成
   */
  private static getNextId(): number {
    return this.counter++;
  }

  /**
   * カウンターをリセット
   */
  public static resetCounter(): void {
    this.counter = 1;
  }

  /**
   * テスト用ユーザーエンティティを作成
   */
  public static createUser(data: UserTestData = {}): User {
    const userId = UserId.create(data.id || this.getNextId());
    const email = Email.create(data.email || `test${userId.value}@example.com`);

    const user = User.create(
      userId,
      email,
      data.firstName || 'Test',
      data.lastName || 'User',
      data.phone
    );

    if (data.isAdmin) {
      return user.promoteToAdmin();
    }

    return user;
  }

  /**
   * 管理者ユーザーを作成
   */
  public static createAdminUser(data: UserTestData = {}): User {
    return this.createUser({ ...data, isAdmin: true });
  }

  /**
   * テスト用商品エンティティを作成
   */
  public static createProduct(data: ProductTestData = {}): Product {
    const productId = ProductId.create(data.id || this.getNextId());
    const price = Price.create(data.price || 1000);
    const stock = Quantity.create(data.stock || 10);
    const category = ProductCategory.create(data.category || 'electronics');

    const product = Product.create(
      productId,
      data.name || `Test Product ${productId.value}`,
      price,
      stock,
      category,
      data.description
    );

    if (data.isActive === false) {
      return product.deactivate();
    }

    return product;
  }

  /**
   * 在庫切れ商品を作成
   */
  public static createOutOfStockProduct(data: ProductTestData = {}): Product {
    return this.createProduct({ ...data, stock: 0 });
  }

  /**
   * テスト用カート項目エンティティを作成
   */
  public static createCartItem(data: CartItemTestData = {}): CartItem {
    const productId = ProductId.create(data.productId || this.getNextId());
    const quantity = Quantity.create(data.quantity || 1);

    return CartItem.create(
      data.id || this.getNextId(),
      data.sessionId || 'test-session',
      productId,
      quantity
    );
  }

  /**
   * テスト用カートエンティティを作成
   */
  public static createCart(sessionId: string = 'test-session', items: CartItem[] = []): Cart {
    let cart = Cart.create(sessionId);

    for (const item of items) {
      cart = cart.addItem(item);
    }

    return cart;
  }

  /**
   * テスト用注文エンティティを作成
   */
  public static createOrder(data: OrderTestData = {}): Order {
    const orderId = OrderId.create(data.id || this.getNextId());
    const userId = UserId.create(data.userId || this.getNextId());
    const status = OrderStatus.create(data.status || 'pending');
    const totalAmount = Price.create(data.totalAmount || 1000);

    return Order.create(orderId, userId, status, totalAmount);
  }

  /**
   * テスト用注文項目エンティティを作成
   */
  public static createOrderItem(
    orderId: number = this.getNextId(),
    productId: number = this.getNextId(),
    quantity: number = 1,
    price: number = 1000
  ): OrderItem {
    return OrderItem.create(
      this.getNextId(),
      OrderId.create(orderId),
      ProductId.create(productId),
      Quantity.create(quantity),
      Price.create(price)
    );
  }

  /**
   * バリューオブジェクトのテストデータを作成
   */
  public static createValueObjects() {
    return {
      userId: UserId.create(this.getNextId()),
      email: Email.create(`test${this.getNextId()}@example.com`),
      price: Price.create(1000),
      productId: ProductId.create(this.getNextId()),
      orderId: OrderId.create(this.getNextId()),
      quantity: Quantity.create(5),
      category: ProductCategory.create('electronics'),
      orderStatus: OrderStatus.create('pending')
    };
  }

  /**
   * 複数のユーザーを作成
   */
  public static createUsers(count: number, data: UserTestData = {}): User[] {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      users.push(this.createUser({
        ...data,
        email: data.email || `test${this.getNextId()}@example.com`
      }));
    }
    return users;
  }

  /**
   * 複数の商品を作成
   */
  public static createProducts(count: number, data: ProductTestData = {}): Product[] {
    const products: Product[] = [];
    for (let i = 0; i < count; i++) {
      products.push(this.createProduct({
        ...data,
        name: data.name || `Test Product ${this.getNextId()}`
      }));
    }
    return products;
  }

  /**
   * 複数のカート項目を作成
   */
  public static createCartItems(count: number, sessionId: string = 'test-session'): CartItem[] {
    const items: CartItem[] = [];
    for (let i = 0; i < count; i++) {
      items.push(this.createCartItem({
        sessionId,
        productId: this.getNextId(),
        quantity: i + 1
      }));
    }
    return items;
  }

  /**
   * エンドツーエンドテスト用の完全なデータセットを作成
   */
  public static createCompleteDataSet() {
    const users = [
      this.createUser({ email: 'user1@example.com', firstName: 'John', lastName: 'Doe' }),
      this.createUser({ email: 'user2@example.com', firstName: 'Jane', lastName: 'Smith' }),
      this.createAdminUser({ email: 'admin@example.com', firstName: 'Admin', lastName: 'User' })
    ];

    const products = [
      this.createProduct({ name: 'Laptop', price: 150000, stock: 5, category: 'electronics' }),
      this.createProduct({ name: 'Book', price: 2000, stock: 20, category: 'books' }),
      this.createProduct({ name: 'T-Shirt', price: 3000, stock: 15, category: 'fashion' }),
      this.createOutOfStockProduct({ name: 'Limited Edition', price: 10000, category: 'electronics' })
    ];

    const cartItems = [
      this.createCartItem({ sessionId: 'session1', productId: products[0].id.value, quantity: 1 }),
      this.createCartItem({ sessionId: 'session1', productId: products[1].id.value, quantity: 2 })
    ];

    const cart = this.createCart('session1', cartItems);

    const orders = [
      this.createOrder({ userId: users[0].id.value, status: 'pending', totalAmount: 152000 }),
      this.createOrder({ userId: users[1].id.value, status: 'confirmed', totalAmount: 5000 })
    ];

    return {
      users,
      products,
      cartItems,
      cart,
      orders
    };
  }

  /**
   * 無効なデータを含むテストケース用データを作成
   */
  public static createInvalidData() {
    return {
      invalidEmails: [
        '',
        'invalid-email',
        'test@',
        '@example.com',
        'test..test@example.com'
      ],
      invalidUserIds: [0, -1, 1.5, NaN],
      invalidPrices: [-1, 1.5, 10000001],
      invalidQuantities: [0, -1, 1000],
      invalidCategories: ['invalid', '', 'unknown_category'],
      invalidOrderStatuses: ['invalid', '', 'unknown_status']
    };
  }
}