#!/usr/bin/env ts-node

/**
 * Database Seeding Script
 * テストデータの投入スクリプト
 */

import dotenv from 'dotenv';
import { DatabaseConfig } from '../../src/infrastructure/database/DatabaseConfig';
import { database } from '../../src/infrastructure/database/Database';

// 環境変数を読み込み
dotenv.config();

/**
 * シード実行済みかチェック
 */
async function isSeedExecuted(): Promise<boolean> {
  const result = await database.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM users'
  );
  return (result?.count || 0) > 0;
}

/**
 * ユーザーデータのシード
 */
async function seedUsers(): Promise<void> {
  const users = [
    {
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      phone: '090-1234-5678',
      is_admin: 1
    },
    {
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      phone: '090-2345-6789',
      is_admin: 0
    },
    {
      email: 'jane.smith@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '090-3456-7890',
      is_admin: 0
    },
    {
      email: 'bob.wilson@example.com',
      first_name: 'Bob',
      last_name: 'Wilson',
      phone: null,
      is_admin: 0
    },
    {
      email: 'alice.brown@example.com',
      first_name: 'Alice',
      last_name: 'Brown',
      phone: '090-4567-8901',
      is_admin: 0
    }
  ];

  for (const user of users) {
    await database.execute(
      `INSERT INTO users (email, first_name, last_name, phone, is_admin) VALUES (?, ?, ?, ?, ?)`,
      [user.email, user.first_name, user.last_name, user.phone, user.is_admin]
    );
  }

  console.log(`✅ Seeded ${users.length} users`);
}

/**
 * 商品データのシード
 */
async function seedProducts(): Promise<void> {
  const products = [
    {
      name: 'Apple iPhone 15 Pro',
      description: '最新のiPhone 15 Pro。Pro級のカメラシステムとA17 Proチップを搭載。',
      price: 159800,
      stock: 50,
      category: 'electronics',
      is_active: 1,
      image_url: '/images/product-electronics.svg'
    },
    {
      name: 'Samsung Galaxy S24',
      description: 'Samsung最新のフラッグシップスマートフォン。AI機能が充実。',
      price: 139800,
      stock: 30,
      category: 'electronics',
      is_active: 1,
      image_url: '/images/product-electronics.svg'
    },
    {
      name: 'MacBook Air M3',
      description: '新しいM3チップ搭載のMacBook Air。軽量で高性能。',
      price: 164800,
      stock: 25,
      category: 'electronics',
      is_active: 1,
      image_url: '/images/product-electronics.svg'
    },
    {
      name: 'Nike Air Max 270',
      description: '快適性とスタイルを両立したランニングシューズ。',
      price: 16500,
      stock: 100,
      category: 'fashion',
      is_active: 1,
      image_url: '/images/product-clothing.svg'
    },
    {
      name: 'Adidas Ultraboost 22',
      description: '最高のクッション性を提供するランニングシューズ。',
      price: 19800,
      stock: 75,
      category: 'fashion',
      is_active: 1,
      image_url: '/images/product-clothing.svg'
    },
    {
      name: 'Uniqlo ヒートテック極暖クルーネック',
      description: '冬の必需品。優れた保温性と着心地。',
      price: 1990,
      stock: 200,
      category: 'fashion',
      is_active: 1,
      image_url: '/images/product-clothing.svg'
    },
    {
      name: '有機コーヒー豆 ブレンド',
      description: '厳選された有機コーヒー豆。深いコクと香り。',
      price: 2800,
      stock: 150,
      category: 'food',
      is_active: 1,
      image_url: '/images/product-home.svg'
    },
    {
      name: '北海道産 特級米',
      description: '北海道の恵まれた自然で育った特級米。',
      price: 4500,
      stock: 80,
      category: 'food',
      is_active: 1,
      image_url: '/images/product-home.svg'
    },
    {
      name: 'プレミアム緑茶セット',
      description: '京都産の高級緑茶セット。贈り物にも最適。',
      price: 6800,
      stock: 60,
      category: 'food',
      is_active: 1,
      image_url: '/images/product-home.svg'
    },
    {
      name: 'ビジネス書籍セット',
      description: 'ベストセラービジネス書10冊セット。',
      price: 12000,
      stock: 40,
      category: 'books',
      is_active: 1,
      image_url: '/images/product-books.svg'
    },
    {
      name: 'プログラミング学習セット',
      description: 'プログラミング入門から上級まで学べる書籍セット。',
      price: 15000,
      stock: 35,
      category: 'books',
      is_active: 1,
      image_url: '/images/product-books.svg'
    },
    {
      name: '子供向け図鑑セット',
      description: '好奇心を育む子供向け図鑑10冊セット。',
      price: 18000,
      stock: 25,
      category: 'books',
      is_active: 1,
      image_url: '/images/product-books.svg'
    },
    {
      name: '観葉植物セット',
      description: 'お部屋を彩る観葉植物3鉢セット。初心者にもおすすめ。',
      price: 8900,
      stock: 40,
      category: 'home',
      is_active: 1,
      image_url: '/images/product-home.svg'
    },
    {
      name: 'キッチン用品セット',
      description: '料理が楽しくなるキッチン用品の基本セット。',
      price: 12800,
      stock: 60,
      category: 'home',
      is_active: 1,
      image_url: '/images/product-home.svg'
    },
    {
      name: 'ガーデニングツールセット',
      description: 'ガーデニング初心者から上級者まで使える便利なツールセット。',
      price: 7500,
      stock: 35,
      category: 'home',
      is_active: 1,
      image_url: '/images/product-home.svg'
    },
    {
      name: '在庫切れ商品（テスト）',
      description: '在庫切れ表示のテスト用商品です。',
      price: 9999,
      stock: 0,
      category: 'electronics',
      is_active: 1,
      image_url: '/images/product-electronics.svg'
    }
  ];

  for (const product of products) {
    await database.execute(
      `INSERT INTO products (name, description, price, stock, category, is_active, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        product.name,
        product.description,
        product.price,
        product.stock,
        product.category,
        product.is_active,
        product.image_url
      ]
    );
  }

  console.log(`✅ Seeded ${products.length} products`);
}

/**
 * 注文データのシード
 */
async function seedOrders(): Promise<void> {
  const orders = [
    {
      user_id: 2, // John Doe
      status: 'completed',
      total_amount: 179600,
      shipping_address: '東京都渋谷区1-1-1 マンション101',
      billing_address: '東京都渋谷区1-1-1 マンション101',
      payment_method: 'credit_card',
      payment_status: 'paid',
      order_date: '2024-01-15 10:30:00',
      shipped_date: '2024-01-16 14:00:00',
      delivered_date: '2024-01-17 16:30:00'
    },
    {
      user_id: 3, // Jane Smith
      status: 'shipped',
      total_amount: 36300,
      shipping_address: '大阪府大阪市2-2-2 ビル202',
      billing_address: '大阪府大阪市2-2-2 ビル202',
      payment_method: 'credit_card',
      payment_status: 'paid',
      order_date: '2024-01-20 15:45:00',
      shipped_date: '2024-01-21 09:00:00',
      delivered_date: null
    },
    {
      user_id: 4, // Bob Wilson
      status: 'processing',
      total_amount: 164800,
      shipping_address: '愛知県名古屋市3-3-3 ハウス303',
      billing_address: '愛知県名古屋市3-3-3 ハウス303',
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      order_date: '2024-01-25 11:20:00',
      shipped_date: null,
      delivered_date: null
    },
    {
      user_id: 5, // Alice Brown
      status: 'pending',
      total_amount: 27800,
      shipping_address: '福岡県福岡市4-4-4 アパート404',
      billing_address: '福岡県福岡市4-4-4 アパート404',
      payment_method: 'cash_on_delivery',
      payment_status: 'pending',
      order_date: '2024-01-28 16:10:00',
      shipped_date: null,
      delivered_date: null
    }
  ];

  for (const order of orders) {
    await database.execute(
      `INSERT INTO orders (user_id, status, total_amount, shipping_address, billing_address,
                          payment_method, payment_status, order_date, shipped_date, delivered_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.user_id,
        order.status,
        order.total_amount,
        order.shipping_address,
        order.billing_address,
        order.payment_method,
        order.payment_status,
        order.order_date,
        order.shipped_date,
        order.delivered_date
      ]
    );
  }

  console.log(`✅ Seeded ${orders.length} orders`);
}

/**
 * 注文項目データのシード
 */
async function seedOrderItems(): Promise<void> {
  const orderItems = [
    // Order 1 (John Doe) - iPhone 15 Pro + Nike shoes
    { order_id: 1, product_id: 1, quantity: 1, unit_price: 159800, total_price: 159800 },
    { order_id: 1, product_id: 4, quantity: 1, unit_price: 16500, total_price: 16500 },
    { order_id: 1, product_id: 7, quantity: 1, unit_price: 2800, total_price: 2800 },

    // Order 2 (Jane Smith) - Adidas shoes + Uniqlo + Coffee
    { order_id: 2, product_id: 5, quantity: 1, unit_price: 19800, total_price: 19800 },
    { order_id: 2, product_id: 6, quantity: 3, unit_price: 1990, total_price: 5970 },
    { order_id: 2, product_id: 7, quantity: 2, unit_price: 2800, total_price: 5600 },
    { order_id: 2, product_id: 8, quantity: 1, unit_price: 4500, total_price: 4500 },

    // Order 3 (Bob Wilson) - MacBook Air
    { order_id: 3, product_id: 3, quantity: 1, unit_price: 164800, total_price: 164800 },

    // Order 4 (Alice Brown) - Books and tea
    { order_id: 4, product_id: 9, quantity: 1, unit_price: 6800, total_price: 6800 },
    { order_id: 4, product_id: 10, quantity: 1, unit_price: 12000, total_price: 12000 },
    { order_id: 4, product_id: 11, quantity: 1, unit_price: 15000, total_price: 15000 },
  ];

  for (const item of orderItems) {
    await database.execute(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
       VALUES (?, ?, ?, ?, ?)`,
      [item.order_id, item.product_id, item.quantity, item.unit_price, item.total_price]
    );
  }

  console.log(`✅ Seeded ${orderItems.length} order items`);
}

/**
 * カートアイテムデータのシード
 */
async function seedCartItems(): Promise<void> {
  const cartItems = [
    { session_id: 'session_001', product_id: 2, quantity: 1 }, // Galaxy S24
    { session_id: 'session_001', product_id: 6, quantity: 2 }, // Uniqlo x2
    { session_id: 'session_002', product_id: 1, quantity: 1 }, // iPhone 15 Pro
    { session_id: 'session_002', product_id: 4, quantity: 1 }, // Nike shoes
    { session_id: 'session_003', product_id: 12, quantity: 1 }, // Kids encyclopedia
    { session_id: 'session_003', product_id: 9, quantity: 2 },  // Green tea x2
    { session_id: 'session_004', product_id: 3, quantity: 1 },  // MacBook Air
    { session_id: 'session_005', product_id: 7, quantity: 3 },  // Coffee x3
    { session_id: 'session_005', product_id: 8, quantity: 2 },  // Rice x2
  ];

  for (const item of cartItems) {
    await database.execute(
      `INSERT INTO cart_items (session_id, product_id, quantity) VALUES (?, ?, ?)`,
      [item.session_id, item.product_id, item.quantity]
    );
  }

  console.log(`✅ Seeded ${cartItems.length} cart items`);
}

/**
 * 全データのシード実行
 */
async function seedAll(): Promise<void> {
  try {
    console.log('🌱 Starting database seeding...');

    // データベース初期化
    await DatabaseConfig.initialize();

    // 既にデータが存在する場合はスキップ
    if (await isSeedExecuted()) {
      console.log('⏭️  Database already seeded. Use --force to reseed.');
      return;
    }

    // トランザクション内でシード実行
    await database.withTransaction(async () => {
      await seedUsers();
      await seedProducts();
      await seedOrders();
      await seedOrderItems();
      await seedCartItems();
    });

    // データベース統計を表示
    const stats = await getDatabaseStats();
    console.log('\n📊 Database seeding completed successfully!');
    console.log(`   Users: ${stats.users}`);
    console.log(`   Products: ${stats.products}`);
    console.log(`   Orders: ${stats.orders}`);
    console.log(`   Order Items: ${stats.orderItems}`);
    console.log(`   Cart Items: ${stats.cartItems}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

/**
 * データベース統計情報を取得
 */
async function getDatabaseStats(): Promise<{
  users: number;
  products: number;
  orders: number;
  orderItems: number;
  cartItems: number;
}> {
  const stats = await Promise.all([
    database.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users'),
    database.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM products'),
    database.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM orders'),
    database.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM order_items'),
    database.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM cart_items')
  ]);

  return {
    users: stats[0]?.count || 0,
    products: stats[1]?.count || 0,
    orders: stats[2]?.count || 0,
    orderItems: stats[3]?.count || 0,
    cartItems: stats[4]?.count || 0
  };
}

/**
 * データベースクリア
 */
async function clearDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Cannot clear production database');
    process.exit(1);
  }

  await database.withTransaction(async () => {
    await database.execute('DELETE FROM cart_items');
    await database.execute('DELETE FROM order_items');
    await database.execute('DELETE FROM orders');
    await database.execute('DELETE FROM products');
    await database.execute('DELETE FROM users');

    // Auto incrementをリセット
    await database.execute('DELETE FROM sqlite_sequence');
  });

  console.log('✅ Database cleared');
}

/**
 * メイン実行関数
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'seed';
  const force = args.includes('--force');

  try {
    switch (command) {
      case 'seed':
        if (force) {
          await clearDatabase();
        }
        await seedAll();
        break;

      case 'clear':
        await clearDatabase();
        break;

      case 'stats':
        await DatabaseConfig.initialize();
        const stats = await getDatabaseStats();
        console.log('📊 Database Statistics:');
        console.log(`   Users: ${stats.users}`);
        console.log(`   Products: ${stats.products}`);
        console.log(`   Orders: ${stats.orders}`);
        console.log(`   Order Items: ${stats.orderItems}`);
        console.log(`   Cart Items: ${stats.cartItems}`);
        break;

      default:
        console.log(`
Usage: npm run db:seed [command] [options]

Commands:
  seed    Seed database with sample data (default)
  clear   Clear all data from database (dev/test only)
  stats   Show database statistics

Options:
  --force Force reseed even if data exists

Examples:
  npm run db:seed          # Seed database if empty
  npm run db:seed --force  # Force reseed database
  npm run db:seed clear    # Clear all data
  npm run db:seed stats    # Show statistics
        `);
        break;
    }

  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  } finally {
    await DatabaseConfig.close();
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled seeding error:', error);
    process.exit(1);
  });
}