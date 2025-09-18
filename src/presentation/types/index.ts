/**
 * Presentation層型定義
 */

import { Request, Response, NextFunction } from 'express';
import { Session } from 'express-session';

// セッション拡張
export interface AuthSession extends Session {
  userId?: number;
  username?: string;
  isAuthenticated?: boolean;
  cart?: SessionCartItem[];
}

export interface SessionCartItem {
  productId: number;
  quantity: number;
  addedAt: string;
}

// 拡張されたRequest型
export interface AuthenticatedRequest extends Request {
  session: AuthSession;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

// コントローラーメソッド型
export type ControllerMethod = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

// API応答型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// ページネーション型
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

// 検索パラメータ型
export interface ProductSearchParams extends PaginationParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

// カート操作型
export interface CartActionRequest {
  productId: number;
  quantity: number;
}

// 認証リクエスト型
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ユーザー更新リクエスト型
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

// エラー型
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface HttpError extends Error {
  statusCode: number;
  errors?: ValidationError[];
}