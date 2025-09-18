import sqlite3 from 'sqlite3';
import { promisify } from 'util';

/**
 * SQLite Database Connection Manager
 * シングルトンパターンでデータベース接続を管理
 */
export class Database {
  private static instance: Database;
  private db: sqlite3.Database | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  /**
   * データベースインスタンスを取得
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * データベースに接続
   * @param dbPath データベースファイルのパス
   */
  public async connect(dbPath: string): Promise<void> {
    if (this.isConnected && this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Database connection error:', err);
          reject(err);
        } else {
          console.log(`Connected to SQLite database: ${dbPath}`);
          this.isConnected = true;

          // WALモードを有効にして並行性を向上
          this.db!.run('PRAGMA journal_mode = WAL;');
          // 外部キー制約を有効化
          this.db!.run('PRAGMA foreign_keys = ON;');

          resolve();
        }
      });
    });
  }

  /**
   * データベース接続を取得
   */
  public getConnection(): sqlite3.Database {
    if (!this.isConnected || !this.db) {
      throw new Error('Database is not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * データベース接続を閉じる
   */
  public async close(): Promise<void> {
    if (!this.db || !this.isConnected) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.db!.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
        } else {
          console.log('Database connection closed.');
          this.isConnected = false;
          this.db = null;
          resolve();
        }
      });
    });
  }

  /**
   * 接続状態を確認
   */
  public isConnectedToDatabase(): boolean {
    return this.isConnected && this.db !== null;
  }

  /**
   * SQLクエリを実行（SELECT）
   */
  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.isConnected || !this.db) {
      throw new Error('Database is not connected');
    }

    const all = promisify(this.db.all.bind(this.db)) as (sql: string, params?: any[]) => Promise<T[]>;
    return all(sql, params);
  }

  /**
   * SQLクエリを実行（SELECT - 単一行）
   */
  public async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    if (!this.isConnected || !this.db) {
      throw new Error('Database is not connected');
    }

    const get = promisify(this.db.get.bind(this.db)) as (sql: string, params?: any[]) => Promise<T | undefined>;
    const result = await get(sql, params);
    return result ? result : null;
  }

  /**
   * SQLクエリを実行（INSERT/UPDATE/DELETE）
   */
  public async execute(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    if (!this.isConnected || !this.db) {
      throw new Error('Database is not connected');
    }

    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastID: this.lastID || 0,
            changes: this.changes || 0
          });
        }
      });
    });
  }

  /**
   * トランザクション開始
   */
  public async beginTransaction(): Promise<void> {
    await this.execute('BEGIN TRANSACTION');
  }

  /**
   * トランザクションコミット
   */
  public async commitTransaction(): Promise<void> {
    await this.execute('COMMIT');
  }

  /**
   * トランザクションロールバック
   */
  public async rollbackTransaction(): Promise<void> {
    await this.execute('ROLLBACK');
  }

  /**
   * トランザクション内でのクエリ実行
   * 自動的にトランザクションを管理
   */
  public async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
    await this.beginTransaction();
    try {
      const result = await callback();
      await this.commitTransaction();
      return result;
    } catch (error) {
      await this.rollbackTransaction();
      throw error;
    }
  }

  /**
   * テーブルの存在チェック
   */
  public async tableExists(tableName: string): Promise<boolean> {
    const result = await this.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName]
    );
    return (result?.count || 0) > 0;
  }

  /**
   * データベースのメタデータを取得
   */
  public async getDatabaseInfo(): Promise<{
    version: string;
    tables: string[];
    size: number;
  }> {
    const versionResult = await this.queryOne<{ version: string }>('SELECT sqlite_version() as version');
    const tablesResult = await this.query<{ name: string }>(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);

    // データベースサイズを取得（ページ数 × ページサイズ）
    const pageCountResult = await this.queryOne<{ page_count: number }>('PRAGMA page_count');
    const pageSizeResult = await this.queryOne<{ page_size: number }>('PRAGMA page_size');

    const size = (pageCountResult?.page_count || 0) * (pageSizeResult?.page_size || 0);

    return {
      version: versionResult?.version || 'Unknown',
      tables: tablesResult.map(table => table.name),
      size
    };
  }
}

/**
 * データベースインスタンスのエクスポート
 */
export const database = Database.getInstance();