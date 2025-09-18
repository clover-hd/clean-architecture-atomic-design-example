import path from 'path';
import { database } from './Database';

/**
 * Database Configuration
 * データベース設定と初期化
 */
export class DatabaseConfig {
  private static initialized = false;

  /**
   * データベース設定
   */
  public static config = {
    development: {
      database: path.resolve(process.cwd(), 'database', 'development.db'),
      logging: true,
      maxConnections: 10,
      acquireConnectionTimeout: 60000,
    },
    test: {
      database: ':memory:', // インメモリデータベース
      logging: false,
      maxConnections: 5,
      acquireConnectionTimeout: 30000,
    },
    production: {
      database: path.resolve(process.cwd(), 'database', 'production.db'),
      logging: false,
      maxConnections: 20,
      acquireConnectionTimeout: 60000,
    }
  };

  /**
   * 現在の環境を取得
   */
  public static getEnvironment(): keyof typeof DatabaseConfig.config {
    const env = process.env.NODE_ENV as keyof typeof DatabaseConfig.config;
    return ['development', 'test', 'production'].includes(env) ? env : 'development';
  }

  /**
   * 現在の環境の設定を取得
   */
  public static getCurrentConfig() {
    const env = this.getEnvironment();
    return this.config[env];
  }

  /**
   * データベースを初期化
   */
  public static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const config = this.getCurrentConfig();

      // データベースディレクトリを作成（:memory:の場合は不要）
      if (config.database !== ':memory:') {
        const dbDir = path.dirname(config.database);
        const fs = await import('fs').then(m => m.promises);

        try {
          await fs.access(dbDir);
        } catch {
          await fs.mkdir(dbDir, { recursive: true });
        }
      }

      // データベースに接続
      await database.connect(config.database);

      // テーブルが存在しない場合は作成
      await this.createTables();

      this.initialized = true;

      if (config.logging) {
        console.log(`Database initialized successfully (${this.getEnvironment()})`);
        const info = await database.getDatabaseInfo();
        console.log(`SQLite version: ${info.version}, Tables: ${info.tables.length}, Size: ${info.size} bytes`);
      }
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * データベーステーブルを作成
   */
  private static async createTables(): Promise<void> {
    // Usersテーブル
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        is_admin BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Productsテーブル
    const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER DEFAULT 0,
        category TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name)
      )
    `;

    // Ordersテーブル
    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        total_amount DECIMAL(10, 2) NOT NULL,
        shipping_address TEXT NOT NULL,
        billing_address TEXT NOT NULL,
        payment_method TEXT,
        payment_status TEXT DEFAULT 'pending',
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        shipped_date DATETIME,
        delivered_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    // Order_Itemsテーブル
    const createOrderItemsTable = `
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      )
    `;

    // Cart_Itemsテーブル
    const createCartItemsTable = `
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(session_id, product_id)
      )
    `;

    // インデックスの作成
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)',
      'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)',
      'CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)',
      'CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON cart_items(created_at)'
    ];

    // テーブル作成とインデックス作成を実行
    await database.execute(createUsersTable);
    await database.execute(createProductsTable);
    await database.execute(createOrdersTable);
    await database.execute(createOrderItemsTable);
    await database.execute(createCartItemsTable);

    // インデックスを作成
    for (const indexQuery of createIndexes) {
      await database.execute(indexQuery);
    }

    // Triggerの作成（updated_atの自動更新）
    const createTriggers = [
      `CREATE TRIGGER IF NOT EXISTS users_updated_at
       AFTER UPDATE ON users
       FOR EACH ROW
       BEGIN
         UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`,

      `CREATE TRIGGER IF NOT EXISTS products_updated_at
       AFTER UPDATE ON products
       FOR EACH ROW
       BEGIN
         UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`,

      `CREATE TRIGGER IF NOT EXISTS orders_updated_at
       AFTER UPDATE ON orders
       FOR EACH ROW
       BEGIN
         UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`,

      `CREATE TRIGGER IF NOT EXISTS cart_items_updated_at
       AFTER UPDATE ON cart_items
       FOR EACH ROW
       BEGIN
         UPDATE cart_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
       END`
    ];

    for (const triggerQuery of createTriggers) {
      await database.execute(triggerQuery);
    }
  }

  /**
   * データベースをリセット（テスト用）
   */
  public static async reset(): Promise<void> {
    if (this.getEnvironment() === 'production') {
      throw new Error('Cannot reset production database');
    }

    const tables = ['cart_items', 'order_items', 'orders', 'products', 'users'];

    for (const table of tables) {
      await database.execute(`DROP TABLE IF EXISTS ${table}`);
    }

    await this.createTables();
  }

  /**
   * データベース接続を閉じる
   */
  public static async close(): Promise<void> {
    await database.close();
    this.initialized = false;
  }

  /**
   * 初期化状態を確認
   */
  public static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * ヘルスチェック
   */
  public static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: boolean;
    tables: string[];
    error?: string;
  }> {
    try {
      const info = await database.getDatabaseInfo();
      return {
        status: 'healthy',
        database: database.isConnectedToDatabase(),
        tables: info.tables
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: false,
        tables: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}