import { Cart, CartItem } from '../entities';
import { ProductId, Quantity } from '../value-objects';

/**
 * Cart Repository Interface
 * カートデータアクセスの抽象化
 * 依存関係逆転原則により、Domain層で定義
 */
export interface ICartRepository {
  /**
   * セッションIDでカートを取得
   * @param sessionId セッションID
   * @returns カートエンティティまたはnull
   */
  findBySessionId(sessionId: string): Promise<Cart | null>;

  /**
   * セッションIDでカート項目を取得
   * @param sessionId セッションID
   * @returns カート項目エンティティの配列
   */
  findCartItemsBySessionId(sessionId: string): Promise<CartItem[]>;

  /**
   * カート項目IDでカート項目を取得
   * @param itemId カート項目ID
   * @returns カート項目エンティティまたはnull
   */
  findCartItemById(itemId: number): Promise<CartItem | null>;

  /**
   * セッションIDと商品IDでカート項目を取得
   * @param sessionId セッションID
   * @param productId 商品ID
   * @returns カート項目エンティティまたはnull
   */
  findCartItemBySessionAndProduct(sessionId: string, productId: ProductId): Promise<CartItem | null>;

  /**
   * カートを保存
   * @param cart カートエンティティ
   * @returns 保存されたカートエンティティ
   */
  save(cart: Cart): Promise<Cart>;

  /**
   * カート項目を追加
   * @param sessionId セッションID
   * @param productId 商品ID
   * @param quantity 数量
   * @returns 追加されたカート項目エンティティ
   */
  addItem(sessionId: string, productId: ProductId, quantity: Quantity): Promise<CartItem>;

  /**
   * カート項目を更新
   * @param itemId カート項目ID
   * @param quantity 新しい数量
   * @returns 更新されたカート項目エンティティ
   */
  updateItem(itemId: number, quantity: Quantity): Promise<CartItem>;

  /**
   * カート項目の数量を更新
   * @param sessionId セッションID
   * @param productId 商品ID
   * @param quantity 新しい数量
   * @returns 更新されたカート項目エンティティ
   */
  updateItemQuantity(sessionId: string, productId: ProductId, quantity: Quantity): Promise<CartItem>;

  /**
   * カート項目を削除
   * @param itemId カート項目ID
   */
  removeItem(itemId: number): Promise<void>;

  /**
   * セッションと商品でカート項目を削除
   * @param sessionId セッションID
   * @param productId 商品ID
   */
  removeItemBySessionAndProduct(sessionId: string, productId: ProductId): Promise<void>;

  /**
   * セッションの全カート項目を削除
   * @param sessionId セッションID
   */
  clearCart(sessionId: string): Promise<void>;

  /**
   * セッションのカート項目数を取得
   * @param sessionId セッションID
   * @returns カート項目数
   */
  getItemCount(sessionId: string): Promise<number>;

  /**
   * セッションのカート内総数量を取得
   * @param sessionId セッションID
   * @returns カート内総数量
   */
  getTotalQuantity(sessionId: string): Promise<number>;

  /**
   * カート項目の存在チェック
   * @param sessionId セッションID
   * @param productId 商品ID
   * @returns 存在する場合true
   */
  existsItem(sessionId: string, productId: ProductId): Promise<boolean>;

  /**
   * 期限切れのカート項目を削除
   * @param expirationDate 期限日時
   * @returns 削除された項目数
   */
  removeExpiredItems(expirationDate: Date): Promise<number>;

  /**
   * アクティブなセッション数を取得
   * @param since 指定日時以降
   * @returns アクティブセッション数
   */
  getActiveSessionCount(since: Date): Promise<number>;

  /**
   * 商品がカートに入っている数を取得
   * @param productId 商品ID
   * @returns カートに入っている数
   */
  getProductCartCount(productId: ProductId): Promise<number>;

  /**
   * 指定商品を含む全カート項目を取得
   * @param productId 商品ID
   * @returns カート項目エンティティの配列
   */
  findItemsByProduct(productId: ProductId): Promise<CartItem[]>;

  /**
   * カート統計情報を取得
   * @returns カート統計情報
   */
  getCartStatistics(): Promise<CartStatistics>;
}

/**
 * カート統計情報
 */
export interface CartStatistics {
  /** 総セッション数 */
  totalSessions: number;
  /** 総カート項目数 */
  totalItems: number;
  /** 平均カート項目数 */
  averageItemsPerCart: number;
  /** 最も人気な商品ID（カート追加数順） */
  mostPopularProductIds: number[];
  /** 期限切れ項目数 */
  expiredItemCount: number;
}