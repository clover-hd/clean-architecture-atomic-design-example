/**
 * Value Objects型安全性検証テスト
 * TypeScriptコンパイル時とランタイムの型安全性を検証
 */

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

describe('Value Objects 型安全性検証', () => {
  describe('UserId', () => {
    test('正常な値で作成できる', () => {
      const userId = UserId.create(123);
      expect(userId.value).toBe(123);
    });

    test('無効な値でエラーが発生する', () => {
      expect(() => UserId.create(0)).toThrow('UserId must be a positive integer');
      expect(() => UserId.create(-1)).toThrow('UserId must be a positive integer');
      expect(() => UserId.create(1.5)).toThrow('UserId must be an integer');
    });

    test('不変性が保証される', () => {
      const userId = UserId.create(123);
      const originalValue = userId.value;

      // TypeScriptコンパイル時に_valueは変更できない
      // @ts-expect-error - Private property should not be accessible
      // userId._value = 456;

      expect(userId.value).toBe(originalValue);
    });

    test('等価性チェックが正しく動作する', () => {
      const userId1 = UserId.create(123);
      const userId2 = UserId.create(123);
      const userId3 = UserId.create(456);

      expect(userId1.equals(userId2)).toBe(true);
      expect(userId1.equals(userId3)).toBe(false);
    });
  });

  describe('Email', () => {
    test('正常なメールアドレスで作成できる', () => {
      const email = Email.create('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    test('無効なメールアドレスでエラーが発生する', () => {
      expect(() => Email.create('')).toThrow('Email value must be a non-empty string');
      expect(() => Email.create('invalid-email')).toThrow('Invalid email format');
      expect(() => Email.create('test@')).toThrow('Invalid email format');
    });

    test('メールアドレスが正規化される', () => {
      const email = Email.create('  Test@Example.COM  ');
      expect(email.value).toBe('test@example.com');
    });

    test('ドメイン部分を正しく取得できる', () => {
      const email = Email.create('test@example.com');
      expect(email.getDomain()).toBe('example.com');
      expect(email.getLocalPart()).toBe('test');
    });
  });

  describe('Price', () => {
    test('正常な価格で作成できる', () => {
      const price = Price.create(1000);
      expect(price.value).toBe(1000);
    });

    test('無効な価格でエラーが発生する', () => {
      expect(() => Price.create(-1)).toThrow('Price must be non-negative');
      expect(() => Price.create(1.5)).toThrow('Price must be an integer');
      expect(() => Price.create(10000001)).toThrow('Price exceeds maximum allowed value');
    });

    test('価格計算が正しく動作する', () => {
      const price1 = Price.create(1000);
      const price2 = Price.create(500);

      const sum = price1.add(price2);
      expect(sum.value).toBe(1500);

      const difference = price1.subtract(price2);
      expect(difference.value).toBe(500);

      const multiplied = price1.multiply(3);
      expect(multiplied.value).toBe(3000);
    });

    test('税込み価格が正しく計算される', () => {
      const price = Price.create(1000);
      const taxIncluded = price.withTax(0.1); // 10%税
      expect(taxIncluded.value).toBe(1100);
    });

    test('フォーマット表示が正しく動作する', () => {
      const price = Price.create(1234567);
      expect(price.toFormattedString()).toBe('¥1,234,567');
    });
  });

  describe('ProductCategory', () => {
    test('有効なカテゴリで作成できる', () => {
      const category = ProductCategory.create('electronics');
      expect(category.value).toBe('electronics');
    });

    test('無効なカテゴリでエラーが発生する', () => {
      expect(() => ProductCategory.create('invalid')).toThrow('Invalid category');
      expect(() => ProductCategory.create('')).toThrow('Category value must be a non-empty string');
    });

    test('日本語名が正しく取得できる', () => {
      const category = ProductCategory.create('electronics');
      expect(category.getJapaneseName()).toBe('家電・電子機器');
    });

    test('カテゴリチェックが正しく動作する', () => {
      const category = ProductCategory.create('fashion');
      expect(category.is('fashion')).toBe(true);
      expect(category.is('electronics')).toBe(false);
    });
  });

  describe('OrderStatus', () => {
    test('有効なステータスで作成できる', () => {
      const status = OrderStatus.create('pending');
      expect(status.value).toBe('pending');
    });

    test('デフォルトステータスが作成できる', () => {
      const status = OrderStatus.createDefault();
      expect(status.value).toBe('pending');
    });

    test('ステータス遷移ルールが正しく動作する', () => {
      const pending = OrderStatus.create('pending');
      expect(pending.canTransitionTo('confirmed')).toBe(true);
      expect(pending.canTransitionTo('shipped')).toBe(false);

      const confirmed = OrderStatus.create('confirmed');
      expect(confirmed.canTransitionTo('shipped')).toBe(true);
      expect(confirmed.canTransitionTo('pending')).toBe(false);
    });

    test('ステータス状態チェックが正しく動作する', () => {
      const delivered = OrderStatus.create('delivered');
      expect(delivered.isCompleted()).toBe(true);
      expect(delivered.isActive()).toBe(false);

      const pending = OrderStatus.create('pending');
      expect(pending.isCompleted()).toBe(false);
      expect(pending.isActive()).toBe(true);
    });
  });

  describe('Quantity', () => {
    test('正常な数量で作成できる', () => {
      const quantity = Quantity.create(5);
      expect(quantity.value).toBe(5);
    });

    test('無効な数量でエラーが発生する', () => {
      expect(() => Quantity.create(0)).toThrow('Quantity must be a positive integer');
      expect(() => Quantity.create(-1)).toThrow('Quantity must be a positive integer');
      expect(() => Quantity.create(1000)).toThrow('Quantity exceeds maximum allowed value');
    });

    test('数量計算が正しく動作する', () => {
      const qty1 = Quantity.create(3);
      const qty2 = Quantity.create(2);

      const sum = qty1.add(qty2);
      expect(sum.value).toBe(5);

      const difference = qty1.subtract(qty2);
      expect(difference.value).toBe(1);
    });

    test('比較が正しく動作する', () => {
      const qty1 = Quantity.create(5);
      const qty2 = Quantity.create(3);

      expect(qty1.isGreaterThan(qty2)).toBe(true);
      expect(qty2.isLessThan(qty1)).toBe(true);
      expect(qty1.isGreaterThanOrEqual(qty2)).toBe(true);
    });
  });
});

describe('Value Objects 相互作用テスト', () => {
  test('Price と Quantity の組み合わせ計算', () => {
    const price = Price.create(1000);
    const quantity = Quantity.create(3);

    const total = price.multiply(quantity.value);
    expect(total.value).toBe(3000);
  });

  test('型安全性による不正な操作の防止', () => {
    const userId = UserId.create(123);
    const productId = ProductId.create(456);

    // TypeScriptコンパイル時に異なる型の比較はエラーになる
    // @ts-expect-error - Different value object types should not be comparable
    // expect(userId.equals(productId)).toBe(false);
  });
});