/**
 * Database Error Classes
 * データベース固有のエラーをDomain例外に変換するクラス群
 */

/**
 * 基底データベースエラークラス
 */
export class DatabaseError extends Error {
  public readonly originalError: Error | undefined;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.originalError = originalError;

    // Error.captureStackTrace が利用可能な場合にスタックトレースを設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * データベース接続エラー
 */
export class DatabaseConnectionError extends DatabaseError {
  constructor(message: string = 'Database connection failed', originalError?: Error) {
    super(message, originalError);
  }
}

/**
 * レコードが見つからないエラー
 */
export class RecordNotFoundError extends DatabaseError {
  constructor(entityName: string, identifier: string | number, originalError?: Error) {
    super(`${entityName} not found: ${identifier}`, originalError);
  }
}

/**
 * 制約違反エラー（ユニーク制約、外部キー制約など）
 */
export class ConstraintViolationError extends DatabaseError {
  public readonly constraintType: 'unique' | 'foreign_key' | 'check' | 'not_null' | 'unknown';

  constructor(
    message: string,
    constraintType: 'unique' | 'foreign_key' | 'check' | 'not_null' | 'unknown' = 'unknown',
    originalError?: Error
  ) {
    super(message, originalError);
    this.constraintType = constraintType;
  }
}

/**
 * トランザクションエラー
 */
export class TransactionError extends DatabaseError {
  constructor(message: string = 'Transaction failed', originalError?: Error) {
    super(message, originalError);
  }
}

/**
 * データベーススキーマエラー
 */
export class SchemaError extends DatabaseError {
  constructor(message: string = 'Database schema error', originalError?: Error) {
    super(message, originalError);
  }
}

/**
 * データベースタイムアウトエラー
 */
export class DatabaseTimeoutError extends DatabaseError {
  constructor(message: string = 'Database operation timeout', originalError?: Error) {
    super(message, originalError);
  }
}

/**
 * データ変換エラー
 */
export class DataMappingError extends DatabaseError {
  constructor(entityName: string, operation: string, originalError?: Error) {
    super(`Failed to map ${entityName} during ${operation}`, originalError);
  }
}

/**
 * SQLiteエラーコードとエラークラスファクトリーのマッピング
 */
const SQLITE_ERROR_CODE_MAP: Record<string, (message: string, error?: Error) => DatabaseError> = {
  'SQLITE_CONSTRAINT_UNIQUE': (message, error) => new ConstraintViolationError(message, 'unique', error),
  'SQLITE_CONSTRAINT_FOREIGNKEY': (message, error) => new ConstraintViolationError(message, 'foreign_key', error),
  'SQLITE_CONSTRAINT_CHECK': (message, error) => new ConstraintViolationError(message, 'check', error),
  'SQLITE_CONSTRAINT_NOTNULL': (message, error) => new ConstraintViolationError(message, 'not_null', error),
  'SQLITE_BUSY': (message, error) => new DatabaseTimeoutError(message, error),
  'SQLITE_LOCKED': (message, error) => new DatabaseTimeoutError(message, error),
  'SQLITE_CANTOPEN': (message, error) => new DatabaseConnectionError(message, error),
  'SQLITE_SCHEMA': (message, error) => new SchemaError(message, error),
};

/**
 * SQLiteエラーをDomain例外に変換するファクトリークラス
 */
export class DatabaseErrorFactory {
  /**
   * SQLite3エラーをDomain例外に変換
   * @param error 元のSQLite3エラー
   * @param context エラーコンテキスト（エンティティ名、操作名など）
   * @returns 変換されたDomain例外
   */
  public static fromSqliteError(
    error: any,
    context?: {
      entityName?: string;
      operation?: string;
      identifier?: string | number;
    }
  ): DatabaseError {
    if (!error) {
      return new DatabaseError('Unknown database error');
    }

    const errorCode = error.code || error.errno;
    const message = error.message || 'Database error occurred';

    // SQLiteエラーコードによる変換
    if (errorCode && SQLITE_ERROR_CODE_MAP[errorCode]) {
      const errorFactory = SQLITE_ERROR_CODE_MAP[errorCode];
      return errorFactory(this.buildConstraintMessage(message, context), error);
    }

    // エラーメッセージによる判定
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('no such table') || lowerMessage.includes('no such column')) {
      return new SchemaError(`Schema error: ${message}`, error);
    }

    if (lowerMessage.includes('unique constraint') || lowerMessage.includes('unique')) {
      return new ConstraintViolationError(
        this.buildConstraintMessage(message, context),
        'unique',
        error
      );
    }

    if (lowerMessage.includes('foreign key') || lowerMessage.includes('foreign')) {
      return new ConstraintViolationError(
        this.buildConstraintMessage(message, context),
        'foreign_key',
        error
      );
    }

    if (lowerMessage.includes('not null')) {
      return new ConstraintViolationError(
        this.buildConstraintMessage(message, context),
        'not_null',
        error
      );
    }

    if (lowerMessage.includes('timeout') || lowerMessage.includes('busy') || lowerMessage.includes('locked')) {
      return new DatabaseTimeoutError(`Database timeout: ${message}`, error);
    }

    if (lowerMessage.includes('connection') || lowerMessage.includes('connect')) {
      return new DatabaseConnectionError(`Connection error: ${message}`, error);
    }

    // 特定のパターンに該当しない場合は汎用DatabaseErrorを返す
    return new DatabaseError(message, error);
  }

  /**
   * NotFoundエラーを作成
   * @param entityName エンティティ名
   * @param identifier 識別子
   * @returns RecordNotFoundError
   */
  public static createNotFoundError(entityName: string, identifier: string | number): RecordNotFoundError {
    return new RecordNotFoundError(entityName, identifier);
  }

  /**
   * データマッピングエラーを作成
   * @param entityName エンティティ名
   * @param operation 操作名
   * @param originalError 元のエラー
   * @returns DataMappingError
   */
  public static createMappingError(entityName: string, operation: string, originalError?: Error): DataMappingError {
    return new DataMappingError(entityName, operation, originalError);
  }

  /**
   * トランザクションエラーを作成
   * @param message エラーメッセージ
   * @param originalError 元のエラー
   * @returns TransactionError
   */
  public static createTransactionError(message?: string, originalError?: Error): TransactionError {
    return new TransactionError(message, originalError);
  }

  /**
   * 制約違反のメッセージを構築
   * @param message 元のエラーメッセージ
   * @param context エラーコンテキスト
   * @returns 構築されたメッセージ
   */
  private static buildConstraintMessage(
    message: string,
    context?: {
      entityName?: string;
      operation?: string;
      identifier?: string | number;
    }
  ): string {
    if (!context) {
      return message;
    }

    const parts = [];

    if (context.entityName) {
      parts.push(context.entityName);
    }

    if (context.operation) {
      parts.push(context.operation);
    }

    if (context.identifier) {
      parts.push(`(${context.identifier})`);
    }

    const contextStr = parts.length > 0 ? `[${parts.join(' ')}] ` : '';
    return `${contextStr}${message}`;
  }

  /**
   * エラーコードから制約タイプを取得
   * @param errorCode SQLiteエラーコード
   * @returns 制約タイプ
   */
  private static getConstraintType(errorCode: string): 'unique' | 'foreign_key' | 'check' | 'not_null' | 'unknown' {
    switch (errorCode) {
      case 'SQLITE_CONSTRAINT_UNIQUE':
        return 'unique';
      case 'SQLITE_CONSTRAINT_FOREIGNKEY':
        return 'foreign_key';
      case 'SQLITE_CONSTRAINT_CHECK':
        return 'check';
      case 'SQLITE_CONSTRAINT_NOTNULL':
        return 'not_null';
      default:
        return 'unknown';
    }
  }
}

/**
 * エラーハンドリングユーティリティ
 */
export class DatabaseErrorHandler {
  /**
   * データベース操作をラップしてエラーハンドリングを提供
   * @param operation データベース操作関数
   * @param context エラーコンテキスト
   * @returns ラップされた操作結果
   */
  public static async handle<T>(
    operation: () => Promise<T>,
    context?: {
      entityName?: string;
      operation?: string;
      identifier?: string | number;
    }
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw DatabaseErrorFactory.fromSqliteError(error, context);
    }
  }

  /**
   * 単一レコード取得のエラーハンドリング
   * レコードが見つからない場合はnullを返す
   * @param operation データベース操作関数
   * @param context エラーコンテキスト
   * @returns レコードまたはnull
   */
  public static async handleFindOne<T>(
    operation: () => Promise<T | null>,
    context?: {
      entityName?: string;
      identifier?: string | number;
    }
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      // RecordNotFoundError以外は再スロー
      const dbError = DatabaseErrorFactory.fromSqliteError(error, {
        ...context,
        operation: 'find'
      });

      if (dbError instanceof RecordNotFoundError) {
        return null;
      }

      throw dbError;
    }
  }

  /**
   * 複数レコード取得のエラーハンドリング
   * エラーの場合は空配列を返す（オプション）
   * @param operation データベース操作関数
   * @param context エラーコンテキスト
   * @param returnEmptyOnError エラー時に空配列を返すかどうか
   * @returns レコード配列
   */
  public static async handleFindMany<T>(
    operation: () => Promise<T[]>,
    context?: {
      entityName?: string;
      operation?: string;
    },
    returnEmptyOnError: boolean = false
  ): Promise<T[]> {
    try {
      return await operation();
    } catch (error) {
      const dbError = DatabaseErrorFactory.fromSqliteError(error, {
        ...context,
        operation: context?.operation || 'findMany'
      });

      if (returnEmptyOnError) {
        console.warn('Database find operation failed, returning empty array:', dbError.message);
        return [];
      }

      throw dbError;
    }
  }

  /**
   * トランザクション内でのエラーハンドリング
   * @param operation トランザクション操作関数
   * @param context エラーコンテキスト
   * @returns 操作結果
   */
  public static async handleTransaction<T>(
    operation: () => Promise<T>,
    context?: {
      operation?: string;
    }
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw DatabaseErrorFactory.createTransactionError(
        context?.operation ? `Transaction failed during ${context.operation}` : undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}