import { User } from '../../domain/entities/User';
import { UserId, Email } from '../../domain/value-objects';
import { UserRow } from '../database';

/**
 * User Entity と Database Row の変換を行うマッパー
 * 型安全性を保ちながらDomain EntityとSQLite Rowの変換を実行
 */
export class UserMapper {
  /**
   * Database Row を Domain Entity に変換
   * @param row SQLiteから取得したUserRow
   * @returns User Domain Entity
   * @throws {Error} 変換に失敗した場合
   */
  public static toDomain(row: UserRow): User {
    try {
      const userId = UserId.create(row.id);
      const email = Email.create(row.email);

      return User.restore(
        userId,
        email,
        row.first_name,
        row.last_name,
        Boolean(row.is_admin), // SQLiteの0/1をBooleanに変換
        new Date(row.created_at),
        new Date(row.updated_at),
        row.phone || undefined
      );
    } catch (error) {
      throw new Error(`Failed to convert UserRow to User entity: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Domain Entity を Database Row 形式に変換
   * @param user User Domain Entity
   * @returns SQLite挿入用のオブジェクト（idは除く）
   */
  public static toRow(user: User): Omit<UserRow, 'id'> {
    return {
      email: user.email.value,
      first_name: user.firstName,
      last_name: user.lastName,
      phone: user.phone || null,
      is_admin: user.isAdmin ? 1 : 0, // BooleanをSQLiteの0/1に変換
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString()
    };
  }

  /**
   * Domain Entity を Database 更新用形式に変換
   * @param user User Domain Entity
   * @returns SQLite更新用のオブジェクト
   */
  public static toUpdateRow(user: User): {
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    is_admin: number;
    updated_at: string;
  } {
    return {
      email: user.email.value,
      first_name: user.firstName,
      last_name: user.lastName,
      phone: user.phone || null,
      is_admin: user.isAdmin ? 1 : 0,
      updated_at: new Date().toISOString() // 更新時は現在時刻
    };
  }

  /**
   * 複数のDatabase Rowを Domain Entityの配列に変換
   * @param rows SQLiteから取得したUserRowの配列
   * @returns User Domain Entityの配列
   * @throws {Error} いずれかの変換に失敗した場合
   */
  public static toDomainArray(rows: UserRow[]): User[] {
    return rows.map((row, index) => {
      try {
        return this.toDomain(row);
      } catch (error) {
        throw new Error(`Failed to convert UserRow at index ${index}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Domain Entity から 挿入用パラメータ配列を生成
   * SQLite prepared statementで使用
   * @param user User Domain Entity
   * @returns パラメータ配列
   */
  public static toInsertParams(user: User): [string, string, string, string | null, number, string, string] {
    return [
      user.email.value,
      user.firstName,
      user.lastName,
      user.phone || null,
      user.isAdmin ? 1 : 0,
      user.createdAt.toISOString(),
      user.updatedAt.toISOString()
    ];
  }

  /**
   * Domain Entity から 更新用パラメータ配列を生成
   * SQLite prepared statementで使用（WHERE id = ? 用のパラメータも含む）
   * @param user User Domain Entity
   * @returns パラメータ配列（最後にidを含む）
   */
  public static toUpdateParams(user: User): [string, string, string, string | null, number, string, number] {
    return [
      user.email.value,
      user.firstName,
      user.lastName,
      user.phone || null,
      user.isAdmin ? 1 : 0,
      new Date().toISOString(),
      user.id.value
    ];
  }

  /**
   * UserRow の検証
   * データベースから取得した行が有効かチェック
   * @param row 検証するUserRow
   * @returns 有効な場合true
   */
  public static isValidRow(row: any): row is UserRow {
    if (!row || typeof row !== 'object') {
      return false;
    }

    const requiredFields = ['id', 'email', 'first_name', 'last_name', 'is_admin', 'created_at', 'updated_at'];

    for (const field of requiredFields) {
      if (!(field in row)) {
        return false;
      }
    }

    // 基本的な型チェック
    return (
      typeof row.id === 'number' &&
      typeof row.email === 'string' &&
      typeof row.first_name === 'string' &&
      typeof row.last_name === 'string' &&
      typeof row.is_admin === 'number' &&
      typeof row.created_at === 'string' &&
      typeof row.updated_at === 'string' &&
      (row.phone === null || typeof row.phone === 'string')
    );
  }

  /**
   * Domain Entity から 部分更新用のSQLとパラメータを生成
   * 指定されたフィールドのみを更新
   * @param user User Domain Entity
   * @param fields 更新するフィールド名の配列
   * @returns {sql: string, params: any[]}
   */
  public static toPartialUpdateQuery(
    user: User,
    fields: Array<'email' | 'first_name' | 'last_name' | 'phone' | 'is_admin'>
  ): { sql: string; params: any[] } {
    if (fields.length === 0) {
      throw new Error('At least one field must be specified for partial update');
    }

    const setClauses: string[] = [];
    const params: any[] = [];

    for (const field of fields) {
      switch (field) {
        case 'email':
          setClauses.push('email = ?');
          params.push(user.email.value);
          break;
        case 'first_name':
          setClauses.push('first_name = ?');
          params.push(user.firstName);
          break;
        case 'last_name':
          setClauses.push('last_name = ?');
          params.push(user.lastName);
          break;
        case 'phone':
          setClauses.push('phone = ?');
          params.push(user.phone || null);
          break;
        case 'is_admin':
          setClauses.push('is_admin = ?');
          params.push(user.isAdmin ? 1 : 0);
          break;
      }
    }

    // updated_atは常に更新
    setClauses.push('updated_at = ?');
    params.push(new Date().toISOString());

    // WHERE条件のid
    params.push(user.id.value);

    const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;

    return { sql, params };
  }

  /**
   * 検索条件用のSQLとパラメータを生成
   * @param criteria 検索条件
   * @returns {where: string, params: any[]}
   */
  public static buildSearchQuery(criteria: {
    email?: string;
    firstName?: string;
    lastName?: string;
    isAdmin?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
  }): { where: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (criteria.email) {
      conditions.push('email = ?');
      params.push(criteria.email);
    }

    if (criteria.firstName) {
      conditions.push('first_name LIKE ?');
      params.push(`%${criteria.firstName}%`);
    }

    if (criteria.lastName) {
      conditions.push('last_name LIKE ?');
      params.push(`%${criteria.lastName}%`);
    }

    if (criteria.isAdmin !== undefined) {
      conditions.push('is_admin = ?');
      params.push(criteria.isAdmin ? 1 : 0);
    }

    if (criteria.createdAfter) {
      conditions.push('created_at >= ?');
      params.push(criteria.createdAfter.toISOString());
    }

    if (criteria.createdBefore) {
      conditions.push('created_at <= ?');
      params.push(criteria.createdBefore.toISOString());
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return { where, params };
  }
}