/**
 * Express型拡張
 */

import { Session } from 'express-session';
import { Request, Response, NextFunction } from 'express';

// セッション情報の型定義
export interface SessionData {
  userId?: number;
  username?: string;
  isAuthenticated?: boolean;
  cart?: CartItem[];
  csrfSecret?: string;
  flashErrors?: string[];
  flashMessages?: string[];
  returnTo?: string;
}

export interface CartItem {
  productId: number;
  quantity: number;
  addedAt: string;
}

// Express Request拡張
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
    }
  }
}

// 拡張されたRequestインターフェース
export interface ExtendedRequest extends Request {
  session: Session & Partial<SessionData>;
  user?: Express.User;
}

// 拡張されたResponseインターフェース
export interface ExtendedResponse extends Response {
  success<T>(data: T, message?: string): Response;
  error(message: string, statusCode?: number, errors?: string[]): Response;
}

// ルートハンドラー型
export type RouteHandler = (
  req: ExtendedRequest,
  res: ExtendedResponse,
  next: NextFunction
) => void | Promise<void>;

export type ErrorHandler = (
  err: Error,
  req: ExtendedRequest,
  res: ExtendedResponse,
  next: NextFunction
) => void;

// ミドルウェア型
export type Middleware = RouteHandler;

// リクエストボディ型
export interface LoginRequestBody {
  username: string;
  password: string;
}

export interface RegisterRequestBody {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProductCreateRequestBody {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId?: number;
}

export interface ProductUpdateRequestBody extends Partial<ProductCreateRequestBody> {}

// リクエストパラメータ型
export interface ProductParams {
  id: string;
}

export interface CategoryParams {
  id: string;
}

export interface UserParams {
  id: string;
}

// クエリパラメータ型
export interface ProductQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  categoryId?: string;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  minPrice?: string;
  maxPrice?: string;
}

export interface OrderQueryParams {
  page?: string;
  limit?: string;
  status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  fromDate?: string;
  toDate?: string;
}
