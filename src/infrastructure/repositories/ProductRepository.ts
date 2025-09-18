import { IProductRepository, ProductSearchCriteria } from '../../domain/repositories/IProductRepository';
import { Product } from '../../domain/entities/Product';
import { ProductId, ProductCategory, Price } from '../../domain/value-objects';
import { database, ProductRow } from '../database';
import { ProductMapper } from '../mappers/ProductMapper';
import {
  DatabaseErrorHandler,
  DatabaseErrorFactory,
  RecordNotFoundError
} from '../errors';

/**
 * Product Repository Implementation
 * IProductRepositoryの具象実装クラス
 * SQLiteデータベースを使用して商品データの永続化を行う
 */
export class ProductRepository implements IProductRepository {

  /**
   * 商品IDで商品を取得
   */
  public async findById(id: ProductId): Promise<Product | null> {
    return DatabaseErrorHandler.handleFindOne(
      async () => {
        const row = await database.queryOne<ProductRow>(
          'SELECT * FROM products WHERE id = ?',
          [id.value]
        );

        return row ? ProductMapper.toDomain(row) : null;
      },
      {
        entityName: 'Product',
        identifier: id.value
      }
    );
  }

  /**
   * 複数の商品IDで商品を取得
   */
  public async findByIds(ids: ProductId[]): Promise<Product[]> {
    if (ids.length === 0) {
      return [];
    }

    return DatabaseErrorHandler.handleFindMany(
      async () => {
        const placeholders = ids.map(() => '?').join(',');
        const values = ids.map(id => id.value);

        const rows = await database.query<ProductRow>(
          `SELECT * FROM products WHERE id IN (${placeholders}) ORDER BY name`,
          values
        );

        return ProductMapper.toDomainArray(rows);
      },
      {
        entityName: 'Product',
        operation: 'findByIds'
      }
    );
  }

  /**
   * 商品名で検索
   */
  public async findByName(name: string, limit?: number, offset?: number): Promise<Product[]> {
    return DatabaseErrorHandler.handleFindMany(
      async () => {
        let sql = 'SELECT * FROM products WHERE name LIKE ? ORDER BY name';
        const params: any[] = [`%${name}%`];

        if (limit !== undefined && limit > 0) {
          sql += ' LIMIT ?';
          params.push(limit);

          if (offset !== undefined && offset > 0) {
            sql += ' OFFSET ?';
            params.push(offset);
          }
        }

        const rows = await database.query<ProductRow>(sql, params);
        return ProductMapper.toDomainArray(rows);
      },
      {
        entityName: 'Product',
        operation: 'findByName'
      }
    );
  }

  /**
   * カテゴリで商品を取得
   */
  public async findByCategory(category: ProductCategory, limit?: number, offset?: number): Promise<Product[]> {
    return DatabaseErrorHandler.handleFindMany(
      async () => {
        let sql = 'SELECT * FROM products WHERE category = ? ORDER BY name';
        const params: any[] = [category.value];

        if (limit !== undefined && limit > 0) {
          sql += ' LIMIT ?';
          params.push(limit);

          if (offset !== undefined && offset > 0) {
            sql += ' OFFSET ?';
            params.push(offset);
          }
        }

        const rows = await database.query<ProductRow>(sql, params);
        return ProductMapper.toDomainArray(rows);
      },
      {
        entityName: 'Product',
        operation: 'findByCategory'
      }
    );
  }

  /**
   * 価格範囲で商品を検索
   */
  public async findByPriceRange(minPrice: Price, maxPrice: Price, limit?: number, offset?: number): Promise<Product[]> {
    return DatabaseErrorHandler.handleFindMany(
      async () => {
        let sql = 'SELECT * FROM products WHERE price BETWEEN ? AND ? ORDER BY price';
        const params: any[] = [minPrice.value, maxPrice.value];

        if (limit !== undefined && limit > 0) {
          sql += ' LIMIT ?';
          params.push(limit);

          if (offset !== undefined && offset > 0) {
            sql += ' OFFSET ?';
            params.push(offset);
          }
        }

        const rows = await database.query<ProductRow>(sql, params);
        return ProductMapper.toDomainArray(rows);
      },
      {
        entityName: 'Product',
        operation: 'findByPriceRange'
      }
    );
  }

  /**
   * アクティブな商品を取得
   */
  public async findActive(limit?: number, offset?: number): Promise<Product[]> {
    return DatabaseErrorHandler.handleFindMany(
      async () => {
        let sql = 'SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC';
        const params: any[] = [];

        if (limit !== undefined && limit > 0) {
          sql += ' LIMIT ?';
          params.push(limit);

          if (offset !== undefined && offset > 0) {
            sql += ' OFFSET ?';
            params.push(offset);
          }
        }

        const rows = await database.query<ProductRow>(sql, params);
        return ProductMapper.toDomainArray(rows);
      },
      {
        entityName: 'Product',
        operation: 'findActive'
      }
    );
  }

  /**
   * 在庫ありの商品を取得
   */
  public async findInStock(limit?: number, offset?: number): Promise<Product[]> {
    return DatabaseErrorHandler.handleFindMany(
      async () => {
        let sql = 'SELECT * FROM products WHERE stock > 0 ORDER BY stock DESC';
        const params: any[] = [];

        if (limit !== undefined && limit > 0) {
          sql += ' LIMIT ?';
          params.push(limit);

          if (offset !== undefined && offset > 0) {
            sql += ' OFFSET ?';
            params.push(offset);
          }
        }

        const rows = await database.query<ProductRow>(sql, params);
        return ProductMapper.toDomainArray(rows);
      },
      {
        entityName: 'Product',
        operation: 'findInStock'
      }
    );
  }

  /**
   * 在庫切れの商品を取得
   */
  public async findOutOfStock(limit?: number, offset?: number): Promise<Product[]> {
    return DatabaseErrorHandler.handleFindMany(
      async () => {
        let sql = 'SELECT * FROM products WHERE stock = 0 ORDER BY updated_at DESC';
        const params: any[] = [];

        if (limit !== undefined && limit > 0) {
          sql += ' LIMIT ?';
          params.push(limit);

          if (offset !== undefined && offset > 0) {
            sql += ' OFFSET ?';
            params.push(offset);
          }
        }

        const rows = await database.query<ProductRow>(sql, params);
        return ProductMapper.toDomainArray(rows);
      },
      {
        entityName: 'Product',
        operation: 'findOutOfStock'
      }
    );
  }

  /**
   * 複合条件で商品を検索
   */
  public async findByCriteria(criteria: ProductSearchCriteria): Promise<Product[]> {
    return DatabaseErrorHandler.handleFindMany(
      async () => {
        const searchCriteria: Parameters<typeof ProductMapper.buildSearchQuery>[0] = {};

        if (criteria.name) {
          searchCriteria.name = criteria.name;
        }
        if (criteria.category) {
          searchCriteria.category = criteria.category.value;
        }
        if (criteria.minPrice) {
          searchCriteria.minPrice = criteria.minPrice.value;
        }
        if (criteria.maxPrice) {
          searchCriteria.maxPrice = criteria.maxPrice.value;
        }
        if (criteria.inStockOnly !== undefined) {
          searchCriteria.inStockOnly = criteria.inStockOnly;
        }
        if (criteria.activeOnly !== undefined) {
          searchCriteria.activeOnly = criteria.activeOnly;
        }

        const { where, params } = ProductMapper.buildSearchQuery(searchCriteria);

        let sql = `SELECT * FROM products ${where}`;

        // ソート条件を追加
        if (criteria.sortBy || criteria.sortOrder) {
          // ProductSortOptionからDB列名にマッピング
          const dbSortBy = criteria.sortBy === 'createdAt' ? 'created_at' :
                          criteria.sortBy === 'updatedAt' ? 'updated_at' :
                          criteria.sortBy || 'created_at';

          const sortQuery = ProductMapper.buildSortQuery(
            dbSortBy as any,
            criteria.sortOrder || 'desc'
          );
          sql += ` ${sortQuery}`;
        } else {
          sql += ' ORDER BY created_at DESC';
        }

        // ページネーション
        const paginationQuery = ProductMapper.buildPaginationQuery(criteria.limit, criteria.offset);
        if (paginationQuery) {
          sql += ` ${paginationQuery}`;
        }

        const rows = await database.query<ProductRow>(sql, params);
        return ProductMapper.toDomainArray(rows);
      },
      {
        entityName: 'Product',
        operation: 'findByCriteria'
      }
    );
  }

  /**
   * 全商品を取得
   */
  public async findAll(limit?: number, offset?: number): Promise<Product[]> {
    return DatabaseErrorHandler.handleFindMany(
      async () => {
        let sql = 'SELECT * FROM products ORDER BY created_at DESC';
        const params: any[] = [];

        if (limit !== undefined && limit > 0) {
          sql += ' LIMIT ?';
          params.push(limit);

          if (offset !== undefined && offset > 0) {
            sql += ' OFFSET ?';
            params.push(offset);
          }
        }

        const rows = await database.query<ProductRow>(sql, params);
        return ProductMapper.toDomainArray(rows);
      },
      {
        entityName: 'Product',
        operation: 'findAll'
      }
    );
  }

  /**
   * 商品を保存（作成・更新）
   */
  public async save(product: Product): Promise<Product> {
    return DatabaseErrorHandler.handle(
      async () => {
        const existingProduct = await this.findById(product.id);

        if (existingProduct) {
          return this.update(product);
        } else {
          return this.create(product);
        }
      },
      {
        entityName: 'Product',
        operation: 'save',
        identifier: product.id.value
      }
    );
  }

  /**
   * 新規商品を作成
   */
  public async create(product: Product): Promise<Product> {
    return DatabaseErrorHandler.handle(
      async () => {
        const sql = `
          INSERT INTO products (name, description, price, stock, category, is_active, image_url, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = ProductMapper.toInsertParams(product);
        const result = await database.execute(sql, params);

        // 作成された商品を取得して返す
        const newProductId = ProductId.create(result.lastID);
        const createdProduct = await this.findById(newProductId);

        if (!createdProduct) {
          throw DatabaseErrorFactory.createNotFoundError('Product', result.lastID);
        }

        return createdProduct;
      },
      {
        entityName: 'Product',
        operation: 'create',
        identifier: product.name
      }
    );
  }

  /**
   * 商品情報を更新
   */
  public async update(product: Product): Promise<Product> {
    return DatabaseErrorHandler.handle(
      async () => {
        const sql = `
          UPDATE products
          SET name = ?, description = ?, price = ?, stock = ?, category = ?, is_active = ?, image_url = ?, updated_at = ?
          WHERE id = ?
        `;

        const params = ProductMapper.toUpdateParams(product);
        const result = await database.execute(sql, params);

        if (result.changes === 0) {
          throw DatabaseErrorFactory.createNotFoundError('Product', product.id.value);
        }

        // 更新された商品を取得して返す
        const updatedProduct = await this.findById(product.id);

        if (!updatedProduct) {
          throw DatabaseErrorFactory.createNotFoundError('Product', product.id.value);
        }

        return updatedProduct;
      },
      {
        entityName: 'Product',
        operation: 'update',
        identifier: product.id.value
      }
    );
  }

  /**
   * 商品を削除
   */
  public async delete(id: ProductId): Promise<void> {
    return DatabaseErrorHandler.handle(
      async () => {
        const result = await database.execute(
          'DELETE FROM products WHERE id = ?',
          [id.value]
        );

        if (result.changes === 0) {
          throw DatabaseErrorFactory.createNotFoundError('Product', id.value);
        }
      },
      {
        entityName: 'Product',
        operation: 'delete',
        identifier: id.value
      }
    );
  }

  /**
   * 商品の存在チェック
   */
  public async existsById(id: ProductId): Promise<boolean> {
    return DatabaseErrorHandler.handle(
      async () => {
        const result = await database.queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM products WHERE id = ?',
          [id.value]
        );
        return (result?.count || 0) > 0;
      },
      {
        entityName: 'Product',
        operation: 'existsById',
        identifier: id.value
      }
    );
  }

  /**
   * 商品名の重複チェック
   */
  public async existsByName(name: string, excludeProductId?: ProductId): Promise<boolean> {
    return DatabaseErrorHandler.handle(
      async () => {
        let sql = 'SELECT COUNT(*) as count FROM products WHERE name = ?';
        const params: any[] = [name];

        if (excludeProductId) {
          sql += ' AND id != ?';
          params.push(excludeProductId.value);
        }

        const result = await database.queryOne<{ count: number }>(sql, params);
        return (result?.count || 0) > 0;
      },
      {
        entityName: 'Product',
        operation: 'existsByName',
        identifier: name
      }
    );
  }

  /**
   * 商品総数を取得
   */
  public async count(): Promise<number> {
    return DatabaseErrorHandler.handle(
      async () => {
        const result = await database.queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM products'
        );
        return result?.count || 0;
      },
      {
        entityName: 'Product',
        operation: 'count'
      }
    );
  }

  /**
   * カテゴリ別商品数を取得
   */
  public async countByCategory(category: ProductCategory): Promise<number> {
    return DatabaseErrorHandler.handle(
      async () => {
        const result = await database.queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM products WHERE category = ?',
          [category.value]
        );
        return result?.count || 0;
      },
      {
        entityName: 'Product',
        operation: 'countByCategory',
        identifier: category.value
      }
    );
  }

  /**
   * アクティブ商品数を取得
   */
  public async countActive(): Promise<number> {
    return DatabaseErrorHandler.handle(
      async () => {
        const result = await database.queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM products WHERE is_active = 1'
        );
        return result?.count || 0;
      },
      {
        entityName: 'Product',
        operation: 'countActive'
      }
    );
  }

  /**
   * 在庫あり商品数を取得
   */
  public async countInStock(): Promise<number> {
    return DatabaseErrorHandler.handle(
      async () => {
        const result = await database.queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM products WHERE stock > 0'
        );
        return result?.count || 0;
      },
      {
        entityName: 'Product',
        operation: 'countInStock'
      }
    );
  }

  /**
   * 検索条件にマッチする商品数を取得
   */
  public async countByCriteria(criteria: ProductSearchCriteria): Promise<number> {
    return DatabaseErrorHandler.handle(
      async () => {
        const searchCriteria: Parameters<typeof ProductMapper.buildSearchQuery>[0] = {};

        if (criteria.name) {
          searchCriteria.name = criteria.name;
        }
        if (criteria.category) {
          searchCriteria.category = criteria.category.value;
        }
        if (criteria.minPrice) {
          searchCriteria.minPrice = criteria.minPrice.value;
        }
        if (criteria.maxPrice) {
          searchCriteria.maxPrice = criteria.maxPrice.value;
        }
        if (criteria.inStockOnly !== undefined) {
          searchCriteria.inStockOnly = criteria.inStockOnly;
        }
        if (criteria.activeOnly !== undefined) {
          searchCriteria.activeOnly = criteria.activeOnly;
        }

        const { where, params } = ProductMapper.buildSearchQuery(searchCriteria);

        const sql = `SELECT COUNT(*) as count FROM products ${where}`;
        const result = await database.queryOne<{ count: number }>(sql, params);
        return result?.count || 0;
      },
      {
        entityName: 'Product',
        operation: 'countByCriteria'
      }
    );
  }

  /**
   * 在庫の一括更新（管理者機能）
   */
  public async bulkUpdateStock(updates: Array<{ productId: ProductId; newStock: number }>): Promise<number> {
    return DatabaseErrorHandler.handleTransaction(
      async () => {
        return database.withTransaction(async () => {
          let updatedCount = 0;

          for (const update of updates) {
            const params = ProductMapper.toStockUpdateParams(
              update.productId,
              { value: update.newStock } as any // Quantityクラスの代わりに一時的
            );

            const result = await database.execute(
              'UPDATE products SET stock = ?, updated_at = ? WHERE id = ?',
              params
            );

            if (result.changes > 0) {
              updatedCount++;
            }
          }

          return updatedCount;
        });
      },
      {
        operation: 'bulkUpdateStock'
      }
    );
  }

  /**
   * アクティブ状態の一括更新
   */
  public async bulkUpdateActiveStatus(productIds: ProductId[], isActive: boolean): Promise<number> {
    return DatabaseErrorHandler.handleTransaction(
      async () => {
        return database.withTransaction(async () => {
          if (productIds.length === 0) {
            return 0;
          }

          const placeholders = productIds.map(() => '?').join(',');
          const params = [isActive ? 1 : 0, new Date().toISOString(), ...productIds.map(id => id.value)];

          const result = await database.execute(
            `UPDATE products SET is_active = ?, updated_at = ? WHERE id IN (${placeholders})`,
            params
          );

          return result.changes;
        });
      },
      {
        operation: 'bulkUpdateActiveStatus'
      }
    );
  }
}