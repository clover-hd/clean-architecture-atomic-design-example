/**
 * 環境設定管理
 */

import dotenv from 'dotenv';
import path from 'path';
import type { Environment } from '@/shared/types';

// 環境に応じて適切な.envファイルを読み込み
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
const envPath = path.resolve(process.cwd(), envFile);

dotenv.config({ path: envPath });

// フォールバック用に.envも読み込み
dotenv.config();

/**
 * 環境変数の型安全な取得
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} is not a valid number`);
  }
  return parsed;
}

function getEnvBoolean(key: string, defaultValue?: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value.toLowerCase() === 'true';
}

/**
 * アプリケーション設定オブジェクト
 */
export const config = {
  // 環境設定
  nodeEnv: getEnvVar('NODE_ENV', 'development') as Environment['NODE_ENV'],
  port: getEnvNumber('PORT', 3000),

  // データベース設定
  database: {
    url: getEnvVar('DATABASE_URL'),
    path: getEnvVar('DATABASE_PATH', './data/database.sqlite'),
  },

  // セッション設定
  session: {
    secret: getEnvVar('SESSION_SECRET'),
    maxAge: getEnvNumber('SESSION_MAX_AGE', 24 * 60 * 60 * 1000), // 24時間
    secure: getEnvBoolean('SESSION_SECURE', false),
    httpOnly: getEnvBoolean('SESSION_HTTP_ONLY', true),
  },

  // セキュリティ設定
  security: {
    saltRounds: getEnvNumber('SALT_ROUNDS', 12),
  },

  // アップロード設定
  upload: {
    maxFileSize: getEnvNumber('MAX_FILE_SIZE', 5 * 1024 * 1024), // 5MB
    uploadDir: getEnvVar('UPLOAD_DIR', './public/uploads'),
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },

  // ログ設定
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    file: getEnvVar('LOG_FILE', './logs/app.log'),
    enabled: getEnvBoolean('ENABLE_LOGGING', true),
  },

  // 開発設定
  development: {
    enableCors: getEnvBoolean('ENABLE_CORS', true),
    enableLogging: getEnvBoolean('ENABLE_LOGGING', true),
  },

  // 本番設定
  production: {
    compressionEnabled: getEnvBoolean('COMPRESSION_ENABLED', true),
    cacheMaxAge: getEnvNumber('CACHE_MAX_AGE', 86400), // 24時間
  },
} as const;

/**
 * 環境判定ユーティリティ
 */
export const isDevelopment = config.nodeEnv === 'development';
export const isTest = config.nodeEnv === 'test';
export const isProduction = config.nodeEnv === 'production';

/**
 * 設定値の検証
 */
export function validateConfig(): void {
  if (isProduction && config.session.secret === 'CHANGE-THIS-TO-A-SECURE-RANDOM-STRING') {
    throw new Error('SESSION_SECRET must be changed in production environment');
  }

  if (config.security.saltRounds < 10 && isProduction) {
    console.warn('Warning: SALT_ROUNDS should be at least 10 in production');
  }
}
