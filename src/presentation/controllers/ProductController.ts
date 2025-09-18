/**
 * 商品コントローラー
 * 商品詳細表示と商品関連機能を処理
 */

import { BaseController } from './BaseController';
import {
  AuthenticatedRequest,
  ControllerMethod,
  HttpStatusCode
} from '../types';
import { Response } from 'express';

// Application層のUse Cases
import {
  GetProductDetailUseCase,
  GetProductListUseCase
} from '../../application/usecases';

// Query DTOs
import {
  GetProductQuery,
  GetProductListQuery
} from '../../application/queries';

export class ProductController extends BaseController {
  constructor(
    private readonly getProductDetailUseCase: GetProductDetailUseCase,
    private readonly getProductListUseCase: GetProductListUseCase
  ) {
    super();
  }

  /**
   * 商品詳細ページ表示
   */
  public detail: ControllerMethod = async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { messages, errors } = this.getFlashMessages(req);

      if (!productId || isNaN(productId)) {
        this.setFlashError(req, '無効な商品IDです');
        return this.redirect(res, '/products');
      }

      // 商品詳細を取得
      const productQuery = new GetProductQuery(productId);
      const result = await this.getProductDetailUseCase.execute(productQuery);

      if (result.success && result.data) {
        // 関連商品を取得（同じカテゴリの商品、現在の商品を除く）
        const relatedProductsQuery = new GetProductListQuery({
          page: 1,
          limit: 4,
          category: result.data.category,
          sortBy: 'created_at',
          sortOrder: 'desc'
        });

        const relatedResult = await this.getProductListUseCase.execute(relatedProductsQuery);
        const relatedProducts = relatedResult.success
          ? (relatedResult.data?.products || []).filter(p => p.id !== productId)
          : [];

        this.render(res, 'pages/product-detail', {
          title: `${result.data.name} - 商品詳細`,
          product: result.data,
          relatedProducts,
          messages,
          errors,
          user: req.session.userId ? {
            id: req.session.userId,
            username: req.session.username
          } : null,
          isAuthenticated: this.isAuthenticated(req)
        });
      } else {
        this.setFlashError(req, result.message);
        this.redirect(res, '/products');
      }
    } catch (error) {
      console.error('Product detail error:', error);
      this.serverError(res);
    }
  };

  /**
   * 商品詳細API
   */
  public getDetail: ControllerMethod = async (req, res) => {
    try {
      const productId = parseInt(req.params.id);

      if (!productId || isNaN(productId)) {
        return this.error(res, 'Invalid product ID', HttpStatusCode.BAD_REQUEST);
      }

      const productQuery = new GetProductQuery(productId);

      // Use Caseを実行
      await this.handleUseCaseResult(
        res,
        this.getProductDetailUseCase.execute(productQuery)
      );
    } catch (error) {
      console.error('Get product detail error:', error);
      this.serverError(res);
    }
  };

  /**
   * 商品一覧API（フィルタリング付き）
   */
  public getList: ControllerMethod = async (req, res) => {
    try {
      const searchParams = this.getSearchParams(req);

      const productQuery = new GetProductListQuery({
        page: searchParams.page,
        limit: searchParams.limit,
        query: searchParams.query,
        category: searchParams.category,
        minPrice: searchParams.minPrice,
        maxPrice: searchParams.maxPrice,
        sortBy: searchParams.sortBy,
        sortOrder: searchParams.sortOrder
      });

      // Use Caseを実行
      await this.handleUseCaseResult(
        res,
        this.getProductListUseCase.execute(productQuery)
      );
    } catch (error) {
      console.error('Get product list error:', error);
      this.serverError(res);
    }
  };

  /**
   * 商品検索サジェスト機能
   */
  public searchSuggestions: ControllerMethod = async (req, res) => {
    try {
      const query = req.query.q as string;

      if (!query || query.trim().length < 2) {
        return this.success(res, { suggestions: [] }, 'No suggestions');
      }

      // 商品名で検索（最大10件）
      const searchQuery = new GetProductListQuery({
        page: 1,
        limit: 10,
        query: query.trim(),
        sortBy: 'name',
        sortOrder: 'asc'
      });

      const result = await this.getProductListUseCase.execute(searchQuery);

      if (result.success && result.data) {
        const suggestions = result.data.products.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price
        }));

        this.success(res, { suggestions }, 'Search suggestions retrieved');
      } else {
        this.success(res, { suggestions: [] }, 'No suggestions found');
      }
    } catch (error) {
      console.error('Search suggestions error:', error);
      this.success(res, { suggestions: [] }, 'Error retrieving suggestions');
    }
  };

  /**
   * カテゴリ別商品一覧
   */
  public byCategory: ControllerMethod = async (req, res) => {
    try {
      const category = req.params.category;
      const searchParams = this.getSearchParams(req);

      if (!category) {
        return this.error(res, 'Category is required', HttpStatusCode.BAD_REQUEST);
      }

      const productQuery = new GetProductListQuery({
        page: searchParams.page,
        limit: searchParams.limit,
        category,
        sortBy: searchParams.sortBy,
        sortOrder: searchParams.sortOrder
      });

      // Use Caseを実行
      await this.handleUseCaseResult(
        res,
        this.getProductListUseCase.execute(productQuery)
      );
    } catch (error) {
      console.error('Category products error:', error);
      this.serverError(res);
    }
  };

  /**
   * 商品可用性チェック（在庫確認）
   */
  public checkAvailability: ControllerMethod = async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const quantity = parseInt(req.query.quantity as string) || 1;

      if (!productId || isNaN(productId)) {
        return this.error(res, 'Invalid product ID', HttpStatusCode.BAD_REQUEST);
      }

      const productQuery = new GetProductQuery(productId);
      const result = await this.getProductDetailUseCase.execute(productQuery);

      if (result.success && result.data) {
        const isAvailable = result.data.stock >= quantity;

        this.success(res, {
          productId,
          requestedQuantity: quantity,
          availableStock: result.data.stock,
          isAvailable
        }, isAvailable ? 'Product is available' : 'Insufficient stock');
      } else {
        this.notFound(res, 'Product not found');
      }
    } catch (error) {
      console.error('Availability check error:', error);
      this.serverError(res);
    }
  };

  /**
   * 商品一覧ページ表示
   */
  public list: ControllerMethod = async (req, res) => {
    try {
      const searchParams = this.getSearchParams(req);
      const { messages, errors } = this.getFlashMessages(req);

      const productQuery = new GetProductListQuery({
        page: searchParams.page,
        limit: searchParams.limit,
        query: searchParams.query,
        category: searchParams.category,
        minPrice: searchParams.minPrice,
        maxPrice: searchParams.maxPrice,
        sortBy: searchParams.sortBy,
        sortOrder: searchParams.sortOrder
      });

      const result = await this.getProductListUseCase.execute(productQuery);

      if (result.success && result.data) {
        this.render(res, 'pages/products', {
          title: '商品一覧',
          products: result.data.products,
          pagination: {
            currentPage: result.data.pagination.currentPage,
            totalPages: result.data.pagination.totalPages,
            totalCount: result.data.pagination.totalCount,
            limit: result.data.pagination.limit,
            hasNext: result.data.pagination.hasNext,
            hasPrev: result.data.pagination.hasPrev
          },
          searchParams,
          messages,
          errors,
          user: req.session.userId ? {
            id: req.session.userId,
            username: req.session.username
          } : null,
          isAuthenticated: this.isAuthenticated(req),
          currentPath: req.originalUrl || '/products'
        });
      } else {
        this.setFlashError(req, result.message || '商品一覧の取得に失敗しました');
        this.render(res, 'pages/products', {
          title: '商品一覧',
          products: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            limit: 12,
            hasNext: false,
            hasPrev: false
          },
          searchParams,
          messages,
          errors: { general: [result.message || '商品一覧の取得に失敗しました'] },
          user: req.session.userId ? {
            id: req.session.userId,
            username: req.session.username
          } : null,
          isAuthenticated: this.isAuthenticated(req),
          currentPath: req.originalUrl || '/products'
        });
      }
    } catch (error) {
      console.error('Product list page error:', error);
      this.serverError(res);
    }
  };
}