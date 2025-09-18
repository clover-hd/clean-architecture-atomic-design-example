/**
 * ホームコントローラー
 * トップページと商品一覧表示を処理
 */

import { BaseController } from './BaseController';
import {
  AuthenticatedRequest,
  ControllerMethod,
  ProductSearchParams
} from '../types';
import { Response } from 'express';

// Application層のUse Cases
import {
  GetProductListUseCase
} from '../../application/usecases';

// Query DTOs
import {
  GetProductListQuery
} from '../../application/queries';

export class HomeController extends BaseController {
  constructor(
    private readonly getProductListUseCase: GetProductListUseCase
  ) {
    super();
  }

  /**
   * トップページ表示
   */
  public index: ControllerMethod = async (req, res) => {
    try {
      const { messages, errors } = this.getFlashMessages(req);

      // おすすめ商品を取得（最新8件）
      const featuredProductsQuery = new GetProductListQuery({
        page: 1,
        limit: 8,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      const featuredResult = await this.getProductListUseCase.execute(featuredProductsQuery);
      const featuredProducts = featuredResult.success ? featuredResult.data?.products || [] : [];

      // 人気商品を取得（価格順上位8件）
      const popularProductsQuery = new GetProductListQuery({
        page: 1,
        limit: 8,
        sortBy: 'price',
        sortOrder: 'desc'
      });

      const popularResult = await this.getProductListUseCase.execute(popularProductsQuery);
      const popularProducts = popularResult.success ? popularResult.data?.products || [] : [];

      // カテゴリ一覧を取得
      const categories = await this.getCategories();

      // サイト統計情報（プレースホルダー）
      const stats = {
        productCount: featuredProducts.length + popularProducts.length,
        userCount: 0,
        orderCount: 0
      };

      this.render(res, 'pages/home', {
        title: 'ECサイトホーム',
        description: 'TypeScriptで学ぶクリーンアーキテクチャとアトミックデザインのECサイト学習プロジェクト',
        featuredProducts,
        popularProducts,
        categories,
        stats,
        messages: messages || [],
        errors: errors || {},
        user: req.session.userId ? {
          id: req.session.userId,
          username: req.session.username
        } : null,
        isAuthenticated: this.isAuthenticated(req),
        bodyClass: 'page-home',
        cartCount: 0,
        currentPath: req.path || '/',
        messageType: 'info',
        customScripts: []
      });
    } catch (error) {
      console.error('Home page error:', error);
      this.serverError(res);
    }
  };

  /**
   * 商品一覧ページ表示
   */
  public products: ControllerMethod = async (req, res) => {
    try {
      const searchParams = this.getSearchParams(req);
      const { messages, errors } = this.getFlashMessages(req);

      // 検索クエリを作成
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

      // 商品一覧を取得
      const result = await this.getProductListUseCase.execute(productQuery);

      if (result.success && result.data) {
        // カテゴリ一覧を取得（後でカテゴリサービスから取得する想定）
        const categories = await this.getCategories();

        this.render(res, 'pages/home', {
          title: '商品一覧',
          products: result.data.products,
          pagination: {
            currentPage: result.data.currentPage,
            totalPages: result.data.totalPages,
            totalItems: result.data.totalItems,
            hasNext: result.data.hasNext,
            hasPrev: result.data.hasPrev
          },
          searchParams: {
            query: searchParams.query,
            category: searchParams.category,
            minPrice: searchParams.minPrice,
            maxPrice: searchParams.maxPrice,
            sortBy: searchParams.sortBy,
            sortOrder: searchParams.sortOrder
          },
          categories,
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
        this.render(res, 'pages/home', {
          title: '商品一覧',
          products: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            hasNext: false,
            hasPrev: false
          },
          searchParams,
          categories: [],
          messages,
          errors: [result.message],
          user: req.session.userId ? {
            id: req.session.userId,
            username: req.session.username
          } : null,
          isAuthenticated: this.isAuthenticated(req)
        });
      }
    } catch (error) {
      console.error('Products page error:', error);
      this.serverError(res);
    }
  };

  /**
   * 商品検索API
   */
  public searchProducts: ControllerMethod = async (req, res) => {
    try {
      const searchParams = this.getSearchParams(req);

      // 検索クエリを作成
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
      console.error('Product search error:', error);
      this.serverError(res);
    }
  };

  /**
   * カテゴリ一覧を取得（プレースホルダー実装）
   * 実際の実装では、CategoryUseCaseから取得する
   */
  private async getCategories() {
    // TODO: CategoryUseCaseを実装後、実際のカテゴリを取得
    return [
      { id: 1, name: 'エレクトロニクス', slug: 'electronics' },
      { id: 2, name: 'ファッション', slug: 'fashion' },
      { id: 3, name: 'ホーム&キッチン', slug: 'home' },
      { id: 4, name: 'スポーツ&アウトドア', slug: 'sports' },
      { id: 5, name: '本&メディア', slug: 'books' },
      { id: 6, name: '食品・飲料', slug: 'food' }
    ];
  }
}