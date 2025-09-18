/**
 * ベースコントローラークラス
 * 全てのコントローラーの共通機能を提供
 */

import { Response } from 'express';
import {
  AuthenticatedRequest,
  ApiResponse,
  HttpStatusCode,
  ValidationError
} from '../types';

export abstract class BaseController {
  /**
   * 成功レスポンスを返す
   */
  protected success<T>(
    res: Response,
    data?: T,
    message: string = 'Success',
    statusCode: HttpStatusCode = HttpStatusCode.OK
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data
    };

    res.status(statusCode).json(response);
  }

  /**
   * エラーレスポンスを返す
   */
  protected error(
    res: Response,
    message: string,
    statusCode: HttpStatusCode = HttpStatusCode.BAD_REQUEST,
    errors?: ValidationError[]
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      errors: errors?.map(err => err.message)
    };

    res.status(statusCode).json(response);
  }

  /**
   * バリデーションエラーレスポンスを返す
   */
  protected validationError(
    res: Response,
    errors: ValidationError[],
    message: string = 'Validation failed'
  ): void {
    this.error(res, message, HttpStatusCode.UNPROCESSABLE_ENTITY, errors);
  }

  /**
   * 認証エラーレスポンスを返す
   */
  protected unauthorized(
    res: Response,
    message: string = 'Authentication required'
  ): void {
    this.error(res, message, HttpStatusCode.UNAUTHORIZED);
  }

  /**
   * 権限エラーレスポンスを返す
   */
  protected forbidden(
    res: Response,
    message: string = 'Access forbidden'
  ): void {
    this.error(res, message, HttpStatusCode.FORBIDDEN);
  }

  /**
   * 見つからないエラーレスポンスを返す
   */
  protected notFound(
    res: Response,
    message: string = 'Resource not found'
  ): void {
    this.error(res, message, HttpStatusCode.NOT_FOUND);
  }

  /**
   * サーバーエラーレスポンスを返す
   */
  protected serverError(
    res: Response,
    message: string = 'Internal server error'
  ): void {
    this.error(res, message, HttpStatusCode.INTERNAL_SERVER_ERROR);
  }

  /**
   * HTMLページをレンダリング
   */
  protected render(
    res: Response,
    template: string,
    data: Record<string, any> = {},
    statusCode: HttpStatusCode = HttpStatusCode.OK
  ): void {
    res.status(statusCode).render(template, data);
  }

  /**
   * リダイレクト
   */
  protected redirect(
    res: Response,
    url: string,
    statusCode: number = 302
  ): void {
    res.redirect(statusCode, url);
  }

  /**
   * 認証状態チェック
   */
  protected isAuthenticated(req: AuthenticatedRequest): boolean {
    return !!(req.session?.isAuthenticated && req.session?.userId);
  }

  /**
   * 現在のユーザーIDを取得
   */
  protected getCurrentUserId(req: AuthenticatedRequest): number | null {
    return req.session?.userId || null;
  }

  /**
   * ページネーションパラメータを解析
   */
  protected getPaginationParams(req: AuthenticatedRequest) {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * 検索パラメータを解析
   */
  protected getSearchParams(req: AuthenticatedRequest) {
    const { page, limit, offset } = this.getPaginationParams(req);

    return {
      page,
      limit,
      offset,
      query: req.query.q as string || '',
      category: req.query.category as string || '',
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      sortBy: (req.query.sortBy as string) || 'created_at',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
    };
  }

  /**
   * Use Caseの結果をハンドリング
   */
  protected async handleUseCaseResult<T>(
    res: Response,
    useCasePromise: Promise<{
      success: boolean;
      message: string;
      data?: T;
    }>,
    successStatusCode: HttpStatusCode = HttpStatusCode.OK
  ): Promise<void> {
    try {
      const result = await useCasePromise;

      if (result.success) {
        this.success(res, result.data, result.message, successStatusCode);
      } else {
        this.error(res, result.message);
      }
    } catch (error) {
      console.error('Controller error:', error);
      this.serverError(res, 'An unexpected error occurred');
    }
  }

  /**
   * セッションエラーメッセージを設定
   */
  protected setFlashError(req: AuthenticatedRequest, message: string): void {
    if (!req.session.flashErrors) {
      req.session.flashErrors = [];
    }
    req.session.flashErrors.push(message);
  }

  /**
   * セッション成功メッセージを設定
   */
  protected setFlashSuccess(req: AuthenticatedRequest, message: string): void {
    if (!req.session.flashMessages) {
      req.session.flashMessages = [];
    }
    req.session.flashMessages.push(message);
  }

  /**
   * フラッシュメッセージを取得してクリア
   */
  protected getFlashMessages(req: AuthenticatedRequest) {
    const messages = req.session.flashMessages || [];
    const errors = req.session.flashErrors || [];

    // メッセージをクリア
    req.session.flashMessages = [];
    req.session.flashErrors = [];

    return { messages, errors };
  }
}