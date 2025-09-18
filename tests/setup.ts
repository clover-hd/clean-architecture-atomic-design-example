/**
 * Jest テストセットアップ
 * 包括的なテスト環境の初期化とクリーンアップ
 */

import dotenv from 'dotenv';
import { TestDatabase } from './helpers/TestDatabase';

// テスト環境の環境変数を読み込み
dotenv.config({ path: '.env.test' });

// グローバルテストタイムアウト
jest.setTimeout(30000);

// ガベージコレクションの有効化（メモリリークテスト用）
if (typeof global.gc === 'undefined') {
  (global as any).gc = () => {};
}

// テスト開始前の全体セットアップ
beforeAll(async () => {
  // プロセス終了時の適切なクリーンアップを保証
  process.on('exit', async () => {
    await TestDatabase.getInstance().afterAll();
  });

  // 未処理の拒否に対するハンドラー
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // 未キャッチの例外に対するハンドラー
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });
});

// テスト終了後の全体クリーンアップ
afterAll(async () => {
  // TestDatabaseの完全クリーンアップ
  await TestDatabase.getInstance().afterAll();

  // ファイナライザーを実行
  if (global.gc) {
    global.gc();
  }

  // 非同期タイマーのクリーンアップ
  jest.clearAllTimers();
});

// 各テスト前の共通セットアップ
beforeEach(() => {
  // すべてのモックをクリア
  jest.clearAllMocks();

  // タイマーをリセット
  jest.clearAllTimers();

  // 実際の時間を使用（必要に応じてフェイクタイマーをセット）
  jest.useRealTimers();
});

// 各テスト後の共通クリーンアップ
afterEach(() => {
  // モックの復元
  jest.restoreAllMocks();

  // タイマーのクリーンアップ
  jest.clearAllTimers();

  // コンソール警告の抑制解除
  if (jest.spyOn(console, 'warn').mockRestore) {
    jest.spyOn(console, 'warn').mockRestore();
  }
  if (jest.spyOn(console, 'error').mockRestore) {
    jest.spyOn(console, 'error').mockRestore();
  }
});

// グローバルテストユーティリティの設定
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toBeValidEmail(): R;
      toBeValidPrice(): R;
      toHaveValidTimestamp(): R;
    }
  }
}

// カスタムマッチャーの追加
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },

  toBeValidPrice(received: number) {
    const pass = Number.isInteger(received) && received >= 0 && received <= 10000000;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid price`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid price (0-10000000)`,
        pass: false,
      };
    }
  },

  toHaveValidTimestamp(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    if (pass) {
      return {
        message: () => `expected ${received} not to have a valid timestamp`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have a valid timestamp`,
        pass: false,
      };
    }
  }
});

// テスト実行時間の測定とレポート
const originalTest = global.test;
global.test = function(name: string, fn?: any, timeout?: number) {
  return originalTest(name, async () => {
    const start = Date.now();
    try {
      await fn();
    } finally {
      const duration = Date.now() - start;
      if (duration > 5000) { // 5秒以上かかるテストを警告
        console.warn(`⚠️  Slow test detected: "${name}" took ${duration}ms`);
      }
    }
  }, timeout);
};

// メモリ使用量の監視
let initialMemory: NodeJS.MemoryUsage;

beforeAll(() => {
  if (global.gc) {
    global.gc();
  }
  initialMemory = process.memoryUsage();
});

afterAll(() => {
  if (global.gc) {
    global.gc();
  }
  const finalMemory = process.memoryUsage();
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

  if (memoryIncrease > 50 * 1024 * 1024) { // 50MB以上の増加を警告
    console.warn(`⚠️  Memory leak detected: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`);
  }
});