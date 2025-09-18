import { Product } from '../entities/Product';
import { ProductId, ProductCategory, Price } from '../value-objects';

/**
 * Product Repository Interface
 * 商品データアクセスの抽象化
 * 依存関係逆転原則により、Domain層で定義
 */
export interface IProductRepository {
  /**
   * 商品IDで商品を取得
   * @param id 商品ID
   * @returns 商品エンティティまたはnull
   */
  findById(id: ProductId): Promise<Product | null>;

  /**
   * 複数の商品IDで商品を取得
   * @param ids 商品IDの配列
   * @returns 商品エンティティの配列
   */
  findByIds(ids: ProductId[]): Promise<Product[]>;

  /**
   * 商品名で検索
   * @param name 商品名（部分一致）
   * @param limit 取得件数制限
   * @param offset 取得開始位置
   * @returns 商品エンティティの配列
   */
  findByName(name: string, limit?: number, offset?: number): Promise<Product[]>;

  /**
   * カテゴリで商品を取得
   * @param category 商品カテゴリ
   * @param limit 取得件数制限
   * @param offset 取得開始位置
   * @returns 商品エンティティの配列
   */
  findByCategory(category: ProductCategory, limit?: number, offset?: number): Promise<Product[]>;

  /**
   * 価格範囲で商品を検索
   * @param minPrice 最低価格
   * @param maxPrice 最高価格
   * @param limit 取得件数制限
   * @param offset 取得開始位置
   * @returns 商品エンティティの配列
   */
  findByPriceRange(minPrice: Price, maxPrice: Price, limit?: number, offset?: number): Promise<Product[]>;

  /**
   * アクティブな商品を取得
   * @param limit 取得件数制限
   * @param offset 取得開始位置
   * @returns 商品エンティティの配列
   */
  findActive(limit?: number, offset?: number): Promise<Product[]>;

  /**
   * 在庫ありの商品を取得
   * @param limit 取得件数制限
   * @param offset 取得開始位置
   * @returns 商品エンティティの配列
   */
  findInStock(limit?: number, offset?: number): Promise<Product[]>;

  /**
   * 在庫切れの商品を取得
   * @param limit 取得件数制限
   * @param offset 取得開始位置
   * @returns 商品エンティティの配列
   */
  findOutOfStock(limit?: number, offset?: number): Promise<Product[]>;

  /**
   * 複合条件で商品を検索
   * @param criteria 検索条件
   * @returns 商品エンティティの配列
   */
  findByCriteria(criteria: ProductSearchCriteria): Promise<Product[]>;

  /**
   * 全商品を取得
   * @param limit 取得件数制限
   * @param offset 取得開始位置
   * @returns 商品エンティティの配列
   */
  findAll(limit?: number, offset?: number): Promise<Product[]>;

  /**
   * 商品を保存（作成・更新）
   * @param product 商品エンティティ
   * @returns 保存された商品エンティティ
   */
  save(product: Product): Promise<Product>;

  /**
   * 新規商品を作成
   * @param product 商品エンティティ
   * @returns 作成された商品エンティティ
   */
  create(product: Product): Promise<Product>;

  /**
   * 商品情報を更新
   * @param product 商品エンティティ
   * @returns 更新された商品エンティティ
   */
  update(product: Product): Promise<Product>;

  /**
   * 商品を削除
   * @param id 商品ID
   */
  delete(id: ProductId): Promise<void>;

  /**
   * 商品の存在チェック
   * @param id 商品ID
   * @returns 存在する場合true
   */
  existsById(id: ProductId): Promise<boolean>;

  /**
   * 商品名の重複チェック
   * @param name 商品名
   * @param excludeProductId 除外する商品ID（更新時）
   * @returns 重複している場合true
   */
  existsByName(name: string, excludeProductId?: ProductId): Promise<boolean>;

  /**
   * 商品総数を取得
   * @returns 商品総数
   */
  count(): Promise<number>;

  /**
   * カテゴリ別商品数を取得
   * @param category 商品カテゴリ
   * @returns カテゴリ別商品数
   */
  countByCategory(category: ProductCategory): Promise<number>;

  /**
   * アクティブ商品数を取得
   * @returns アクティブ商品数
   */
  countActive(): Promise<number>;

  /**
   * 在庫あり商品数を取得
   * @returns 在庫あり商品数
   */
  countInStock(): Promise<number>;

  /**
   * 検索条件にマッチする商品数を取得
   * @param criteria 検索条件
   * @returns マッチする商品数
   */
  countByCriteria(criteria: ProductSearchCriteria): Promise<number>;
}

/**
 * 商品検索条件
 */
export interface ProductSearchCriteria {
  /** 商品名（部分一致） */
  name?: string;
  /** カテゴリ */
  category?: ProductCategory;
  /** 最低価格 */
  minPrice?: Price;
  /** 最高価格 */
  maxPrice?: Price;
  /** アクティブ商品のみ */
  activeOnly?: boolean;
  /** 在庫あり商品のみ */
  inStockOnly?: boolean;
  /** 取得件数制限 */
  limit?: number;
  /** 取得開始位置 */
  offset?: number;
  /** ソート条件 */
  sortBy?: ProductSortOption;
  /** ソート順序 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 商品ソートオプション
 */
export type ProductSortOption =
  | 'name'
  | 'price'
  | 'stock'
  | 'category'
  | 'createdAt'
  | 'updatedAt';