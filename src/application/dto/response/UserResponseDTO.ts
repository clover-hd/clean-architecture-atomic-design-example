/**
 * ユーザーレスポンスDTO
 */
export interface UserResponseDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string | undefined;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * ユーザーサマリレスポンスDTO（一覧表示用）
 */
export interface UserSummaryResponseDTO {
  id: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  createdAt: string;
}

/**
 * ユーザーリストレスポンスDTO（ページネーション付き）
 */
export interface UserListResponseDTO {
  users: UserSummaryResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}