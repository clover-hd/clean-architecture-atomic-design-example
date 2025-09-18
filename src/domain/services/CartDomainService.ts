import { Cart, CartItem, Product } from '../entities';
import { ProductId, Quantity, Price } from '../value-objects';
import { ICartRepository, IProductRepository } from '../repositories';
import { ProductDomainService } from './ProductDomainService';

/**
 * Cart Domain Service
 * カートに関する複雑なビジネスロジックを管理
 */
export class CartDomainService {
  constructor(
    private readonly cartRepository: ICartRepository,
    private readonly productRepository: IProductRepository,
    private readonly productDomainService: ProductDomainService
  ) {}

  /**
   * カート商品追加時のビジネスルール検証
   * @param sessionId セッションID
   * @param productId 商品ID
   * @param quantity 数量
   * @throws {Error} バリデーション失敗時
   */
  async validateCartItemAddition(
    sessionId: string,
    productId: ProductId,
    quantity: Quantity
  ): Promise<void> {
    // 商品存在チェック
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId.value}`);
    }

    // 商品販売可能性チェック
    if (!product.isAvailableForSale()) {
      throw new Error(`Product "${product.name}" is not available for sale`);
    }

    // 在庫チェック
    this.productDomainService.validateStockDecrease(product, quantity);

    // カート制限チェック
    await this.validateCartLimits(sessionId, productId, quantity);
  }

  /**
   * カート制限チェック
   * @param sessionId セッションID
   * @param productId 商品ID
   * @param quantity 追加数量
   * @throws {Error} 制限超過の場合
   */
  private async validateCartLimits(
    sessionId: string,
    productId: ProductId,
    quantity: Quantity
  ): Promise<void> {
    // カート内商品種類数制限（20種類まで）
    const currentItemCount = await this.cartRepository.getItemCount(sessionId);
    const isNewProduct = !(await this.cartRepository.existsItem(sessionId, productId));

    if (isNewProduct && currentItemCount >= 20) {
      throw new Error('Cart item limit exceeded (maximum 20 different products)');
    }

    // 商品あたり数量制限（99個まで）
    const existingItem = await this.cartRepository.findCartItemBySessionAndProduct(
      sessionId,
      productId
    );

    const totalQuantity = existingItem
      ? existingItem.quantity.value + quantity.value
      : quantity.value;

    if (totalQuantity > 99) {
      throw new Error('Product quantity limit exceeded (maximum 99 per product)');
    }

    // カート内総数量制限（200個まで）
    const currentTotalQuantity = await this.cartRepository.getTotalQuantity(sessionId);
    if (currentTotalQuantity + quantity.value > 200) {
      throw new Error('Cart total quantity limit exceeded (maximum 200 items)');
    }
  }

  /**
   * カート数量更新時のビジネスルール検証
   * @param itemId カート項目ID
   * @param newQuantity 新しい数量
   * @throws {Error} バリデーション失敗時
   */
  async validateCartItemQuantityUpdate(
    itemId: number,
    newQuantity: Quantity
  ): Promise<void> {
    // カート項目存在チェック
    const cartItem = await this.cartRepository.findCartItemById(itemId);
    if (!cartItem) {
      throw new Error(`Cart item not found: ${itemId}`);
    }

    // 商品存在チェック
    const product = await this.productRepository.findById(cartItem.productId);
    if (!product) {
      throw new Error(`Product not found: ${cartItem.productId.value}`);
    }

    // 商品販売可能性チェック
    if (!product.isAvailableForSale()) {
      throw new Error(`Product "${product.name}" is not available for sale`);
    }

    // 在庫チェック
    this.productDomainService.validateStockDecrease(product, newQuantity);

    // 数量制限チェック（99個まで）
    if (newQuantity.value > 99) {
      throw new Error('Product quantity limit exceeded (maximum 99 per product)');
    }
  }

  /**
   * カートの価格整合性チェック
   * @param cart カート
   * @param products 商品リスト
   * @returns 整合性チェック結果
   */
  validateCartPricing(cart: Cart, products: Product[]): CartPricingValidation {
    const inconsistencies: PriceInconsistency[] = [];
    let totalCalculatedAmount = Price.create(0);

    for (const cartItem of cart.items) {
      const product = products.find(p => p.id.equals(cartItem.productId));

      if (!product) {
        inconsistencies.push({
          productId: cartItem.productId,
          issue: 'Product not found',
          cartItemId: cartItem.id
        });
        continue;
      }

      const calculatedSubtotal = cartItem.calculateSubtotal(product);
      totalCalculatedAmount = totalCalculatedAmount.add(calculatedSubtotal);

      // 商品の可用性チェック
      if (!cartItem.isAvailable(product)) {
        inconsistencies.push({
          productId: cartItem.productId,
          issue: 'Product not available or insufficient stock',
          cartItemId: cartItem.id,
          currentPrice: product.price,
          availableStock: product.stock
        });
      }
    }

    const displayTotalAmount = cart.getTotalAmount(products);

    return {
      isValid: inconsistencies.length === 0,
      inconsistencies,
      calculatedTotal: totalCalculatedAmount,
      displayTotal: displayTotalAmount,
      hasPriceDiscrepancy: !totalCalculatedAmount.equals(displayTotalAmount)
    };
  }

  /**
   * カートの最適化提案
   * @param cart カート
   * @param products 商品リスト
   * @returns 最適化提案
   */
  generateCartOptimizationSuggestions(cart: Cart, products: Product[]): CartOptimizationSuggestions {
    const suggestions: string[] = [];
    const unavailableItems: CartItem[] = [];
    let potentialSavings = Price.create(0);

    for (const cartItem of cart.items) {
      const product = products.find(p => p.id.equals(cartItem.productId));

      if (!product) {
        unavailableItems.push(cartItem);
        suggestions.push(`Remove unavailable product (ID: ${cartItem.productId.value})`);
        continue;
      }

      if (!cartItem.isAvailable(product)) {
        unavailableItems.push(cartItem);
        if (product.isOutOfStock()) {
          suggestions.push(`"${product.name}" is out of stock - remove or find alternative`);
        } else if (!product.isActive) {
          suggestions.push(`"${product.name}" is no longer available - remove from cart`);
        } else {
          suggestions.push(
            `Reduce quantity of "${product.name}" to available stock (${product.stock.value})`
          );
        }
      }
    }

    // 送料無料の提案（10,000円以上で送料無料の場合）
    const currentTotal = cart.getTotalAmount(products);
    const freeShippingThreshold = Price.create(10000);
    if (currentTotal.isLessThan(freeShippingThreshold)) {
      const needed = freeShippingThreshold.subtract(currentTotal);
      suggestions.push(
        `Add ${needed.toFormattedString()} more for free shipping`
      );
    }

    return {
      suggestions,
      unavailableItems,
      potentialSavings,
      canProceedToCheckout: unavailableItems.length === 0,
      totalOptimizationImpact: this.calculateOptimizationImpact(cart, unavailableItems)
    };
  }

  /**
   * 最適化インパクト計算
   */
  private calculateOptimizationImpact(cart: Cart, unavailableItems: CartItem[]): number {
    if (cart.itemCount === 0) return 0;
    return (unavailableItems.length / cart.itemCount) * 100;
  }

  /**
   * カート放棄リスク分析
   * @param cart カート
   * @param sessionStartTime セッション開始時間
   * @returns 放棄リスク分析
   */
  analyzeCartAbandonmentRisk(cart: Cart, sessionStartTime: Date): CartAbandonmentAnalysis {
    const now = new Date();
    const sessionDuration = now.getTime() - sessionStartTime.getTime();
    const minutesInSession = sessionDuration / (1000 * 60);

    let riskScore = 0;
    const riskFactors: string[] = [];

    // セッション時間による分析
    if (minutesInSession > 30) {
      riskScore += 30;
      riskFactors.push('Extended session duration');
    }

    // カート金額による分析
    if (cart.isEmpty()) {
      riskScore += 50;
      riskFactors.push('Empty cart');
    } else {
      const totalQuantity = cart.getTotalQuantity();
      if (totalQuantity === 1) {
        riskScore += 20;
        riskFactors.push('Single item in cart');
      }
    }

    // カート項目数による分析
    if (cart.itemCount > 10) {
      riskScore += 25;
      riskFactors.push('High number of items (decision fatigue)');
    }

    let riskLevel: 'low' | 'medium' | 'high';
    if (riskScore < 30) riskLevel = 'low';
    else if (riskScore < 70) riskLevel = 'medium';
    else riskLevel = 'high';

    return {
      riskScore: Math.min(riskScore, 100),
      riskLevel,
      riskFactors,
      sessionDurationMinutes: Math.floor(minutesInSession),
      recommendations: this.generateAbandonmentPreventionRecommendations(riskLevel, riskFactors)
    };
  }

  /**
   * カート放棄防止推奨策生成
   */
  private generateAbandonmentPreventionRecommendations(
    riskLevel: 'low' | 'medium' | 'high',
    riskFactors: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'high') {
      recommendations.push('Show limited-time discount offer');
      recommendations.push('Display free shipping reminder');
      recommendations.push('Suggest popular alternatives');
    }

    if (riskFactors.includes('Extended session duration')) {
      recommendations.push('Offer assistance via chat');
    }

    if (riskFactors.includes('High number of items (decision fatigue)')) {
      recommendations.push('Suggest creating wishlist');
      recommendations.push('Highlight best sellers');
    }

    return recommendations;
  }

  /**
   * カート統計情報生成
   * @param timeframe 集計期間（日数）
   * @returns カート統計情報
   */
  async generateCartStatistics(timeframe: number = 7): Promise<ExtendedCartStatistics> {
    const basicStats = await this.cartRepository.getCartStatistics();

    const since = new Date();
    since.setDate(since.getDate() - timeframe);

    const activeSessions = await this.cartRepository.getActiveSessionCount(since);

    return {
      ...basicStats,
      activeSessions,
      abandonmentRate: activeSessions > 0 ? ((activeSessions - basicStats.totalSessions) / activeSessions) * 100 : 0,
      averageSessionDuration: 0, // 実装では別途計算が必要
      conversionRate: 0, // 注文データとの連携が必要
      timeframe
    };
  }
}

/**
 * カート価格整合性検証結果
 */
export interface CartPricingValidation {
  /** 整合性が取れているか */
  isValid: boolean;
  /** 不整合項目 */
  inconsistencies: PriceInconsistency[];
  /** 計算上の合計金額 */
  calculatedTotal: Price;
  /** 表示上の合計金額 */
  displayTotal: Price;
  /** 価格差異があるか */
  hasPriceDiscrepancy: boolean;
}

/**
 * 価格不整合情報
 */
export interface PriceInconsistency {
  /** 商品ID */
  productId: ProductId;
  /** 問題の内容 */
  issue: string;
  /** カート項目ID */
  cartItemId: number;
  /** 現在価格 */
  currentPrice?: Price;
  /** 利用可能在庫 */
  availableStock?: Quantity;
}

/**
 * カート最適化提案
 */
export interface CartOptimizationSuggestions {
  /** 提案リスト */
  suggestions: string[];
  /** 利用不可項目 */
  unavailableItems: CartItem[];
  /** 潜在的節約額 */
  potentialSavings: Price;
  /** チェックアウト可能か */
  canProceedToCheckout: boolean;
  /** 最適化インパクト（%） */
  totalOptimizationImpact: number;
}

/**
 * カート放棄リスク分析
 */
export interface CartAbandonmentAnalysis {
  /** リスクスコア（0-100） */
  riskScore: number;
  /** リスクレベル */
  riskLevel: 'low' | 'medium' | 'high';
  /** リスク要因 */
  riskFactors: string[];
  /** セッション継続時間（分） */
  sessionDurationMinutes: number;
  /** 防止推奨策 */
  recommendations: string[];
}

/**
 * 拡張カート統計情報
 */
export interface ExtendedCartStatistics {
  /** 総セッション数 */
  totalSessions: number;
  /** 総カート項目数 */
  totalItems: number;
  /** 平均カート項目数 */
  averageItemsPerCart: number;
  /** 最も人気な商品ID */
  mostPopularProductIds: number[];
  /** 期限切れ項目数 */
  expiredItemCount: number;
  /** アクティブセッション数 */
  activeSessions: number;
  /** 放棄率（%） */
  abandonmentRate: number;
  /** 平均セッション継続時間（分） */
  averageSessionDuration: number;
  /** コンバージョン率（%） */
  conversionRate: number;
  /** 集計期間（日数） */
  timeframe: number;
}