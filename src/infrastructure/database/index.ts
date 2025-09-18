/**
 * Infrastructure Database Module
 * データベース関連のエクスポート
 */

export { Database, database } from './Database';
export { DatabaseConfig } from './DatabaseConfig';

// データベース行の型定義
export interface UserRow {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_admin: number; // SQLiteではBOOLEANは0/1のinteger
  created_at: string; // SQLiteのDATETIMEは文字列
  updated_at: string;
}

export interface ProductRow {
  id: number;
  name: string;
  description: string | null;
  price: number; // SQLiteのDECIMALは数値として扱われる
  stock: number;
  category: string;
  is_active: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderRow {
  id: number;
  user_id: number;
  status: string;
  total_amount: number;
  shipping_address: string;
  billing_address: string;
  payment_method: string | null;
  payment_status: string;
  order_date: string;
  shipped_date: string | null;
  delivered_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface CartItemRow {
  id: number;
  session_id: string;
  product_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

// JOIN用の拡張型
export interface OrderWithUserRow extends OrderRow {
  user_email: string;
  user_first_name: string;
  user_last_name: string;
}

export interface OrderItemWithProductRow extends OrderItemRow {
  product_name: string;
  product_description: string | null;
  product_category: string;
  product_image_url: string | null;
}

export interface CartItemWithProductRow extends CartItemRow {
  product_name: string;
  product_description: string | null;
  product_price: number;
  product_category: string;
  product_stock: number;
  product_is_active: number;
  product_image_url: string | null;
}

// 統計データ用の型
export interface OrderStatsRow {
  total_orders: number;
  total_amount: number;
  average_amount: number;
  unique_customers: number;
}

export interface ProductStatsRow {
  total_products: number;
  active_products: number;
  categories: string;
  total_stock: number;
}

export interface DailySalesRow {
  date: string;
  sales: number;
  order_count: number;
  average_order_value: number;
}

export interface MonthlySalesRow {
  month: string;
  sales: number;
  order_count: number;
  average_order_value: number;
}