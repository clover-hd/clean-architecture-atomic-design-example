/**
 * Order Entity 包括的テスト
 * 注文エンティティのライフサイクルと状態遷移を徹底テスト
 */

import {
  Order,
  OrderItem,
  Product
} from '../../../../src/domain/entities';
import {
  OrderId,
  UserId,
  ProductId,
  Price,
  Quantity,
  OrderStatus,
  ProductCategory
} from '../../../../src/domain/value-objects';
import { TestDataFactory, TestUtils } from '../../../helpers';

describe('Order Entity 包括的テスト', () => {
  describe('注文作成とライフサイクル', () => {
    test('正常な注文が作成される', () => {
      // Arrange
      const orderId = OrderId.create(1);
      const userId = UserId.create(1);
      const status = OrderStatus.create('pending');
      const totalAmount = Price.create(10000);

      // Act
      const order = Order.create(orderId, userId, status, totalAmount);

      // Assert
      expect(order.id).toBe(orderId);
      expect(order.userId).toBe(userId);
      expect(order.status).toBe(status);
      expect(order.totalAmount).toBe(totalAmount);
      expect(order.items).toHaveLength(0);
      expect(order.createdAt).toBeInstanceOf(Date);
      expect(order.updatedAt).toBeInstanceOf(Date);
    });

    test('注文作成時のタイムスタンプが正確', () => {
      // Arrange
      const before = new Date();

      // Act
      const order = TestDataFactory.createOrder();

      const after = new Date();

      // Assert
      TestUtils.expectDateInRange(order.createdAt, before, after);
      TestUtils.expectDateInRange(order.updatedAt, before, after);
      expect(order.createdAt.getTime()).toBeLessThanOrEqual(order.updatedAt.getTime());
    });

    test('無効な総額で注文作成時にエラー', () => {
      // Arrange & Act & Assert
      expect(() => {
        const orderId = OrderId.create(1);
        const userId = UserId.create(1);
        const status = OrderStatus.create('pending');
        const invalidAmount = Price.create(-100);
        Order.create(orderId, userId, status, invalidAmount);
      }).toThrow('Price must be non-negative');
    });
  });

  describe('注文項目の管理', () => {
    test('注文項目の追加', () => {
      // Arrange
      const order = TestDataFactory.createOrder();
      const orderItem = TestDataFactory.createOrderItem(
        order.id.value,
        1, // productId
        2, // quantity
        1000 // price
      );

      // Act
      const updatedOrder = order.addItem(orderItem);

      // Assert
      expect(updatedOrder.items).toHaveLength(1);
      expect(updatedOrder.items[0]).toBe(orderItem);
      expect(updatedOrder.getTotalItemsCount()).toBe(2);

      // 元の注文は変更されない（不変性確認）
      expect(order.items).toHaveLength(0);
    });

    test('複数の注文項目の追加', () => {
      // Arrange
      const order = TestDataFactory.createOrder();
      const item1 = TestDataFactory.createOrderItem(order.id.value, 1, 2, 1000);
      const item2 = TestDataFactory.createOrderItem(order.id.value, 2, 3, 500);

      // Act
      const orderWithItem1 = order.addItem(item1);
      const orderWithBothItems = orderWithItem1.addItem(item2);

      // Assert
      expect(orderWithBothItems.items).toHaveLength(2);
      expect(orderWithBothItems.getTotalItemsCount()).toBe(5); // 2 + 3
    });

    test('異なる注文IDの項目追加でエラー', () => {
      // Arrange
      const order = TestDataFactory.createOrder({ id: 1 });
      const wrongOrderItem = TestDataFactory.createOrderItem(
        999, // 異なる注文ID
        1,
        1,
        1000
      );

      // Act & Assert
      expect(() => order.addItem(wrongOrderItem)).toThrow('Order item order ID mismatch');
    });

    test('同じ商品の重複追加でエラー', () => {
      // Arrange
      const order = TestDataFactory.createOrder();
      const productId = ProductId.create(1);

      const item1 = OrderItem.create(
        1,
        order.id,
        productId,
        Quantity.create(2),
        Price.create(1000)
      );

      const item2 = OrderItem.create(
        2,
        order.id,
        productId, // 同じ商品ID
        Quantity.create(1),
        Price.create(1000)
      );

      const orderWithItem1 = order.addItem(item1);

      // Act & Assert
      expect(() => orderWithItem1.addItem(item2)).toThrow('Product already exists in order');
    });
  });

  describe('注文ステータス管理', () => {
    test('有効なステータス遷移', () => {
      // Arrange
      const order = TestDataFactory.createOrder({ status: 'pending' });

      // Act & Assert
      const confirmedOrder = order.updateStatus(OrderStatus.create('confirmed'));
      expect(confirmedOrder.status.value).toBe('confirmed');

      const shippedOrder = confirmedOrder.updateStatus(OrderStatus.create('shipped'));
      expect(shippedOrder.status.value).toBe('shipped');

      const deliveredOrder = shippedOrder.updateStatus(OrderStatus.create('delivered'));
      expect(deliveredOrder.status.value).toBe('delivered');
    });

    test('無効なステータス遷移でエラー', () => {
      // Arrange
      const pendingOrder = TestDataFactory.createOrder({ status: 'pending' });

      // Act & Assert
      expect(() => {
        pendingOrder.updateStatus(OrderStatus.create('shipped'));
      }).toThrow('Invalid status transition from pending to shipped');
    });

    test('後退するステータス遷移でエラー', () => {
      // Arrange
      const shippedOrder = TestDataFactory.createOrder({ status: 'shipped' });

      // Act & Assert
      expect(() => {
        shippedOrder.updateStatus(OrderStatus.create('pending'));
      }).toThrow('Invalid status transition from shipped to pending');
    });

    test('同じステータスへの遷移は無視される', () => {
      // Arrange
      const order = TestDataFactory.createOrder({ status: 'pending' });
      const originalUpdatedAt = order.updatedAt;

      // Act
      const sameStatusOrder = order.updateStatus(OrderStatus.create('pending'));

      // Assert
      expect(sameStatusOrder).toBe(order); // 同じインスタンス
      expect(sameStatusOrder.updatedAt).toEqual(originalUpdatedAt);
    });
  });

  describe('注文計算ロジック', () => {
    test('注文総額の計算', () => {
      // Arrange
      const order = TestDataFactory.createOrder();
      const item1 = TestDataFactory.createOrderItem(order.id.value, 1, 2, 1000); // 2000円
      const item2 = TestDataFactory.createOrderItem(order.id.value, 2, 3, 500);  // 1500円

      const orderWithItems = order.addItem(item1).addItem(item2);

      // Act
      const calculatedTotal = orderWithItems.calculateTotalAmount();

      // Assert
      expect(calculatedTotal.value).toBe(3500);
    });

    test('空の注文の総額は0', () => {
      // Arrange
      const emptyOrder = TestDataFactory.createOrder();

      // Act
      const total = emptyOrder.calculateTotalAmount();

      // Assert
      expect(total.value).toBe(0);
    });

    test('総項目数の計算', () => {
      // Arrange
      const order = TestDataFactory.createOrder();
      const item1 = TestDataFactory.createOrderItem(order.id.value, 1, 2, 1000);
      const item2 = TestDataFactory.createOrderItem(order.id.value, 2, 5, 500);

      const orderWithItems = order.addItem(item1).addItem(item2);

      // Act
      const totalItems = orderWithItems.getTotalItemsCount();

      // Assert
      expect(totalItems).toBe(7); // 2 + 5
    });

    test('注文の一意商品数の計算', () => {
      // Arrange
      const order = TestDataFactory.createOrder();
      const item1 = TestDataFactory.createOrderItem(order.id.value, 1, 2, 1000);
      const item2 = TestDataFactory.createOrderItem(order.id.value, 2, 5, 500);

      const orderWithItems = order.addItem(item1).addItem(item2);

      // Act
      const uniqueProducts = orderWithItems.getUniqueProductsCount();

      // Assert
      expect(uniqueProducts).toBe(2);
    });
  });

  describe('注文状態の検証', () => {
    test('キャンセル可能性の判定', () => {
      // Arrange
      const pendingOrder = TestDataFactory.createOrder({ status: 'pending' });
      const confirmedOrder = TestDataFactory.createOrder({ status: 'confirmed' });
      const shippedOrder = TestDataFactory.createOrder({ status: 'shipped' });

      // Act & Assert
      expect(pendingOrder.canBeCancelled()).toBe(true);
      expect(confirmedOrder.canBeCancelled()).toBe(true);
      expect(shippedOrder.canBeCancelled()).toBe(false);
    });

    test('変更可能性の判定', () => {
      // Arrange
      const pendingOrder = TestDataFactory.createOrder({ status: 'pending' });
      const confirmedOrder = TestDataFactory.createOrder({ status: 'confirmed' });
      const shippedOrder = TestDataFactory.createOrder({ status: 'shipped' });

      // Act & Assert
      expect(pendingOrder.canBeModified()).toBe(true);
      expect(confirmedOrder.canBeModified()).toBe(false);
      expect(shippedOrder.canBeModified()).toBe(false);
    });

    test('完了済み判定', () => {
      // Arrange
      const pendingOrder = TestDataFactory.createOrder({ status: 'pending' });
      const deliveredOrder = TestDataFactory.createOrder({ status: 'delivered' });
      const cancelledOrder = TestDataFactory.createOrder({ status: 'cancelled' });

      // Act & Assert
      expect(pendingOrder.isCompleted()).toBe(false);
      expect(deliveredOrder.isCompleted()).toBe(true);
      expect(cancelledOrder.isCompleted()).toBe(true);
    });

    test('空の注文判定', () => {
      // Arrange
      const emptyOrder = TestDataFactory.createOrder();
      const orderWithItem = emptyOrder.addItem(
        TestDataFactory.createOrderItem(emptyOrder.id.value, 1, 1, 1000)
      );

      // Act & Assert
      expect(emptyOrder.isEmpty()).toBe(true);
      expect(orderWithItem.isEmpty()).toBe(false);
    });
  });

  describe('特殊な操作', () => {
    test('注文のキャンセル', () => {
      // Arrange
      const order = TestDataFactory.createOrder({ status: 'pending' });

      // Act
      const cancelledOrder = order.cancel();

      // Assert
      expect(cancelledOrder.status.value).toBe('cancelled');
      expect(cancelledOrder.isCompleted()).toBe(true);
      expect(cancelledOrder.canBeCancelled()).toBe(false);
    });

    test('キャンセル不可能な注文のキャンセルでエラー', () => {
      // Arrange
      const shippedOrder = TestDataFactory.createOrder({ status: 'shipped' });

      // Act & Assert
      expect(() => shippedOrder.cancel()).toThrow('Order cannot be cancelled');
    });

    test('注文項目の削除', () => {
      // Arrange
      const order = TestDataFactory.createOrder();
      const item1 = TestDataFactory.createOrderItem(order.id.value, 1, 2, 1000);
      const item2 = TestDataFactory.createOrderItem(order.id.value, 2, 3, 500);

      const orderWithItems = order.addItem(item1).addItem(item2);

      // Act
      const orderAfterRemoval = orderWithItems.removeItem(ProductId.create(1));

      // Assert
      expect(orderAfterRemoval.items).toHaveLength(1);
      expect(orderAfterRemoval.items[0].productId.value).toBe(2);
    });

    test('存在しない項目の削除でエラー', () => {
      // Arrange
      const order = TestDataFactory.createOrder();

      // Act & Assert
      expect(() => {
        order.removeItem(ProductId.create(999));
      }).toThrow('Order item not found');
    });

    test('変更不可能な注文の項目削除でエラー', () => {
      // Arrange
      const confirmedOrder = TestDataFactory.createOrder({ status: 'confirmed' });
      const item = TestDataFactory.createOrderItem(confirmedOrder.id.value, 1, 1, 1000);
      const orderWithItem = confirmedOrder.addItem(item);

      // Act & Assert
      expect(() => {
        orderWithItem.removeItem(ProductId.create(1));
      }).toThrow('Order cannot be modified');
    });
  });

  describe('エッジケースと境界値', () => {
    test('極大金額の注文', () => {
      // Arrange & Act
      const expensiveOrder = TestDataFactory.createOrder({
        totalAmount: 9999999 // 最大価格近く
      });

      // Assert
      expect(expensiveOrder.totalAmount.value).toBe(9999999);
    });

    test('最大項目数の注文', () => {
      // Arrange
      const order = TestDataFactory.createOrder();
      const maxItems = 50; // 仮の最大項目数

      // Act
      let orderWithItems = order;
      for (let i = 1; i <= maxItems; i++) {
        const item = TestDataFactory.createOrderItem(order.id.value, i, 1, 100);
        orderWithItems = orderWithItems.addItem(item);
      }

      // Assert
      expect(orderWithItems.items).toHaveLength(maxItems);
      expect(orderWithItems.getUniqueProductsCount()).toBe(maxItems);

      // 最大数を超える追加でエラー
      const extraItem = TestDataFactory.createOrderItem(order.id.value, maxItems + 1, 1, 100);
      expect(() => orderWithItems.addItem(extraItem)).toThrow('Maximum order items exceeded');
    });

    test('極大数量の項目', () => {
      // Arrange
      const order = TestDataFactory.createOrder();

      // Act & Assert
      expect(() => {
        const item = TestDataFactory.createOrderItem(order.id.value, 1, 1000, 100);
        order.addItem(item);
      }).toThrow('Quantity exceeds maximum allowed value');
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量項目での計算性能', async () => {
      // Arrange
      const order = TestDataFactory.createOrder();
      const itemCount = 100;

      let orderWithItems = order;
      for (let i = 1; i <= itemCount; i++) {
        const item = TestDataFactory.createOrderItem(order.id.value, i, 1, 100);
        orderWithItems = orderWithItems.addItem(item);
      }

      // Act & Assert
      const { duration } = await TestUtils.measureExecutionTime(async () => {
        const total = orderWithItems.calculateTotalAmount();
        const itemsCount = orderWithItems.getTotalItemsCount();
        const uniqueCount = orderWithItems.getUniqueProductsCount();

        expect(total.value).toBe(10000); // 100 items × 100 price
        expect(itemsCount).toBe(100);
        expect(uniqueCount).toBe(100);
      });

      // 100項目の計算が50ms以内に完了することを確認
      expect(duration).toBeLessThan(50);
    });

    test('頻繁なステータス更新の性能', async () => {
      // Arrange
      const order = TestDataFactory.createOrder({ status: 'pending' });

      // Act & Assert
      const { duration } = await TestUtils.measureExecutionTime(async () => {
        let currentOrder = order;

        // pending → confirmed → shipped → delivered のサイクルを繰り返す
        for (let i = 0; i < 100; i++) {
          currentOrder = TestDataFactory.createOrder({ status: 'pending' });
          currentOrder = currentOrder.updateStatus(OrderStatus.create('confirmed'));
          currentOrder = currentOrder.updateStatus(OrderStatus.create('shipped'));
          currentOrder = currentOrder.updateStatus(OrderStatus.create('delivered'));
        }

        expect(currentOrder.isCompleted()).toBe(true);
      });

      // 400回のステータス更新が100ms以内に完了することを確認
      expect(duration).toBeLessThan(100);
    });
  });

  describe('不変性の確認', () => {
    test('注文操作後の元オブジェクト不変性', () => {
      // Arrange
      const originalOrder = TestDataFactory.createOrder({ status: 'pending' });
      const item = TestDataFactory.createOrderItem(originalOrder.id.value, 1, 1, 1000);

      // Act
      const orderWithItem = originalOrder.addItem(item);
      const confirmedOrder = originalOrder.updateStatus(OrderStatus.create('confirmed'));
      const cancelledOrder = originalOrder.cancel();

      // Assert
      expect(originalOrder.status.value).toBe('pending');
      expect(originalOrder.items).toHaveLength(0);
      expect(originalOrder.canBeCancelled()).toBe(true);

      expect(orderWithItem.items).toHaveLength(1);
      expect(confirmedOrder.status.value).toBe('confirmed');
      expect(cancelledOrder.status.value).toBe('cancelled');

      // すべて異なるインスタンス
      expect(originalOrder).not.toBe(orderWithItem);
      expect(originalOrder).not.toBe(confirmedOrder);
      expect(originalOrder).not.toBe(cancelledOrder);
    });

    test('更新時のタイムスタンプ変更', () => {
      // Arrange
      const order = TestDataFactory.createOrder();
      const originalUpdatedAt = order.updatedAt;

      // 時間の経過をシミュレート
      jest.useFakeTimers();
      jest.setSystemTime(new Date(Date.now() + 1000));

      // Act
      const updatedOrder = order.updateStatus(OrderStatus.create('confirmed'));

      // Assert
      expect(updatedOrder.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      expect(updatedOrder.createdAt).toEqual(order.createdAt); // 作成日時は変更されない

      jest.useRealTimers();
    });
  });
});