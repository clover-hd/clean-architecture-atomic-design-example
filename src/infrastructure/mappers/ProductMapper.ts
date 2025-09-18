import { Product } from '../../domain/entities/Product';
import { ProductId, Price, ProductCategory, Quantity } from '../../domain/value-objects';
import { ProductRow } from '../database';

/**
 * Product Entity と Database Row の変換を行うマッパー
 * 型安全性を保ちながらDomain EntityとSQLite Rowの変換を実行
 */
export class ProductMapper {
  /**
   * Database Row を Domain Entity に変換
   * @param row SQLiteから取得したProductRow
   * @returns Product Domain Entity
   * @throws {Error} 変換に失敗した場合
   */
  public static toDomain(row: ProductRow): Product {
    try {
      const productId = ProductId.create(row.id);
      const price = Price.create(row.price);
      const stock = Quantity.create(row.stock);
      const category = ProductCategory.create(row.category);

      return Product.restore(
        productId,
        row.name,
        price,
        stock,
        category,
        Boolean(row.is_active), // SQLiteの0/1をBooleanに変換
        new Date(row.created_at),
        new Date(row.updated_at),
        row.description || undefined,
        row.image_url || undefined
      );
    } catch (error) {
      throw new Error(`Failed to convert ProductRow to Product entity: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Domain Entity を Database Row 形式に変換
   * @param product Product Domain Entity
   * @returns SQLite挿入用のオブジェクト（idは除く）
   */
  public static toRow(product: Product): Omit<ProductRow, 'id'> {
    return {
      name: product.name,
      description: product.description || null,
      price: product.price.value,
      stock: product.stock.value,
      category: product.category.value,
      is_active: product.isActive ? 1 : 0, // BooleanをSQLiteの0/1に変換
      image_url: product.imageUrl || null,
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString()
    };
  }

  /**
   * Domain Entity を Database 更新用形式に変換
   * @param product Product Domain Entity
   * @returns SQLite更新用のオブジェクト
   */
  public static toUpdateRow(product: Product): {
    name: string;
    description: string | null;
    price: number;
    stock: number;
    category: string;
    is_active: number;
    image_url: string | null;
    updated_at: string;
  } {
    return {
      name: product.name,
      description: product.description || null,
      price: product.price.value,
      stock: product.stock.value,
      category: product.category.value,
      is_active: product.isActive ? 1 : 0,
      image_url: product.imageUrl || null,
      updated_at: new Date().toISOString() // 更新時は現在時刻
    };
  }

  /**
   * 複数のDatabase Rowを Domain Entityの配列に変換
   * @param rows SQLiteから取得したProductRowの配列
   * @returns Product Domain Entityの配列
   * @throws {Error} いずれかの変換に失敗した場合
   */
  public static toDomainArray(rows: ProductRow[]): Product[] {
    return rows.map((row, index) => {
      try {
        return this.toDomain(row);
      } catch (error) {
        throw new Error(`Failed to convert ProductRow at index ${index}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Domain Entity から 挿入用パラメータ配列を生成
   * SQLite prepared statementで使用
   * @param product Product Domain Entity
   * @returns パラメータ配列
   */
  public static toInsertParams(product: Product): [string, string | null, number, number, string, number, string | null, string, string] {
    return [
      product.name,
      product.description || null,
      product.price.value,
      product.stock.value,
      product.category.value,
      product.isActive ? 1 : 0,
      product.imageUrl || null,
      product.createdAt.toISOString(),
      product.updatedAt.toISOString()
    ];
  }

  /**
   * Domain Entity から 更新用パラメータ配列を生成
   * SQLite prepared statementで使用（WHERE id = ? 用のパラメータも含む）
   * @param product Product Domain Entity
   * @returns パラメータ配列（最後にidを含む）
   */
  public static toUpdateParams(product: Product): [string, string | null, number, number, string, number, string | null, string, number] {
    return [
      product.name,
      product.description || null,
      product.price.value,
      product.stock.value,
      product.category.value,
      product.isActive ? 1 : 0,
      product.imageUrl || null,
      new Date().toISOString(),
      product.id.value
    ];
  }

  /**
   * ProductRow の検証
   * データベースから取得した行が有効かチェック
   * @param row 検証するProductRow
   * @returns 有効な場合true
   */
  public static isValidRow(row: any): row is ProductRow {
    if (!row || typeof row !== 'object') {
      return false;
    }

    const requiredFields = ['id', 'name', 'price', 'stock', 'category', 'is_active', 'created_at', 'updated_at'];

    for (const field of requiredFields) {
      if (!(field in row)) {
        return false;
      }
    }

    // 基本的な型チェック
    return (
      typeof row.id === 'number' &&
      typeof row.name === 'string' &&
      typeof row.price === 'number' &&
      typeof row.stock === 'number' &&
      typeof row.category === 'string' &&
      typeof row.is_active === 'number' &&
      typeof row.created_at === 'string' &&
      typeof row.updated_at === 'string' &&
      (row.description === null || typeof row.description === 'string') &&
      (row.image_url === null || typeof row.image_url === 'string')
    );
  }

  /**
   * Domain Entity から 部分更新用のSQLとパラメータを生成
   * 指定されたフィールドのみを更新
   * @param product Product Domain Entity
   * @param fields 更新するフィールド名の配列
   * @returns {sql: string, params: any[]}
   */
  public static toPartialUpdateQuery(
    product: Product,
    fields: Array<'name' | 'description' | 'price' | 'stock' | 'category' | 'is_active' | 'image_url'>
  ): { sql: string; params: any[] } {
    if (fields.length === 0) {
      throw new Error('At least one field must be specified for partial update');
    }

    const setClauses: string[] = [];
    const params: any[] = [];

    for (const field of fields) {
      switch (field) {
        case 'name':
          setClauses.push('name = ?');
          params.push(product.name);
          break;
        case 'description':
          setClauses.push('description = ?');
          params.push(product.description || null);
          break;
        case 'price':
          setClauses.push('price = ?');
          params.push(product.price.value);
          break;
        case 'stock':
          setClauses.push('stock = ?');
          params.push(product.stock.value);
          break;
        case 'category':
          setClauses.push('category = ?');
          params.push(product.category.value);
          break;
        case 'is_active':
          setClauses.push('is_active = ?');
          params.push(product.isActive ? 1 : 0);
          break;
        case 'image_url':
          setClauses.push('image_url = ?');
          params.push(product.imageUrl || null);
          break;
      }
    }

    // updated_atは常に更新
    setClauses.push('updated_at = ?');
    params.push(new Date().toISOString());

    // WHERE条件のid
    params.push(product.id.value);

    const sql = `UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`;

    return { sql, params };
  }

  /**
   * 検索条件用のSQLとパラメータを生成
   * @param criteria 検索条件
   * @returns {where: string, params: any[]}
   */
  public static buildSearchQuery(criteria: {
    name?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    activeOnly?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
  }): { where: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (criteria.name) {
      conditions.push('name LIKE ?');
      params.push(`%${criteria.name}%`);
    }

    if (criteria.category) {
      conditions.push('category = ?');
      params.push(criteria.category);
    }

    if (criteria.minPrice !== undefined) {
      conditions.push('price >= ?');
      params.push(criteria.minPrice);
    }

    if (criteria.maxPrice !== undefined) {
      conditions.push('price <= ?');
      params.push(criteria.maxPrice);
    }

    if (criteria.inStockOnly) {
      conditions.push('stock > 0');
    }

    if (criteria.activeOnly !== undefined) {
      conditions.push('is_active = ?');
      params.push(criteria.activeOnly ? 1 : 0);
    }

    if (criteria.createdAfter) {
      conditions.push('created_at >= ?');
      params.push(criteria.createdAfter.toISOString());
    }

    if (criteria.createdBefore) {
      conditions.push('created_at <= ?');
      params.push(criteria.createdBefore.toISOString());
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return { where, params };
  }

  /**
   * ソート条件のSQLを生成
   * @param sortBy ソートフィールド
   * @param sortOrder ソート順序
   * @returns ソート用SQL文字列
   */
  public static buildSortQuery(
    sortBy: 'name' | 'price' | 'stock' | 'category' | 'created_at' | 'updated_at' = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): string {
    const validSortFields = ['name', 'price', 'stock', 'category', 'created_at', 'updated_at'];
    const validSortOrders = ['asc', 'desc'];

    if (!validSortFields.includes(sortBy)) {
      throw new Error(`Invalid sort field: ${sortBy}`);
    }

    if (!validSortOrders.includes(sortOrder)) {
      throw new Error(`Invalid sort order: ${sortOrder}`);
    }

    return `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
  }

  /**
   * ページネーション用のLIMIT OFFSET句を生成
   * @param limit 取得件数制限
   * @param offset 取得開始位置
   * @returns LIMIT OFFSET句
   */
  public static buildPaginationQuery(limit?: number, offset?: number): string {
    const parts: string[] = [];

    if (limit !== undefined && limit > 0) {
      parts.push(`LIMIT ${limit}`);

      if (offset !== undefined && offset > 0) {
        parts.push(`OFFSET ${offset}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * 在庫更新用パラメータを生成
   * @param productId 商品ID
   * @param newStock 新しい在庫数
   * @returns パラメータ配列
   */
  public static toStockUpdateParams(productId: ProductId, newStock: Quantity): [number, string, number] {
    return [
      newStock.value,
      new Date().toISOString(),
      productId.value
    ];
  }

  /**
   * アクティブ状態更新用パラメータを生成
   * @param productId 商品ID
   * @param isActive アクティブ状態
   * @returns パラメータ配列
   */
  public static toActiveUpdateParams(productId: ProductId, isActive: boolean): [number, string, number] {
    return [
      isActive ? 1 : 0,
      new Date().toISOString(),
      productId.value
    ];
  }
}