/**
 * テストユーティリティ関数
 * テストで共通して使用されるヘルパー関数群
 */

import { TestDatabase } from './TestDatabase';
import { TestDataFactory } from './TestDataFactory';

export type AsyncFunction = () => Promise<void>;
export type TestFunction = () => void | Promise<void>;

export class TestUtils {
  /**
   * 非同期関数がエラーをスローすることを検証
   */
  public static async expectToThrow(
    asyncFn: AsyncFunction,
    expectedError?: string | RegExp | jest.Constructable
  ): Promise<void> {
    await expect(asyncFn()).rejects.toThrow(expectedError);
  }

  /**
   * 非同期関数がエラーをスローしないことを検証
   */
  public static async expectNotToThrow(asyncFn: AsyncFunction): Promise<void> {
    await expect(asyncFn()).resolves.not.toThrow();
  }

  /**
   * 配列が特定の条件を満たす要素を含むことを検証
   */
  public static expectArrayToContain<T>(
    array: T[],
    predicate: (item: T) => boolean,
    message?: string
  ): void {
    const found = array.some(predicate);
    if (!found) {
      throw new Error(message || 'Array does not contain expected item');
    }
  }

  /**
   * オブジェクトが特定のプロパティを持つことを検証
   */
  public static expectObjectToHaveProperties(
    obj: any,
    properties: string[],
    message?: string
  ): void {
    for (const prop of properties) {
      if (!(prop in obj)) {
        throw new Error(message || `Object missing property: ${prop}`);
      }
    }
  }

  /**
   * 日付が特定の範囲内にあることを検証
   */
  public static expectDateInRange(
    date: Date,
    start: Date,
    end: Date,
    message?: string
  ): void {
    if (date < start || date > end) {
      throw new Error(
        message || `Date ${date.toISOString()} is not between ${start.toISOString()} and ${end.toISOString()}`
      );
    }
  }

  /**
   * 実行時間を測定
   */
  public static async measureExecutionTime<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  }

  /**
   * ランダムな文字列を生成
   */
  public static generateRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * ランダムなメールアドレスを生成
   */
  public static generateRandomEmail(): string {
    const username = this.generateRandomString(8).toLowerCase();
    const domain = this.generateRandomString(5).toLowerCase();
    return `${username}@${domain}.com`;
  }

  /**
   * 指定した遅延を挟む
   */
  public static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * テストデータベースのセットアップとクリーンアップを管理
   */
  public static setupTestDatabase() {
    const testDb = TestDatabase.getInstance();

    beforeAll(async () => {
      await testDb.initialize();
    });

    beforeEach(async () => {
      await testDb.beforeEach();
      TestDataFactory.resetCounter();
    });

    afterEach(async () => {
      await testDb.afterEach();
    });

    afterAll(async () => {
      await testDb.afterAll();
    });

    return testDb;
  }

  /**
   * モック関数の呼び出し履歴をクリア
   */
  public static clearMockHistory(...mocks: jest.Mock[]): void {
    mocks.forEach(mock => {
      mock.mockClear();
    });
  }

  /**
   * モック関数をリセット
   */
  public static resetMocks(...mocks: jest.Mock[]): void {
    mocks.forEach(mock => {
      mock.mockReset();
    });
  }

  /**
   * モック関数を復元
   */
  public static restoreMocks(...mocks: jest.Mock[]): void {
    mocks.forEach(mock => {
      mock.mockRestore();
    });
  }

  /**
   * 部分的なオブジェクトマッチング
   */
  public static expectObjectContaining<T extends Record<string, any>>(
    received: T,
    expected: Partial<T>
  ): void {
    for (const [key, value] of Object.entries(expected)) {
      expect(received).toHaveProperty(key, value);
    }
  }

  /**
   * 配列の順序を無視した比較
   */
  public static expectArrayToEqual<T>(
    received: T[],
    expected: T[],
    compareFn?: (a: T, b: T) => boolean
  ): void {
    expect(received).toHaveLength(expected.length);

    if (compareFn) {
      for (const expectedItem of expected) {
        const found = received.some(receivedItem => compareFn(receivedItem, expectedItem));
        expect(found).toBe(true);
      }
    } else {
      for (const expectedItem of expected) {
        expect(received).toContain(expectedItem);
      }
    }
  }

  /**
   * エラーメッセージの詳細検証
   */
  public static expectErrorWithDetails(
    error: Error,
    expectedMessage: string | RegExp,
    expectedProperties?: Record<string, any>
  ): void {
    expect(error.message).toMatch(expectedMessage);

    if (expectedProperties) {
      for (const [key, value] of Object.entries(expectedProperties)) {
        expect((error as any)[key]).toEqual(value);
      }
    }
  }

  /**
   * TypeScript型安全性テストヘルパー
   */
  public static typeAssertions = {
    /**
     * 型が期待されたものであることを確認
     */
    assertType: <T>(value: T): T => value,

    /**
     * never型をテスト（コンパイル時エラーを確認）
     */
    assertNever: (value: never): never => {
      throw new Error(`Unexpected value: ${value}`);
    },

    /**
     * オプショナルプロパティの存在を確認
     */
    assertOptionalProperty: <T, K extends keyof T>(
      obj: T,
      key: K
    ): obj is T & Required<Pick<T, K>> => {
      return obj[key] !== undefined;
    }
  };

  /**
   * パフォーマンステスト用のベンチマーク
   */
  public static async benchmark(
    name: string,
    fn: () => Promise<void>,
    iterations: number = 100
  ): Promise<{ average: number; min: number; max: number; total: number }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { duration } = await this.measureExecutionTime(fn);
      times.push(duration);
    }

    const total = times.reduce((sum, time) => sum + time, 0);
    const average = total / iterations;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`Benchmark ${name}:`);
    console.log(`  Average: ${average.toFixed(2)}ms`);
    console.log(`  Min: ${min}ms`);
    console.log(`  Max: ${max}ms`);
    console.log(`  Total: ${total}ms (${iterations} iterations)`);

    return { average, min, max, total };
  }

  /**
   * メモリ使用量の監視
   */
  public static getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * メモリリークの検出
   */
  public static async detectMemoryLeak(
    fn: () => Promise<void>,
    threshold: number = 10 * 1024 * 1024 // 10MB
  ): Promise<boolean> {
    // ガベージコレクションを実行
    if (global.gc) {
      global.gc();
    }

    const beforeMemory = this.getMemoryUsage();
    await fn();

    if (global.gc) {
      global.gc();
    }

    const afterMemory = this.getMemoryUsage();
    const memoryIncrease = afterMemory.heapUsed - beforeMemory.heapUsed;

    console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

    return memoryIncrease > threshold;
  }

  /**
   * リトライロジックのテスト
   */
  public static async retryUntilSuccess(
    fn: () => Promise<boolean>,
    maxRetries: number = 3,
    delay: number = 100
  ): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await fn();
        if (result) {
          return true;
        }
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
      }

      await this.delay(delay);
    }

    return false;
  }
}