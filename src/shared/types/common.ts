/**
 * 共通型定義
 */

// プライマリキーの型
export type Id = number;

// 日付型の統一
export type DateString = string; // ISO 8601形式

// ページネーション関連
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API レスポンス型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
  statusCode: number;
}

// ソート関連
export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  field: string;
  order: SortOrder;
}

// 検索関連
export interface SearchParams {
  query: string;
  fields?: string[];
}

// 実体の基底型
export interface BaseEntity {
  id: Id;
  createdAt: DateString;
  updatedAt: DateString;
}

// 値オブジェクト関連
export interface ValueObject<T> {
  value: T;
  equals(other: ValueObject<T>): boolean;
}

// エラーハンドリング関連
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  success: true;
  value: T;
}

export interface Failure<E> {
  success: false;
  error: E;
}

// ファイルアップロード関連
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// 環境変数関連
export interface Environment {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  SESSION_SECRET: string;
  SALT_ROUNDS: number;
}
