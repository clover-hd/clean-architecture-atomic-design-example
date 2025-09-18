#!/usr/bin/env ts-node

/**
 * Database Migration Script
 * データベーススキーマのマイグレーション実行スクリプト
 */

import dotenv from 'dotenv';
import { DatabaseConfig } from '../../src/infrastructure/database/DatabaseConfig';
import { database } from '../../src/infrastructure/database/Database';

// 環境変数を読み込み
dotenv.config();

/**
 * マイグレーション履歴テーブルの作成
 */
async function createMigrationsTable(): Promise<void> {
  const createMigrationsTable = `
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await database.execute(createMigrationsTable);
  console.log('✓ Migrations table ensured');
}

/**
 * マイグレーション実行済みかチェック
 */
async function isMigrationExecuted(version: string): Promise<boolean> {
  const result = await database.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM migrations WHERE version = ?',
    [version]
  );
  return (result?.count || 0) > 0;
}

/**
 * マイグレーション実行記録を追加
 */
async function recordMigration(version: string, name: string): Promise<void> {
  await database.execute(
    'INSERT INTO migrations (version, name) VALUES (?, ?)',
    [version, name]
  );
}

/**
 * マイグレーション定義
 */
interface Migration {
  version: string;
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

/**
 * 利用可能なマイグレーション
 */
const migrations: Migration[] = [
  {
    version: '001',
    name: 'create_initial_tables',
    up: async () => {
      // 初期テーブル作成は DatabaseConfig.initialize() で実行されるため、
      // ここでは追加のカラムやテーブルがあれば定義
      console.log('  - Initial tables created via DatabaseConfig');
    },
    down: async () => {
      // 初期テーブルの削除
      const tables = ['cart_items', 'order_items', 'orders', 'products', 'users'];
      for (const table of tables) {
        await database.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`  - Dropped table: ${table}`);
      }
    }
  },
  {
    version: '002',
    name: 'add_product_search_optimizations',
    up: async () => {
      // 商品検索最適化のためのインデックス追加
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_products_name_category ON products(name, category)',
        'CREATE INDEX IF NOT EXISTS idx_products_price_active ON products(price, is_active)',
        'CREATE INDEX IF NOT EXISTS idx_products_stock_active ON products(stock, is_active)'
      ];

      for (const indexQuery of indexes) {
        await database.execute(indexQuery);
        console.log(`  - Created search optimization index`);
      }
    },
    down: async () => {
      const indexes = [
        'DROP INDEX IF EXISTS idx_products_name_category',
        'DROP INDEX IF EXISTS idx_products_price_active',
        'DROP INDEX IF EXISTS idx_products_stock_active'
      ];

      for (const indexQuery of indexes) {
        await database.execute(indexQuery);
        console.log(`  - Dropped search optimization index`);
      }
    }
  },
  {
    version: '003',
    name: 'add_order_performance_indexes',
    up: async () => {
      // 注文パフォーマンス向上のためのインデックス追加
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status)',
        'CREATE INDEX IF NOT EXISTS idx_orders_date_status ON orders(order_date, status)',
        'CREATE INDEX IF NOT EXISTS idx_order_items_product_created ON order_items(product_id, created_at)'
      ];

      for (const indexQuery of indexes) {
        await database.execute(indexQuery);
        console.log(`  - Created order performance index`);
      }
    },
    down: async () => {
      const indexes = [
        'DROP INDEX IF EXISTS idx_orders_user_status',
        'DROP INDEX IF EXISTS idx_orders_date_status',
        'DROP INDEX IF EXISTS idx_order_items_product_created'
      ];

      for (const indexQuery of indexes) {
        await database.execute(indexQuery);
        console.log(`  - Dropped order performance index`);
      }
    }
  }
];

/**
 * マイグレーション実行
 */
async function runMigrations(direction: 'up' | 'down' = 'up'): Promise<void> {
  try {
    console.log(`🚀 Starting database migration (${direction})...`);

    // データベース初期化
    await DatabaseConfig.initialize();
    await createMigrationsTable();

    const targetMigrations = direction === 'up' ? migrations : [...migrations].reverse();

    for (const migration of targetMigrations) {
      const isExecuted = await isMigrationExecuted(migration.version);

      if (direction === 'up' && isExecuted) {
        console.log(`⏭️  Skipping ${migration.version}_${migration.name} (already executed)`);
        continue;
      }

      if (direction === 'down' && !isExecuted) {
        console.log(`⏭️  Skipping ${migration.version}_${migration.name} (not executed)`);
        continue;
      }

      console.log(`🔄 ${direction === 'up' ? 'Applying' : 'Reverting'} ${migration.version}_${migration.name}...`);

      await database.withTransaction(async () => {
        if (direction === 'up') {
          await migration.up();
          await recordMigration(migration.version, migration.name);
        } else {
          await migration.down();
          await database.execute('DELETE FROM migrations WHERE version = ?', [migration.version]);
        }
      });

      console.log(`✅ ${migration.version}_${migration.name} completed`);
    }

    // マイグレーション完了後の状態確認
    const health = await DatabaseConfig.healthCheck();
    console.log(`\n📊 Migration completed successfully!`);
    console.log(`   Database: ${health.database ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`   Tables: ${health.tables.join(', ')}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * マイグレーション状態表示
 */
async function showMigrationStatus(): Promise<void> {
  try {
    await DatabaseConfig.initialize();
    await createMigrationsTable();

    const executedMigrations = await database.query<{ version: string; name: string; executed_at: string }>(
      'SELECT version, name, executed_at FROM migrations ORDER BY version'
    );

    console.log('\n📋 Migration Status:');
    console.log('===================');

    for (const migration of migrations) {
      const executed = executedMigrations.find(em => em.version === migration.version);
      const status = executed ? '✅ Executed' : '⏳ Pending';
      const executedAt = executed ? ` (${executed.executed_at})` : '';

      console.log(`${migration.version}_${migration.name}: ${status}${executedAt}`);
    }

  } catch (error) {
    console.error('❌ Failed to show migration status:', error);
    throw error;
  }
}

/**
 * メイン実行関数
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'up';

  try {
    switch (command) {
      case 'up':
        await runMigrations('up');
        break;

      case 'down':
        await runMigrations('down');
        break;

      case 'status':
        await showMigrationStatus();
        break;

      case 'reset':
        if (process.env.NODE_ENV === 'production') {
          console.error('❌ Cannot reset production database');
          process.exit(1);
        }
        await DatabaseConfig.reset();
        console.log('✅ Database reset completed');
        break;

      default:
        console.log(`
Usage: npm run db:migrate [command]

Commands:
  up      Apply pending migrations (default)
  down    Revert last migration batch
  status  Show migration status
  reset   Reset database (development/test only)

Examples:
  npm run db:migrate        # Apply all pending migrations
  npm run db:migrate up     # Apply all pending migrations
  npm run db:migrate down   # Revert last migration batch
  npm run db:migrate status # Show current migration status
  npm run db:migrate reset  # Reset database (dev/test only)
        `);
        break;
    }

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await DatabaseConfig.close();
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled migration error:', error);
    process.exit(1);
  });
}