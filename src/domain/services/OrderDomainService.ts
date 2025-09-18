import { Order, OrderItem, Product, User, Cart } from '../entities';
import { OrderId, UserId, Price, Quantity, OrderStatus } from '../value-objects';
import { IOrderRepository, IProductRepository, IUserRepository } from '../repositories';
import { ProductDomainService } from './ProductDomainService';

/**
 * Order Domain Service
 * 注文に関する複雑なビジネスロジックを管理
 */
export class OrderDomainService {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductRepository,
    private readonly userRepository: IUserRepository,
    private readonly productDomainService: ProductDomainService
  ) {}

  /**
   * 注文作成時のビジネスルール検証
   * @param user 注文ユーザー
   * @param cart カート
   * @param products 商品リスト
   * @throws {Error} バリデーション失敗時
   */
  async validateOrderCreation(user: User, cart: Cart, products: Product[]): Promise<void> {
    // カートが空でないことを確認
    if (cart.isEmpty()) {
      throw new Error('Cannot create order with empty cart');
    }

    // ユーザーの注文制限チェック
    await this.validateUserOrderLimits(user);

    // 商品の販売可能性チェック
    await this.validateProductAvailability(cart, products);

    // 在庫の充足性チェック
    this.validateStockSufficiency(cart, products);

    // 注文金額の妥当性チェック
    this.validateOrderAmount(cart, products);
  }

  /**
   * ユーザーの注文制限チェック
   * @param user ユーザー
   * @throws {Error} 制限に引っかかる場合
   */
  private async validateUserOrderLimits(user: User): Promise<void> {
    // 24時間以内の注文数制限（一般ユーザー：5件、管理者：制限なし）
    if (!user.isAdmin) {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const recentOrders = await this.orderRepository.findByCriteria({
        userId: user.id,
        startDate: oneDayAgo,
        limit: 6
      });

      if (recentOrders.length >= 5) {
        throw new Error('Daily order limit exceeded (5 orders per day)');
      }
    }

    // 未完了注文数制限（10件まで）
    const pendingOrders = await this.orderRepository.findByUserIdAndStatus(
      user.id,
      OrderStatus.create('pending')
    );

    if (pendingOrders.length >= 10) {
      throw new Error('Too many pending orders. Please complete or cancel existing orders.');
    }
  }

  /**
   * 商品の販売可能性チェック
   * @param cart カート
   * @param products 商品リスト
   * @throws {Error} 販売不可商品がある場合
   */
  private async validateProductAvailability(cart: Cart, products: Product[]): Promise<void> {
    for (const cartItem of cart.items) {
      const product = products.find(p => p.id.equals(cartItem.productId));

      if (!product) {
        throw new Error(`Product not found: ${cartItem.productId.value}`);
      }

      if (!product.isAvailableForSale()) {
        throw new Error(`Product "${product.name}" is not available for sale`);
      }
    }
  }

  /**
   * 在庫の充足性チェック
   * @param cart カート
   * @param products 商品リスト
   * @throws {Error} 在庫不足の場合
   */
  private validateStockSufficiency(cart: Cart, products: Product[]): void {
    for (const cartItem of cart.items) {
      const product = products.find(p => p.id.equals(cartItem.productId));

      if (!product) {
        throw new Error(`Product not found: ${cartItem.productId.value}`);
      }

      this.productDomainService.validateStockDecrease(product, cartItem.quantity);
    }
  }

  /**
   * 注文金額の妥当性チェック
   * @param cart カート
   * @param products 商品リスト
   * @throws {Error} 金額が異常な場合
   */
  private validateOrderAmount(cart: Cart, products: Product[]): void {
    const totalAmount = cart.getTotalAmount(products);

    // 最低注文金額チェック
    const minimumOrderAmount = Price.create(100);
    if (totalAmount.isLessThan(minimumOrderAmount)) {
      throw new Error(
        `Minimum order amount is ${minimumOrderAmount.toFormattedString()}`
      );
    }

    // 最高注文金額チェック（不正防止）
    const maximumOrderAmount = Price.create(1000000);
    if (totalAmount.isGreaterThan(maximumOrderAmount)) {
      throw new Error(
        `Maximum order amount is ${maximumOrderAmount.toFormattedString()}`
      );
    }
  }

  /**
   * 注文ステータス変更の妥当性チェック
   * @param order 注文
   * @param newStatus 新しいステータス
   * @param executingUser 実行ユーザー
   * @throws {Error} 変更できない場合
   */
  async validateStatusChange(
    order: Order,
    newStatus: OrderStatus,
    executingUser: User
  ): Promise<void> {
    // ステータス遷移ルールチェック
    if (!order.status.canTransitionTo(newStatus.value)) {
      throw new Error(
        `Cannot transition from ${order.status.value} to ${newStatus.value}`
      );
    }

    // 権限チェック
    this.validateStatusChangePermission(order, newStatus, executingUser);

    // ビジネスルールチェック
    await this.validateStatusChangeBusinessRules(order, newStatus);
  }

  /**
   * ステータス変更権限チェック
   * @param order 注文
   * @param newStatus 新しいステータス
   * @param executingUser 実行ユーザー
   * @throws {Error} 権限不足の場合
   */
  private validateStatusChangePermission(
    order: Order,
    newStatus: OrderStatus,
    executingUser: User
  ): void {
    // 自分の注文のキャンセルは可能
    if (newStatus.is('cancelled') && order.isForUser(executingUser.id)) {
      return;
    }

    // その他のステータス変更は管理者のみ
    if (!executingUser.isAdmin) {
      throw new Error('Only administrators can change order status');
    }
  }

  /**
   * ステータス変更のビジネスルールチェック
   * @param order 注文
   * @param newStatus 新しいステータス
   * @throws {Error} ビジネスルール違反の場合
   */
  private async validateStatusChangeBusinessRules(
    order: Order,
    newStatus: OrderStatus
  ): Promise<void> {
    // 発送済み → 配送完了への変更時間制限（発送から30日以内）
    if (order.status.is('shipped') && newStatus.is('delivered')) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (order.updatedAt < thirtyDaysAgo) {
        throw new Error('Cannot mark as delivered after 30 days from shipment');
      }
    }

    // 確定注文のキャンセル制限（確定から24時間以内のみ）
    if (order.status.is('confirmed') && newStatus.is('cancelled')) {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      if (order.updatedAt < oneDayAgo) {
        throw new Error('Cannot cancel confirmed order after 24 hours');
      }
    }
  }

  /**
   * 注文キャンセル時の在庫復元処理
   * @param order 注文
   * @param products 商品リスト
   * @returns 更新された商品リスト
   */
  async processOrderCancellation(order: Order, products: Product[]): Promise<Product[]> {
    const updatedProducts: Product[] = [];

    for (const orderItem of order.items) {
      const product = products.find(p => p.id.equals(orderItem.productId));

      if (!product) {
        console.warn(`Product not found for stock restoration: ${orderItem.productId.value}`);
        continue;
      }

      // 在庫を復元
      const restoredProduct = product.increaseStock(orderItem.quantity);
      updatedProducts.push(restoredProduct);
    }

    return updatedProducts;
  }

  /**
   * 注文完了時の在庫減少処理
   * @param order 注文
   * @param products 商品リスト
   * @returns 更新された商品リスト
   */
  async processOrderCompletion(order: Order, products: Product[]): Promise<Product[]> {
    const updatedProducts: Product[] = [];

    for (const orderItem of order.items) {
      const product = products.find(p => p.id.equals(orderItem.productId));

      if (!product) {
        throw new Error(`Product not found: ${orderItem.productId.value}`);
      }

      // 在庫を減少
      const updatedProduct = product.decreaseStock(orderItem.quantity);
      updatedProducts.push(updatedProduct);
    }

    return updatedProducts;
  }

  /**
   * 注文の売上貢献度計算
   * @param order 注文
   * @returns 売上貢献度情報
   */
  calculateOrderValue(order: Order): OrderValueAnalysis {
    const totalAmount = order.totalAmount;
    const itemCount = order.itemCount;
    const totalQuantity = order.getTotalQuantity();

    return {
      totalAmount,
      averageItemPrice: Price.create(Math.floor(totalAmount.value / itemCount)),
      averageQuantityPerItem: Math.floor(totalQuantity / itemCount),
      orderSize: this.categorizeOrderSize(totalAmount),
      profitabilityScore: this.calculateProfitabilityScore(totalAmount, itemCount)
    };
  }

  /**
   * 注文サイズのカテゴリ化
   */
  private categorizeOrderSize(amount: Price): 'small' | 'medium' | 'large' | 'enterprise' {
    if (amount.value < 5000) return 'small';
    if (amount.value < 20000) return 'medium';
    if (amount.value < 100000) return 'large';
    return 'enterprise';
  }

  /**
   * 収益性スコア計算
   */
  private calculateProfitabilityScore(amount: Price, itemCount: number): number {
    // 注文金額と商品数に基づく簡易スコア（1-100）
    const amountScore = Math.min(amount.value / 1000, 50);
    const itemScore = Math.min(itemCount * 10, 50);
    return Math.floor(amountScore + itemScore);
  }

  /**
   * 重複注文の検出
   * @param user ユーザー
   * @param cart カート
   * @returns 重複の可能性がある場合true
   */
  async detectDuplicateOrder(user: User, cart: Cart): Promise<boolean> {
    // 過去1時間以内の注文をチェック
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentOrders = await this.orderRepository.findByCriteria({
      userId: user.id,
      startDate: oneHourAgo,
      limit: 10
    });

    // カート内容と類似する注文があるかチェック
    for (const order of recentOrders) {
      if (this.isOrderSimilarToCart(order, cart)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 注文とカートの類似度チェック
   */
  private isOrderSimilarToCart(order: Order, cart: Cart): boolean {
    // 商品数が同じかチェック
    if (order.itemCount !== cart.itemCount) {
      return false;
    }

    // 含まれる商品IDが同じかチェック
    const orderProductIds = order.items.map(item => item.productId.value);
    const cartProductIds = cart.items.map(item => item.productId.value);

    return orderProductIds.every(id => cartProductIds.includes(id)) &&
           cartProductIds.every(id => orderProductIds.includes(id));
  }
}

/**
 * 注文価値分析結果
 */
export interface OrderValueAnalysis {
  /** 注文総額 */
  totalAmount: Price;
  /** 商品平均価格 */
  averageItemPrice: Price;
  /** 商品あたり平均数量 */
  averageQuantityPerItem: number;
  /** 注文サイズカテゴリ */
  orderSize: 'small' | 'medium' | 'large' | 'enterprise';
  /** 収益性スコア（1-100） */
  profitabilityScore: number;
}