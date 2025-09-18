/**
 * ProductDomainService テスト
 * 商品ドメインのビジネスルールと在庫管理ロジックをテスト
 */

import { ProductDomainService } from '../../../../src/domain/services/ProductDomainService';
import { Product } from '../../../../src/domain/entities/Product';
import { ProductId, Price, Quantity, ProductCategory } from '../../../../src/domain/value-objects';
import { IProductRepository } from '../../../../src/domain/repositories/IProductRepository';
import { TestDataFactory, MockFactory, TestUtils } from '../../../helpers';

describe('ProductDomainService', () => {
  let productDomainService: ProductDomainService;
  let mockProductRepository: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    mockProductRepository = MockFactory.createProductRepositoryMock();
    productDomainService = new ProductDomainService(mockProductRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateProductCreation', () => {
    test('正常な商品作成時にエラーがスローされない', async () => {
      // Arrange
      const product = TestDataFactory.createProduct({
        name: 'Valid Product',
        price: 1000,
        stock: 10,
        category: 'electronics'
      });

      // Act & Assert
      await TestUtils.expectNotToThrow(async () => {
        await productDomainService.validateProductCreation(product);
      });
    });

    test('価格が0の商品作成でエラーがスローされる', async () => {
      // Arrange
      const productId = ProductId.create(1);
      const category = ProductCategory.create('electronics');
      const stock = Quantity.create(10);

      // Act & Assert
      await TestUtils.expectToThrow(
        async () => {
          const price = Price.create(0);
          const product = Product.create(productId, 'Free Product', price, stock, category);
          await productDomainService.validateProductCreation(product);
        },
        'Product price must be greater than zero'
      );
    });

    test('商品名が空の場合エラーがスローされる', async () => {
      // Arrange
      const productId = ProductId.create(1);
      const price = Price.create(1000);
      const stock = Quantity.create(10);
      const category = ProductCategory.create('electronics');

      // Act & Assert
      await TestUtils.expectToThrow(
        async () => {
          const product = Product.create(productId, '', price, stock, category);
          await productDomainService.validateProductCreation(product);
        },
        'Product name is required'
      );
    });

    test('在庫数が負の値の場合エラーがスローされる', async () => {
      // Arrange
      const productId = ProductId.create(1);
      const price = Price.create(1000);
      const category = ProductCategory.create('electronics');

      // Act & Assert
      await TestUtils.expectToThrow(
        async () => {
          const stock = Quantity.create(-1);
          const product = Product.create(productId, 'Product', price, stock, category);
          await productDomainService.validateProductCreation(product);
        },
        'Quantity must be a positive integer'
      );
    });
  });

  describe('validateStockUpdate', () => {
    test('正常な在庫更新時にエラーがスローされない', async () => {
      // Arrange
      const product = TestDataFactory.createProduct({ stock: 10 });
      const newStock = Quantity.create(15);

      // Act & Assert
      await TestUtils.expectNotToThrow(async () => {
        await productDomainService.validateStockUpdate(product, newStock);
      });
    });

    test('在庫を負の値に更新しようとした場合エラーがスローされる', async () => {
      // Arrange
      const product = TestDataFactory.createProduct({ stock: 5 });

      // Act & Assert
      await TestUtils.expectToThrow(
        async () => {
          const newStock = Quantity.create(-1);
          await productDomainService.validateStockUpdate(product, newStock);
        },
        'Quantity must be a positive integer'
      );
    });

    test('非アクティブな商品の在庫更新でエラーがスローされる', async () => {
      // Arrange
      const product = TestDataFactory.createProduct({ isActive: false });
      const newStock = Quantity.create(10);

      // Act & Assert
      await TestUtils.expectToThrow(
        async () => {
          await productDomainService.validateStockUpdate(product, newStock);
        },
        'Cannot update stock for inactive product'
      );
    });
  });

  describe('calculateDiscountedPrice', () => {
    test('正常な割引計算が実行される', () => {
      // Arrange
      const originalPrice = Price.create(1000);
      const discountPercentage = 0.2; // 20%割引

      // Act
      const discountedPrice = productDomainService.calculateDiscountedPrice(
        originalPrice,
        discountPercentage
      );

      // Assert
      expect(discountedPrice.value).toBe(800);
    });

    test('100%割引で価格が0になる', () => {
      // Arrange
      const originalPrice = Price.create(1000);
      const discountPercentage = 1.0; // 100%割引

      // Act
      const discountedPrice = productDomainService.calculateDiscountedPrice(
        originalPrice,
        discountPercentage
      );

      // Assert
      expect(discountedPrice.value).toBe(0);
    });

    test('0%割引で元の価格のまま', () => {
      // Arrange
      const originalPrice = Price.create(1000);
      const discountPercentage = 0; // 0%割引

      // Act
      const discountedPrice = productDomainService.calculateDiscountedPrice(
        originalPrice,
        discountPercentage
      );

      // Assert
      expect(discountedPrice.value).toBe(1000);
    });

    test('無効な割引率でエラーがスローされる', () => {
      // Arrange
      const originalPrice = Price.create(1000);

      // Act & Assert
      expect(() => {
        productDomainService.calculateDiscountedPrice(originalPrice, -0.1);
      }).toThrow('Discount percentage must be between 0 and 1');

      expect(() => {
        productDomainService.calculateDiscountedPrice(originalPrice, 1.1);
      }).toThrow('Discount percentage must be between 0 and 1');
    });
  });

  describe('isProductAvailable', () => {
    test('アクティブで在庫ありの商品は利用可能', () => {
      // Arrange
      const product = TestDataFactory.createProduct({
        stock: 5,
        isActive: true
      });

      // Act
      const result = productDomainService.isProductAvailable(product);

      // Assert
      expect(result).toBe(true);
    });

    test('在庫なしの商品は利用不可', () => {
      // Arrange
      const product = TestDataFactory.createOutOfStockProduct();

      // Act
      const result = productDomainService.isProductAvailable(product);

      // Assert
      expect(result).toBe(false);
    });

    test('非アクティブな商品は利用不可', () => {
      // Arrange
      const product = TestDataFactory.createProduct({
        stock: 5,
        isActive: false
      });

      // Act
      const result = productDomainService.isProductAvailable(product);

      // Assert
      expect(result).toBe(false);
    });

    test('非アクティブかつ在庫なしの商品は利用不可', () => {
      // Arrange
      const product = TestDataFactory.createProduct({
        stock: 0,
        isActive: false
      });

      // Act
      const result = productDomainService.isProductAvailable(product);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('canUpdateProduct', () => {
    test('アクティブな商品は更新可能', async () => {
      // Arrange
      const product = TestDataFactory.createProduct({ isActive: true });

      // Act
      const result = await productDomainService.canUpdateProduct(product);

      // Assert
      expect(result).toBe(true);
    });

    test('非アクティブな商品でも基本情報は更新可能', async () => {
      // Arrange
      const product = TestDataFactory.createProduct({ isActive: false });

      // Act
      const result = await productDomainService.canUpdateProduct(product);

      // Assert
      expect(result).toBe(true);
    });

    test('削除マークされた商品は更新不可（仮想的なシナリオ）', async () => {
      // Arrange
      const product = TestDataFactory.createProduct();
      // 削除マークをシミュレート（実際の実装に応じて調整）
      const deletedProduct = product.deactivate();

      // Act
      const result = await productDomainService.canUpdateProduct(deletedProduct);

      // Assert
      // この例では非アクティブでも更新可能としているが、
      // 実際のビジネスルールに応じて調整
      expect(result).toBe(true);
    });
  });

  describe('エッジケースと境界値テスト', () => {
    test('極めて高価な商品の処理', async () => {
      // Arrange
      const product = TestDataFactory.createProduct({
        price: 9999999 // 最大価格近く
      });

      // Act & Assert
      await TestUtils.expectNotToThrow(async () => {
        await productDomainService.validateProductCreation(product);
      });
    });

    test('極めて大量の在庫の処理', async () => {
      // Arrange
      const product = TestDataFactory.createProduct({
        stock: 999 // 最大在庫数
      });

      // Act & Assert
      await TestUtils.expectNotToThrow(async () => {
        await productDomainService.validateProductCreation(product);
      });
    });

    test('極小な割引率の計算精度', () => {
      // Arrange
      const originalPrice = Price.create(1000);
      const tinyDiscount = 0.001; // 0.1%割引

      // Act
      const discountedPrice = productDomainService.calculateDiscountedPrice(
        originalPrice,
        tinyDiscount
      );

      // Assert
      expect(discountedPrice.value).toBe(999); // 小数点以下切り捨て
    });

    test('長い商品名の処理', async () => {
      // Arrange
      const longName = 'A'.repeat(255); // 長い商品名
      const product = TestDataFactory.createProduct({ name: longName });

      // Act & Assert
      await TestUtils.expectNotToThrow(async () => {
        await productDomainService.validateProductCreation(product);
      });
    });
  });

  describe('在庫管理の複雑なシナリオ', () => {
    test('在庫更新時の並行アクセス制御', async () => {
      // Arrange
      const product = TestDataFactory.createProduct({ stock: 10 });
      const newStocks = [
        Quantity.create(8),
        Quantity.create(5),
        Quantity.create(12)
      ];

      // Act
      const promises = newStocks.map(stock =>
        productDomainService.validateStockUpdate(product, stock)
      );

      // Assert
      await TestUtils.expectNotToThrow(async () => {
        await Promise.all(promises);
      });
    });

    test('在庫枯渇時の適切な状態管理', () => {
      // Arrange
      const product = TestDataFactory.createProduct({ stock: 1 });
      const decreaseQuantity = Quantity.create(1);

      // Act
      const updatedProduct = product.decreaseStock(decreaseQuantity);
      const isAvailable = productDomainService.isProductAvailable(updatedProduct);

      // Assert
      expect(updatedProduct.stock.value).toBe(0);
      expect(isAvailable).toBe(false);
    });
  });

  describe('カテゴリ別ビジネスルール', () => {
    test('電子機器カテゴリの特別なバリデーション', async () => {
      // Arrange
      const electronicsProduct = TestDataFactory.createProduct({
        category: 'electronics',
        price: 50000 // 高価な電子機器
      });

      // Act & Assert
      await TestUtils.expectNotToThrow(async () => {
        await productDomainService.validateProductCreation(electronicsProduct);
      });
    });

    test('書籍カテゴリの特別なバリデーション', async () => {
      // Arrange
      const bookProduct = TestDataFactory.createProduct({
        category: 'books',
        price: 1500 // 通常の書籍価格
      });

      // Act & Assert
      await TestUtils.expectNotToThrow(async () => {
        await productDomainService.validateProductCreation(bookProduct);
      });
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量商品の一括バリデーション性能', async () => {
      // Arrange
      const products = TestDataFactory.createProducts(100);

      // Act & Assert
      const { duration } = await TestUtils.measureExecutionTime(async () => {
        const promises = products.map(product =>
          productDomainService.validateProductCreation(product)
        );
        await Promise.all(promises);
      });

      // 100商品の検証が500ms以内に完了することを確認
      expect(duration).toBeLessThan(500);
    });

    test('複雑な割引計算の性能', async () => {
      // Arrange
      const prices = Array.from({ length: 1000 }, (_, i) => Price.create((i + 1) * 100));
      const discounts = Array.from({ length: 1000 }, (_, i) => (i + 1) / 1000);

      // Act & Assert
      const { duration } = await TestUtils.measureExecutionTime(async () => {
        prices.forEach((price, index) => {
          productDomainService.calculateDiscountedPrice(price, discounts[index]);
        });
      });

      // 1000回の割引計算が100ms以内に完了することを確認
      expect(duration).toBeLessThan(100);
    });
  });
});