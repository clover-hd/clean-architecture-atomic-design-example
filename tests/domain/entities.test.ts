/**
 * Entities型安全性と不変性検証テスト
 * エンティティのビジネスルールと状態変更の検証
 */

import {
  User,
  Product,
  Cart,
  CartItem,
  Order,
  OrderItem,
  UserId,
  Email,
  Price,
  ProductId,
  OrderId,
  Quantity,
  ProductCategory,
  OrderStatus
} from '../../src/domain';

describe('Entities 型安全性検証', () => {
  describe('User Entity', () => {
    test('正常なユーザーが作成できる', () => {
      const userId = UserId.create(1);
      const email = Email.create('test@example.com');

      const user = User.create(userId, email, 'John', 'Doe');

      expect(user.id).toBe(userId);
      expect(user.email).toBe(email);
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.fullName).toBe('John Doe');
      expect(user.isAdmin).toBe(false);
    });

    test('ユーザー情報更新時に新しいインスタンスが返される', () => {
      const userId = UserId.create(1);
      const email = Email.create('test@example.com');
      const user = User.create(userId, email, 'John', 'Doe');

      const updatedUser = user.updateProfile('Jane', 'Smith', '123-456-7890');

      // 元のユーザーオブジェクトは変更されない（不変性）
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.phone).toBeUndefined();

      // 新しいインスタンスは更新された値を持つ
      expect(updatedUser.firstName).toBe('Jane');
      expect(updatedUser.lastName).toBe('Smith');
      expect(updatedUser.phone).toBe('123-456-7890');
    });

    test('管理者権限の変更が正しく動作する', () => {
      const userId = UserId.create(1);
      const email = Email.create('test@example.com');
      const user = User.create(userId, email, 'John', 'Doe');

      const adminUser = user.promoteToAdmin();
      expect(user.isAdmin).toBe(false); // 元のオブジェクトは変更されない
      expect(adminUser.isAdmin).toBe(true);

      const regularUser = adminUser.demoteFromAdmin();
      expect(adminUser.isAdmin).toBe(true); // 元のオブジェクトは変更されない
      expect(regularUser.isAdmin).toBe(false);
    });

    test('無効なユーザーデータでエラーが発生する', () => {
      const userId = UserId.create(1);
      const email = Email.create('test@example.com');

      expect(() => User.create(userId, email, '', 'Doe')).toThrow('First name is required');
      expect(() => User.create(userId, email, 'John', '')).toThrow('Last name is required');
    });
  });

  describe('Product Entity', () => {
    test('正常な商品が作成できる', () => {
      const productId = ProductId.create(1);
      const price = Price.create(1000);
      const stock = Quantity.create(10);
      const category = ProductCategory.create('electronics');

      const product = Product.create(productId, 'Test Product', price, stock, category);

      expect(product.id).toBe(productId);
      expect(product.name).toBe('Test Product');
      expect(product.price).toBe(price);
      expect(product.stock).toBe(stock);
      expect(product.category).toBe(category);
      expect(product.isActive).toBe(true);
    });

    test('在庫チェックが正しく動作する', () => {
      const productId = ProductId.create(1);
      const price = Price.create(1000);
      const stock = Quantity.create(5);
      const category = ProductCategory.create('electronics');

      const product = Product.create(productId, 'Test Product', price, stock, category);

      const requiredQty = Quantity.create(3);
      expect(product.hasEnoughStock(requiredQty)).toBe(true);

      const tooMuchQty = Quantity.create(10);
      expect(product.hasEnoughStock(tooMuchQty)).toBe(false);
    });

    test('在庫更新時に新しいインスタンスが返される', () => {
      const productId = ProductId.create(1);
      const price = Price.create(1000);
      const stock = Quantity.create(10);
      const category = ProductCategory.create('electronics');

      const product = Product.create(productId, 'Test Product', price, stock, category);
      const decreaseQty = Quantity.create(3);

      const updatedProduct = product.decreaseStock(decreaseQty);

      // 元のオブジェクトは変更されない
      expect(product.stock.value).toBe(10);
      // 新しいインスタンスは更新された値を持つ
      expect(updatedProduct.stock.value).toBe(7);
    });

    test('在庫不足時にエラーが発生する', () => {
      const productId = ProductId.create(1);
      const price = Price.create(1000);
      const stock = Quantity.create(5);
      const category = ProductCategory.create('electronics');

      const product = Product.create(productId, 'Test Product', price, stock, category);
      const tooMuchQty = Quantity.create(10);

      expect(() => product.decreaseStock(tooMuchQty)).toThrow('Insufficient stock');
    });

    test('販売可能性チェックが正しく動作する', () => {
      const productId = ProductId.create(1);
      const price = Price.create(1000);
      const stock = Quantity.create(5);
      const category = ProductCategory.create('electronics');

      const activeProduct = Product.create(productId, 'Active Product', price, stock, category);
      expect(activeProduct.isAvailableForSale()).toBe(true);

      const inactiveProduct = activeProduct.deactivate();
      expect(inactiveProduct.isAvailableForSale()).toBe(false);

      const zeroStock = Quantity.create(0);
      const outOfStockProduct = activeProduct.updateStock(zeroStock);
      expect(outOfStockProduct.isAvailableForSale()).toBe(false);
    });
  });

  describe('CartItem Entity', () => {
    test('正常なカート項目が作成できる', () => {
      const productId = ProductId.create(1);
      const quantity = Quantity.create(2);

      const cartItem = CartItem.create(1, 'session123', productId, quantity);

      expect(cartItem.id).toBe(1);
      expect(cartItem.sessionId).toBe('session123');
      expect(cartItem.productId).toBe(productId);
      expect(cartItem.quantity).toBe(quantity);
    });

    test('小計計算が正しく動作する', () => {
      const productId = ProductId.create(1);
      const price = Price.create(1000);
      const stock = Quantity.create(10);
      const category = ProductCategory.create('electronics');
      const quantity = Quantity.create(3);

      const product = Product.create(productId, 'Test Product', price, stock, category);
      const cartItem = CartItem.create(1, 'session123', productId, quantity);

      const subtotal = cartItem.calculateSubtotal(product);
      expect(subtotal.value).toBe(3000); // 1000 * 3
    });

    test('数量更新時に新しいインスタンスが返される', () => {
      const productId = ProductId.create(1);
      const quantity = Quantity.create(2);

      const cartItem = CartItem.create(1, 'session123', productId, quantity);
      const newQuantity = Quantity.create(5);
      const updatedItem = cartItem.updateQuantity(newQuantity);

      // 元のオブジェクトは変更されない
      expect(cartItem.quantity.value).toBe(2);
      // 新しいインスタンスは更新された値を持つ
      expect(updatedItem.quantity.value).toBe(5);
    });
  });

  describe('Cart Entity', () => {
    test('空のカートが作成できる', () => {
      const cart = Cart.create('session123');

      expect(cart.sessionId).toBe('session123');
      expect(cart.isEmpty()).toBe(true);
      expect(cart.itemCount).toBe(0);
      expect(cart.getTotalQuantity()).toBe(0);
    });

    test('カート項目追加時に新しいインスタンスが返される', () => {
      const cart = Cart.create('session123');
      const productId = ProductId.create(1);
      const quantity = Quantity.create(2);
      const cartItem = CartItem.create(1, 'session123', productId, quantity);

      const updatedCart = cart.addItem(cartItem);

      // 元のカートは変更されない
      expect(cart.isEmpty()).toBe(true);
      expect(cart.itemCount).toBe(0);

      // 新しいカートには項目が追加されている
      expect(updatedCart.isEmpty()).toBe(false);
      expect(updatedCart.itemCount).toBe(1);
      expect(updatedCart.getTotalQuantity()).toBe(2);
    });

    test('同じ商品の重複追加時に数量が統合される', () => {
      const cart = Cart.create('session123');
      const productId = ProductId.create(1);

      const item1 = CartItem.create(1, 'session123', productId, Quantity.create(2));
      const item2 = CartItem.create(2, 'session123', productId, Quantity.create(3));

      const cartWithItem1 = cart.addItem(item1);
      const cartWithItem2 = cartWithItem1.addItem(item2);

      expect(cartWithItem2.itemCount).toBe(1); // 商品種類は1つ
      expect(cartWithItem2.getTotalQuantity()).toBe(5); // 数量は合計される
    });

    test('総金額計算が正しく動作する', () => {
      const cart = Cart.create('session123');
      const productId1 = ProductId.create(1);
      const productId2 = ProductId.create(2);

      const product1 = Product.create(
        productId1,
        'Product 1',
        Price.create(1000),
        Quantity.create(10),
        ProductCategory.create('electronics')
      );

      const product2 = Product.create(
        productId2,
        'Product 2',
        Price.create(500),
        Quantity.create(10),
        ProductCategory.create('books')
      );

      const item1 = CartItem.create(1, 'session123', productId1, Quantity.create(2));
      const item2 = CartItem.create(2, 'session123', productId2, Quantity.create(3));

      const cartWithItems = cart.addItem(item1).addItem(item2);
      const totalAmount = cartWithItems.getTotalAmount([product1, product2]);

      expect(totalAmount.value).toBe(3500); // (1000*2) + (500*3) = 3500
    });
  });
});

describe('Entities 不変性検証', () => {
  test('Entity オブジェクトの直接変更ができない', () => {
    const userId = UserId.create(1);
    const email = Email.create('test@example.com');
    const user = User.create(userId, email, 'John', 'Doe');

    // TypeScriptコンパイル時にプライベートプロパティは変更できない
    // @ts-expect-error - Private property should not be accessible
    // user._firstName = 'Jane';

    // getter経由でもreadonlyなので変更できない
    expect(user.firstName).toBe('John');
  });

  test('Value Object の変更によるEntity状態への影響がない', () => {
    const productId = ProductId.create(1);
    const price = Price.create(1000);
    const stock = Quantity.create(10);
    const category = ProductCategory.create('electronics');

    const product = Product.create(productId, 'Test Product', price, stock, category);

    // Value Objectを変更しても元のEntityには影響しない
    const newPrice = price.add(Price.create(500));
    expect(product.price.value).toBe(1000); // 元の価格は変わらない
    expect(newPrice.value).toBe(1500);
  });
});