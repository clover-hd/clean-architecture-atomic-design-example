/**
 * テスト用データベースヘルパー
 * インメモリSQLiteデータベースを使用したテスト環境管理
 */

import { Database } from '../../src/infrastructure/database/Database';
import path from 'path';
import fs from 'fs/promises';

export class TestDatabase {
  private static instance: TestDatabase;
  private database?: Database;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  /**
   * テスト用データベースの初期化
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // インメモリデータベースを作成
    this.database = new Database(':memory:');
    await this.database.connect();

    // テスト用スキーマを作成
    await this.createSchema();
    this.isInitialized = true;
  }

  /**
   * データベース接続を取得
   */
  public getDatabase(): Database {
    if (!this.database) {
      throw new Error('Test database not initialized. Call initialize() first.');
    }
    return this.database;
  }

  /**
   * テスト開始前の準備
   */
  public async beforeEach(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    await this.clearAllTables();
  }

  /**
   * テスト終了後のクリーンアップ
   */
  public async afterEach(): Promise<void> {
    await this.clearAllTables();
  }

  /**
   * テストスイート終了後のクリーンアップ
   */
  public async afterAll(): Promise<void> {
    if (this.database) {
      await this.database.close();
      this.database = undefined;
      this.isInitialized = false;
    }
  }

  /**
   * すべてのテーブルをクリア
   */
  private async clearAllTables(): Promise<void> {
    if (!this.database) return;

    const tables = ['order_items', 'orders', 'cart_items', 'products', 'users'];

    for (const table of tables) {
      await this.database.execute(`DELETE FROM ${table}`);
    }
  }

  /**
   * テスト用スキーマの作成
   */
  private async createSchema(): Promise<void> {
    if (!this.database) return;

    // Usersテーブル
    await this.database.execute(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        is_admin BOOLEAN DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Productsテーブル
    await this.database.execute(`
      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        stock INTEGER NOT NULL,
        category TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Cart_itemsテーブル
    await this.database.execute(`
      CREATE TABLE cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Ordersテーブル
    await this.database.execute(`
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        total_amount INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Order_itemsテーブル
    await this.database.execute(`
      CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);
  }

  /**
   * トランザクション実行ヘルパー
   */
  public async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    return this.database.withTransaction(callback);
  }

  /**
   * SQL実行ヘルパー
   */
  public async execute(sql: string, params: any[] = []): Promise<any> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    return this.database.execute(sql, params);
  }

  /**
   * クエリ実行ヘルパー
   */
  public async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    return this.database.query<T>(sql, params);
  }

  /**
   * 単一行クエリ実行ヘルパー
   */
  public async queryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    return this.database.queryOne<T>(sql, params);
  }
}