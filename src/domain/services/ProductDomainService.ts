import { Product } from '../entities/Product';
import { ProductId, Price, Quantity, ProductCategory } from '../value-objects';
import { IProductRepository } from '../repositories';

/**
 * Product Domain Service
 * 商品に関する複雑なビジネスロジックを管理
 */
export class ProductDomainService {
  constructor(private readonly productRepository: IProductRepository) {}

  /**
   * 商品名の重複チェック
   * @param name チェックする商品名
   * @param excludeProductId 除外する商品ID（更新時）
   * @throws {Error} 重複している場合
   */
  async validateProductNameUniqueness(name: string, excludeProductId?: ProductId): Promise<void> {
    const isDuplicate = await this.productRepository.existsByName(name, excludeProductId);
    if (isDuplicate) {
      throw new Error(`Product name "${name}" is already in use`);
    }
  }

  /**
   * 商品登録時のビジネスルール検証
   * @param name 商品名
   * @param price 価格
   * @param stock 在庫数
   * @param category カテゴリ
   * @throws {Error} バリデーション失敗時
   */
  async validateProductRegistration(
    name: string,
    price: Price,
    stock: Quantity,
    category: ProductCategory
  ): Promise<void> {
    // 商品名重複チェック
    await this.validateProductNameUniqueness(name);

    // 商品名のビジネスルール検証
    this.validateProductName(name);

    // 価格のビジネスルール検証
    this.validateProductPrice(price, category);

    // 在庫のビジネスルール検証
    this.validateProductStock(stock);
  }

  /**
   * 商品名のビジネスルール検証
   * @param name 商品名
   * @throws {Error} バリデーション失敗時
   */
  private validateProductName(name: string): void {
    // 禁止文字チェック
    const prohibitedChars = /[<>\"'&]/;
    if (prohibitedChars.test(name)) {
      throw new Error('Product name contains prohibited characters');
    }

    // 商品名の最小長チェック
    if (name.trim().length < 3) {
      throw new Error('Product name must be at least 3 characters long');
    }

    // 特定の禁止語チェック
    const prohibitedWords = ['test', 'sample', 'dummy', 'fake'];
    const lowerName = name.toLowerCase();
    for (const prohibited of prohibitedWords) {
      if (lowerName.includes(prohibited)) {
        throw new Error(`Product name cannot contain prohibited word: ${prohibited}`);
      }
    }
  }

  /**
   * 商品価格のビジネスルール検証
   * @param price 価格
   * @param category カテゴリ
   * @throws {Error} バリデーション失敗時
   */
  private validateProductPrice(price: Price, category: ProductCategory): void {
    // カテゴリ別最低価格チェック
    const minimumPrices: Record<string, number> = {
      electronics: 1000,
      fashion: 500,
      books: 100,
      home: 300,
      sports: 500
    };

    const minimumPrice = minimumPrices[category.value] || 100;
    if (price.value < minimumPrice) {
      throw new Error(
        `Price for ${category.getJapaneseName()} category must be at least ¥${minimumPrice}`
      );
    }

    // 高額商品の警告（100万円以上）
    if (price.value >= 1000000) {
      // Domain Serviceでは例外ではなくログ出力に留める
      console.warn(`High-value product detected: ¥${price.toFormattedString()}`);
    }
  }

  /**
   * 在庫数のビジネスルール検証
   * @param stock 在庫数
   * @throws {Error} バリデーション失敗時
   */
  private validateProductStock(stock: Quantity): void {
    // 大量在庫の警告（1000個以上）
    if (stock.value >= 1000) {
      console.warn(`Large stock quantity detected: ${stock.value} units`);
    }
  }

  /**
   * 在庫減少の妥当性チェック
   * @param product 商品
   * @param decreaseQuantity 減少数量
   * @throws {Error} 在庫不足の場合
   */
  validateStockDecrease(product: Product, decreaseQuantity: Quantity): void {
    if (!product.hasEnoughStock(decreaseQuantity)) {
      throw new Error(
        `Insufficient stock. Available: ${product.stock.value}, Required: ${decreaseQuantity.value}`
      );
    }

    if (!product.isAvailableForSale()) {
      throw new Error('Product is not available for sale');
    }
  }

  /**
   * 商品の販売可能性チェック
   * @param product 商品
   * @param quantity 販売予定数量
   * @returns 販売可能な場合true
   */
  canSellProduct(product: Product, quantity: Quantity): boolean {
    try {
      this.validateStockDecrease(product, quantity);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 複数商品の一括販売可能性チェック
   * @param productQuantityPairs 商品と数量のペア
   * @returns 全て販売可能な場合true
   */
  canSellProducts(productQuantityPairs: Array<{ product: Product; quantity: Quantity }>): boolean {
    return productQuantityPairs.every(({ product, quantity }) =>
      this.canSellProduct(product, quantity)
    );
  }

  /**
   * 商品価格の妥当性チェック（競合比較）
   * @param product 商品
   * @param category カテゴリ
   * @returns 価格推奨情報
   */
  async analyzePricing(product: Product, category: ProductCategory): Promise<PricingAnalysis> {
    // 同カテゴリの商品を取得
    const categoryProducts = await this.productRepository.findByCategory(category, 100);

    if (categoryProducts.length === 0) {
      return {
        isCompetitive: true,
        recommendation: 'No competitor data available',
        averagePrice: product.price,
        pricePosition: 'unknown'
      };
    }

    // 平均価格計算
    const totalPrice = categoryProducts.reduce((sum, p) => sum + p.price.value, 0);
    const averagePrice = Price.create(Math.floor(totalPrice / categoryProducts.length));

    // 価格ポジション判定
    let pricePosition: 'low' | 'average' | 'high';
    if (product.price.value < averagePrice.value * 0.8) {
      pricePosition = 'low';
    } else if (product.price.value > averagePrice.value * 1.2) {
      pricePosition = 'high';
    } else {
      pricePosition = 'average';
    }

    return {
      isCompetitive: pricePosition !== 'high',
      recommendation: this.generatePricingRecommendation(pricePosition, averagePrice),
      averagePrice,
      pricePosition
    };
  }

  /**
   * 価格推奨メッセージ生成
   */
  private generatePricingRecommendation(
    position: 'low' | 'average' | 'high',
    averagePrice: Price
  ): string {
    switch (position) {
      case 'low':
        return 'Price is below market average. Consider increasing for better margins.';
      case 'high':
        return `Price is above market average (${averagePrice.toFormattedString()}). Consider reducing for competitiveness.`;
      default:
        return 'Price is competitive with market average.';
    }
  }

  /**
   * 商品統計情報の生成
   * @returns 商品統計情報
   */
  async generateProductStatistics(): Promise<ProductStatistics> {
    const totalProducts = await this.productRepository.count();
    const activeProducts = await this.productRepository.countActive();
    const inStockProducts = await this.productRepository.countInStock();

    // カテゴリ別統計
    const categoryStats: Record<string, number> = {};
    for (const categoryValue of ProductCategory.VALID_CATEGORIES) {
      const category = ProductCategory.create(categoryValue);
      categoryStats[categoryValue] = await this.productRepository.countByCategory(category);
    }

    return {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts,
      inStockProducts,
      outOfStockProducts: totalProducts - inStockProducts,
      categoryDistribution: categoryStats,
      stockRate: totalProducts > 0 ? (inStockProducts / totalProducts) * 100 : 0,
      activeRate: totalProducts > 0 ? (activeProducts / totalProducts) * 100 : 0
    };
  }

  /**
   * 低在庫商品の検出
   * @param threshold 低在庫の閾値
   * @returns 低在庫商品リスト
   */
  async findLowStockProducts(threshold: number = 10): Promise<Product[]> {
    const allProducts = await this.productRepository.findAll();
    return allProducts.filter(product =>
      product.isActive &&
      product.stock.value <= threshold &&
      product.stock.value > 0
    );
  }

  /**
   * 在庫切れ商品の検出
   * @returns 在庫切れ商品リスト
   */
  async findOutOfStockProducts(): Promise<Product[]> {
    return await this.productRepository.findOutOfStock();
  }
}

/**
 * 価格分析結果
 */
export interface PricingAnalysis {
  /** 競合と比較して妥当な価格か */
  isCompetitive: boolean;
  /** 価格推奨メッセージ */
  recommendation: string;
  /** カテゴリ平均価格 */
  averagePrice: Price;
  /** 価格ポジション */
  pricePosition: 'low' | 'average' | 'high' | 'unknown';
}

/**
 * 商品統計情報
 */
export interface ProductStatistics {
  /** 総商品数 */
  totalProducts: number;
  /** アクティブ商品数 */
  activeProducts: number;
  /** 非アクティブ商品数 */
  inactiveProducts: number;
  /** 在庫あり商品数 */
  inStockProducts: number;
  /** 在庫切れ商品数 */
  outOfStockProducts: number;
  /** カテゴリ別分布 */
  categoryDistribution: Record<string, number>;
  /** 在庫率（%） */
  stockRate: number;
  /** アクティブ率（%） */
  activeRate: number;
}