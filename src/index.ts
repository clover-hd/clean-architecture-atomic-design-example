/**
 * アプリケーションエントリーポイント
 * Clean Architecture TypeScript EC Site
 */

import { startServer } from './server';

// サーバー起動
startServer().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});