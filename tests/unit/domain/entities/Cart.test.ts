/**
 * Cart Entity 包括的テスト
 * カートエンティティのビジネスロジックと状態管理を徹底テスト
 */

import {
  Cart,
  CartItem,
  Product
} from '../../../../src/domain/entities';
import {
  ProductId,
  Price,
  Quantity,
  ProductCategory
} from '../../../../src/domain/value-objects';
import { TestDataFactory, TestUtils } from '../../../helpers';

describe('Cart Entity 包括的テスト', () => {
  describe('カート作成とライフサイクル', () => {
    test('空のカートが正しく作成される', () => {
      // Arrange & Act
      const cart = Cart.create('session123');

      // Assert
      expect(cart.sessionId).toBe('session123');
      expect(cart.isEmpty()).toBe(true);
      expect(cart.itemCount).toBe(0);
      expect(cart.getTotalQuantity()).toBe(0);
      expect(cart.items).toHaveLength(0);
    });

    test('異なるセッションIDで複数のカートを作成', () => {
      // Arrange & Act
      const cart1 = Cart.create('session1');
      const cart2 = Cart.create('session2');

      // Assert
      expect(cart1.sessionId).toBe('session1');
      expect(cart2.sessionId).toBe('session2');
      expect(cart1.sessionId).not.toBe(cart2.sessionId);
    });

    test('空文字列のセッションIDでエラーがスローされる', () => {
      // Act & Assert
      expect(() => Cart.create('')).toThrow('Session ID cannot be empty');
    });
  });

  describe('カート項目の追加と管理', () => {
    test('単一項目の追加', () => {
      // Arrange
      const cart = Cart.create('session123');
      const item = TestDataFactory.createCartItem({
        sessionId: 'session123',
        productId: 1,
        quantity: 2
      });

      // Act
      const updatedCart = cart.addItem(item);

      // Assert
      expect(updatedCart.isEmpty()).toBe(false);
      expect(updatedCart.itemCount).toBe(1);
      expect(updatedCart.getTotalQuantity()).toBe(2);
      expect(updatedCart.items).toHaveLength(1);
      expect(updatedCart.items[0]).toBe(item);

      // 元のカートは変更されない（不変性確認）
      expect(cart.isEmpty()).toBe(true);
      expect(cart.itemCount).toBe(0);
    });

    test('複数の異なる項目の追加', () => {
      // Arrange
      const cart = Cart.create('session123');
      const item1 = TestDataFactory.createCartItem({
        sessionId: 'session123',
        productId: 1,
        quantity: 2
      });
      const item2 = TestDataFactory.createCartItem({
        sessionId: 'session123',
        productId: 2,
        quantity: 3
      });

      // Act
      const cartWithItem1 = cart.addItem(item1);
      const cartWithBothItems = cartWithItem1.addItem(item2);

      // Assert
      expect(cartWithBothItems.itemCount).toBe(2);
      expect(cartWithBothItems.getTotalQuantity()).toBe(5); // 2 + 3
      expect(cartWithBothItems.items).toHaveLength(2);
    });

    test('同じ商品の重複追加で数量が統合される', () => {
      // Arrange
      const cart = Cart.create('session123');
      const productId = ProductId.create(1);

      const item1 = CartItem.create(1, 'session123', productId, Quantity.create(2));
      const item2 = CartItem.create(2, 'session123', productId, Quantity.create(3));

      // Act
      const cartWithItem1 = cart.addItem(item1);
      const cartWithCombined = cartWithItem1.addItem(item2);

      // Assert
      expect(cartWithCombined.itemCount).toBe(1); // 商品種類は1つ
      expect(cartWithCombined.getTotalQuantity()).toBe(5); // 数量は合計される

      const combinedItem = cartWithCombined.items[0];
      expect(combinedItem.productId).toEqual(productId);
      expect(combinedItem.quantity.value).toBe(5);
    });

    test('最大数量制限を超える追加でエラー', () => {
      // Arrange
      const cart = Cart.create('session123');
      const productId = ProductId.create(1);

      const item1 = CartItem.create(1, 'session123', productId, Quantity.create(999));
      const item2 = CartItem.create(2, 'session123', productId, Quantity.create(2));

      const cartWithItem1 = cart.addItem(item1);

      // Act & Assert
      expect(() => cartWithItem1.addItem(item2)).toThrow('Quantity exceeds maximum allowed value');
    });
  });

  describe('カート項目の更新', () => {
    test('項目数量の更新', () => {
      // Arrange
      const cart = Cart.create('session123');
      const productId = ProductId.create(1);
      const item = CartItem.create(1, 'session123', productId, Quantity.create(2));
      const cartWithItem = cart.addItem(item);

      // Act
      const newQuantity = Quantity.create(5);
      const updatedCart = cartWithItem.updateItemQuantity(productId, newQuantity);

      // Assert
      expect(updatedCart.getTotalQuantity()).toBe(5);

      const updatedItem = updatedCart.items.find(i => i.productId.equals(productId));
      expect(updatedItem?.quantity.value).toBe(5);

      // 元のカートは変更されない
      expect(cartWithItem.getTotalQuantity()).toBe(2);
    });

    test('存在しない項目の更新でエラー', () => {
      // Arrange
      const cart = Cart.create('session123');
      const nonExistentProductId = ProductId.create(999);

      // Act & Assert
      expect(() => {
        cart.updateItemQuantity(nonExistentProductId, Quantity.create(5));
      }).toThrow('Cart item not found');
    });

    test('0に更新すると項目が削除される', () => {
      // Arrange
      const cart = Cart.create('session123');
      const productId = ProductId.create(1);
      const item = CartItem.create(1, 'session123', productId, Quantity.create(2));
      const cartWithItem = cart.addItem(item);

      // Act
      const updatedCart = cartWithItem.updateItemQuantity(productId, Quantity.create(0));

      // Assert
      expect(updatedCart.isEmpty()).toBe(true);
      expect(updatedCart.itemCount).toBe(0);
    });
  });

  describe('カート項目の削除', () => {
    test('特定項目の削除', () => {
      // Arrange
      const cart = Cart.create('session123');
      const productId1 = ProductId.create(1);
      const productId2 = ProductId.create(2);

      const item1 = CartItem.create(1, 'session123', productId1, Quantity.create(2));
      const item2 = CartItem.create(2, 'session123', productId2, Quantity.create(3));

      const cartWithItems = cart.addItem(item1).addItem(item2);

      // Act
      const updatedCart = cartWithItems.removeItem(productId1);

      // Assert
      expect(updatedCart.itemCount).toBe(1);
      expect(updatedCart.getTotalQuantity()).toBe(3);

      const remainingItem = updatedCart.items.find(i => i.productId.equals(productId2));
      expect(remainingItem).toBeDefined();

      const removedItem = updatedCart.items.find(i => i.productId.equals(productId1));
      expect(removedItem).toBeUndefined();
    });

    test('存在しない項目の削除でエラー', () => {
      // Arrange
      const cart = Cart.create('session123');
      const nonExistentProductId = ProductId.create(999);

      // Act & Assert
      expect(() => cart.removeItem(nonExistentProductId)).toThrow('Cart item not found');
    });

    test('カート全体のクリア', () => {
      // Arrange
      const cart = Cart.create('session123');
      const items = TestDataFactory.createCartItems(3, 'session123');

      let cartWithItems = cart;
      items.forEach(item => {
        cartWithItems = cartWithItems.addItem(item);
      });

      // Act
      const clearedCart = cartWithItems.clear();

      // Assert
      expect(clearedCart.isEmpty()).toBe(true);
      expect(clearedCart.itemCount).toBe(0);
      expect(clearedCart.getTotalQuantity()).toBe(0);
      expect(clearedCart.sessionId).toBe('session123'); // セッションIDは保持
    });
  });

  describe('金額計算', () => {
    test('総金額の正確な計算', () => {
      // Arrange
      const cart = Cart.create('session123');

      const product1 = TestDataFactory.createProduct({
        id: 1,
        price: 1000,
        name: 'Product 1'
      });

      const product2 = TestDataFactory.createProduct({
        id: 2,
        price: 500,
        name: 'Product 2'
      });

      const item1 = CartItem.create(1, 'session123', product1.id, Quantity.create(2));
      const item2 = CartItem.create(2, 'session123', product2.id, Quantity.create(3));

      const cartWithItems = cart.addItem(item1).addItem(item2);

      // Act
      const totalAmount = cartWithItems.getTotalAmount([product1, product2]);

      // Assert
      expect(totalAmount.value).toBe(3500); // (1000×2) + (500×3) = 3500
    });

    test('商品情報なしで総金額計算時にエラー', () => {
      // Arrange
      const cart = Cart.create('session123');
      const item = TestDataFactory.createCartItem({
        sessionId: 'session123',
        productId: 1,
        quantity: 2
      });
      const cartWithItem = cart.addItem(item);

      // Act & Assert
      expect(() => cartWithItem.getTotalAmount([])).toThrow('Product not found');
    });

    test('部分的な商品情報での計算', () => {
      // Arrange
      const cart = Cart.create('session123');

      const product1 = TestDataFactory.createProduct({ id: 1, price: 1000 });
      const product2 = TestDataFactory.createProduct({ id: 2, price: 500 });

      const item1 = CartItem.create(1, 'session123', product1.id, Quantity.create(2));
      const item2 = CartItem.create(2, 'session123', product2.id, Quantity.create(3));

      const cartWithItems = cart.addItem(item1).addItem(item2);

      // Act & Assert - product1の情報のみ提供
      expect(() => cartWithItems.getTotalAmount([product1])).toThrow('Product not found');
    });
  });

  describe('カートの状態チェック', () => {
    test('カートが空の状態の正確な判定', () => {
      // Arrange
      const cart = Cart.create('session123');

      // Act & Assert
      expect(cart.isEmpty()).toBe(true);
      expect(cart.isNotEmpty()).toBe(false);
    });

    test('カートに項目がある状態の正確な判定', () => {
      // Arrange
      const cart = Cart.create('session123');
      const item = TestDataFactory.createCartItem({ sessionId: 'session123' });
      const cartWithItem = cart.addItem(item);

      // Act & Assert
      expect(cartWithItem.isEmpty()).toBe(false);
      expect(cartWithItem.isNotEmpty()).toBe(true);
    });

    test('特定商品の存在チェック', () => {
      // Arrange
      const cart = Cart.create('session123');
      const productId1 = ProductId.create(1);
      const productId2 = ProductId.create(2);

      const item1 = CartItem.create(1, 'session123', productId1, Quantity.create(2));
      const cartWithItem = cart.addItem(item1);

      // Act & Assert
      expect(cartWithItem.hasItem(productId1)).toBe(true);
      expect(cartWithItem.hasItem(productId2)).toBe(false);
    });

    test('カート内の項目数取得', () => {
      // Arrange
      const cart = Cart.create('session123');
      const items = TestDataFactory.createCartItems(3, 'session123');

      let cartWithItems = cart;
      items.forEach(item => {
        cartWithItems = cartWithItems.addItem(item);
      });

      // Act & Assert
      expect(cartWithItems.itemCount).toBe(3);
      expect(cartWithItems.getTotalQuantity()).toBe(6); // 1+2+3 = 6
    });
  });

  describe('エッジケースと境界値', () => {
    test('極大セッションIDの処理', () => {
      // Arrange
      const longSessionId = 'a'.repeat(1000);

      // Act & Assert
      expect(() => Cart.create(longSessionId)).not.toThrow();
    });

    test('最大項目数の制限', () => {
      // Arrange
      const cart = Cart.create('session123');
      const maxItems = 100; // 仮の最大項目数

      // Act
      let cartWithItems = cart;
      for (let i = 1; i <= maxItems; i++) {
        const item = CartItem.create(i, 'session123', ProductId.create(i), Quantity.create(1));
        cartWithItems = cartWithItems.addItem(item);
      }

      // Assert
      expect(cartWithItems.itemCount).toBe(maxItems);

      // 最大数を超える追加
      const extraItem = CartItem.create(101, 'session123', ProductId.create(101), Quantity.create(1));
      expect(() => cartWithItems.addItem(extraItem)).toThrow('Maximum cart items exceeded');
    });

    test('異なるセッションIDの項目追加でエラー', () => {
      // Arrange
      const cart = Cart.create('session123');
      const item = TestDataFactory.createCartItem({
        sessionId: 'different-session',
        productId: 1
      });

      // Act & Assert
      expect(() => cart.addItem(item)).toThrow('Cart item session ID mismatch');
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量項目での操作性能', async () => {
      // Arrange
      const cart = Cart.create('session123');
      const itemCount = 50;

      // Act & Assert
      const { duration } = await TestUtils.measureExecutionTime(async () => {
        let cartWithItems = cart;
        for (let i = 1; i <= itemCount; i++) {
          const item = CartItem.create(i, 'session123', ProductId.create(i), Quantity.create(1));
          cartWithItems = cartWithItems.addItem(item);
        }

        // 総数計算
        const totalQuantity = cartWithItems.getTotalQuantity();
        expect(totalQuantity).toBe(itemCount);
      });

      // 50項目の追加と計算が100ms以内に完了することを確認
      expect(duration).toBeLessThan(100);
    });

    test('頻繁な更新操作の性能', async () => {
      // Arrange
      const cart = Cart.create('session123');
      const productId = ProductId.create(1);
      const item = CartItem.create(1, 'session123', productId, Quantity.create(1));
      const cartWithItem = cart.addItem(item);

      // Act & Assert
      const { duration } = await TestUtils.measureExecutionTime(async () => {
        let currentCart = cartWithItem;
        for (let i = 1; i <= 100; i++) {
          currentCart = currentCart.updateItemQuantity(productId, Quantity.create(i));
        }
        expect(currentCart.getTotalQuantity()).toBe(100);
      });

      // 100回の更新が50ms以内に完了することを確認
      expect(duration).toBeLessThan(50);
    });
  });

  describe('不変性の確認', () => {
    test('カート操作後の元オブジェクト不変性', () => {
      // Arrange
      const originalCart = Cart.create('session123');
      const item = TestDataFactory.createCartItem({ sessionId: 'session123' });

      // Act
      const newCart = originalCart.addItem(item);
      const clearedCart = newCart.clear();
      const updatedCart = newCart.updateItemQuantity(item.productId, Quantity.create(5));

      // Assert
      expect(originalCart.isEmpty()).toBe(true);
      expect(originalCart.itemCount).toBe(0);

      expect(newCart.itemCount).toBe(1);
      expect(clearedCart.isEmpty()).toBe(true);
      expect(updatedCart.getTotalQuantity()).toBe(5);

      // すべて異なるインスタンス
      expect(originalCart).not.toBe(newCart);
      expect(newCart).not.toBe(clearedCart);
      expect(newCart).not.toBe(updatedCart);
    });
  });
});