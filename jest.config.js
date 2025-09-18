module.exports = {
  // TypeScript設定
  preset: 'ts-jest',
  testEnvironment: 'node',

  // ファイル検索設定
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // モジュール解決設定
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // カバレッジ設定
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/server.ts',
    '!src/index.ts',
    '!src/app.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary', 'cobertura'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Domain層は高いカバレッジを要求
    'src/domain/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Application層のUse Case
    'src/application/usecases/**/*.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Infrastructure層のRepository
    'src/infrastructure/repositories/**/*.ts': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // テスト設定
  verbose: true,
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,

  // 並行実行設定
  maxWorkers: '50%',

  // エラーハンドリング
  errorOnDeprecated: true,
};