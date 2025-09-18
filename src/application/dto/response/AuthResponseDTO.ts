/**
 * ログインレスポンスDTO
 */
export interface LoginResponseDTO {
  user: {
    id: string;
    email: string;
    fullName: string;
    isAdmin: boolean;
  };
  sessionId: string;
  message: string;
}

/**
 * ログアウトレスポンスDTO
 */
export interface LogoutResponseDTO {
  message: string;
}

/**
 * 認証状態レスポンスDTO
 */
export interface AuthStatusResponseDTO {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    fullName: string;
    isAdmin: boolean;
  };
}