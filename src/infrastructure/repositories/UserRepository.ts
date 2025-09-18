import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { UserId, Email } from '../../domain/value-objects';
import { database, UserRow } from '../database';
import { UserMapper } from '../mappers/UserMapper';
import {
  DatabaseErrorHandler,
  DatabaseErrorFactory,
  RecordNotFoundError
} from '../errors';

/**
 * User Repository Implementation
 * IUserRepositoryの具象実装クラス
 * SQLiteデータベースを使用してユーザーデータの永続化を行う
 */
export class UserRepository implements IUserRepository {

  /**
   * ユーザーIDでユーザーを取得
   */
  public async findById(id: UserId): Promise<User | null> {
    return DatabaseErrorHandler.handleFindOne(
      async () => {
        const row = await database.queryOne<UserRow>(
          'SELECT * FROM users WHERE id = ?',
          [id.value]
        );

        return row ? UserMapper.toDomain(row) : null;
      },
      {
        entityName: 'User',
        identifier: id.value
      }
    );
  }

  /**
   * メールアドレスでユーザーを取得
   */
  public async findByEmail(email: Email): Promise<User | null> {
    return DatabaseErrorHandler.handleFindOne(
      async () => {
        const row = await database.queryOne<UserRow>(
          'SELECT * FROM users WHERE email = ?',
          [email.value]
        );

        return row ? UserMapper.toDomain(row) : null;
      },
      {
        entityName: 'User',
        identifier: email.value
      }
    );
  }

  /**
   * 全ユーザーを取得（管理者用）
   */
  public async findAll(limit?: number, offset?: number): Promise<User[]> {
    return DatabaseErrorHandler.handleFindMany(
      async () => {
        let sql = 'SELECT * FROM users ORDER BY created_at DESC';
        const params: any[] = [];

        if (limit !== undefined && limit > 0) {
          sql += ' LIMIT ?';
          params.push(limit);

          if (offset !== undefined && offset > 0) {
            sql += ' OFFSET ?';
            params.push(offset);
          }
        }

        const rows = await database.query<UserRow>(sql, params);
        return UserMapper.toDomainArray(rows);
      },
      {
        entityName: 'User',
        operation: 'findAll'
      }
    );
  }

  /**
   * 管理者ユーザーを取得
   */
  public async findAdmins(): Promise<User[]> {
    return DatabaseErrorHandler.handleFindMany(
      async () => {
        const rows = await database.query<UserRow>(
          'SELECT * FROM users WHERE is_admin = 1 ORDER BY created_at DESC'
        );
        return UserMapper.toDomainArray(rows);
      },
      {
        entityName: 'User',
        operation: 'findAdmins'
      }
    );
  }

  /**
   * ユーザーを保存（作成・更新）
   */
  public async save(user: User): Promise<User> {
    return DatabaseErrorHandler.handle(
      async () => {
        const existingUser = await this.findById(user.id);

        if (existingUser) {
          return this.update(user);
        } else {
          return this.create(user);
        }
      },
      {
        entityName: 'User',
        operation: 'save',
        identifier: user.id.value
      }
    );
  }

  /**
   * 新規ユーザーを作成
   */
  public async create(user: User): Promise<User> {
    return DatabaseErrorHandler.handle(
      async () => {
        const sql = `
          INSERT INTO users (email, first_name, last_name, phone, is_admin, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const params = UserMapper.toInsertParams(user);
        const result = await database.execute(sql, params);

        // 作成されたユーザーを取得して返す
        const newUserId = UserId.create(result.lastID);
        const createdUser = await this.findById(newUserId);

        if (!createdUser) {
          throw DatabaseErrorFactory.createNotFoundError('User', result.lastID);
        }

        return createdUser;
      },
      {
        entityName: 'User',
        operation: 'create',
        identifier: user.email.value
      }
    );
  }

  /**
   * ユーザー情報を更新
   */
  public async update(user: User): Promise<User> {
    return DatabaseErrorHandler.handle(
      async () => {
        const sql = `
          UPDATE users
          SET email = ?, first_name = ?, last_name = ?, phone = ?, is_admin = ?, updated_at = ?
          WHERE id = ?
        `;

        const params = UserMapper.toUpdateParams(user);
        const result = await database.execute(sql, params);

        if (result.changes === 0) {
          throw DatabaseErrorFactory.createNotFoundError('User', user.id.value);
        }

        // 更新されたユーザーを取得して返す
        const updatedUser = await this.findById(user.id);

        if (!updatedUser) {
          throw DatabaseErrorFactory.createNotFoundError('User', user.id.value);
        }

        return updatedUser;
      },
      {
        entityName: 'User',
        operation: 'update',
        identifier: user.id.value
      }
    );
  }

  /**
   * ユーザーを削除
   */
  public async delete(id: UserId): Promise<void> {
    return DatabaseErrorHandler.handle(
      async () => {
        const result = await database.execute(
          'DELETE FROM users WHERE id = ?',
          [id.value]
        );

        if (result.changes === 0) {
          throw DatabaseErrorFactory.createNotFoundError('User', id.value);
        }
      },
      {
        entityName: 'User',
        operation: 'delete',
        identifier: id.value
      }
    );
  }

  /**
   * メールアドレスの重複チェック
   */
  public async existsByEmail(email: Email, excludeUserId?: UserId): Promise<boolean> {
    return DatabaseErrorHandler.handle(
      async () => {
        let sql = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
        const params: any[] = [email.value];

        if (excludeUserId) {
          sql += ' AND id != ?';
          params.push(excludeUserId.value);
        }

        const result = await database.queryOne<{ count: number }>(sql, params);
        return (result?.count || 0) > 0;
      },
      {
        entityName: 'User',
        operation: 'existsByEmail',
        identifier: email.value
      }
    );
  }

  /**
   * ユーザーの存在チェック
   */
  public async existsById(id: UserId): Promise<boolean> {
    return DatabaseErrorHandler.handle(
      async () => {
        const result = await database.queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM users WHERE id = ?',
          [id.value]
        );
        return (result?.count || 0) > 0;
      },
      {
        entityName: 'User',
        operation: 'existsById',
        identifier: id.value
      }
    );
  }

  /**
   * ユーザー総数を取得
   */
  public async count(): Promise<number> {
    return DatabaseErrorHandler.handle(
      async () => {
        const result = await database.queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM users'
        );
        return result?.count || 0;
      },
      {
        entityName: 'User',
        operation: 'count'
      }
    );
  }

  /**
   * 管理者ユーザー数を取得
   */
  public async countAdmins(): Promise<number> {
    return DatabaseErrorHandler.handle(
      async () => {
        const result = await database.queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM users WHERE is_admin = 1'
        );
        return result?.count || 0;
      },
      {
        entityName: 'User',
        operation: 'countAdmins'
      }
    );
  }

  /**
   * 指定日時以降に作成されたユーザーを取得
   */
  public async findCreatedAfter(date: Date): Promise<User[]> {
    return DatabaseErrorHandler.handleFindMany(
      async () => {
        const rows = await database.query<UserRow>(
          'SELECT * FROM users WHERE created_at >= ? ORDER BY created_at DESC',
          [date.toISOString()]
        );
        return UserMapper.toDomainArray(rows);
      },
      {
        entityName: 'User',
        operation: 'findCreatedAfter'
      }
    );
  }

  /**
   * 指定日時以降に更新されたユーザーを取得
   */
  public async findUpdatedAfter(date: Date): Promise<User[]> {
    return DatabaseErrorHandler.handleFindMany(
      async () => {
        const rows = await database.query<UserRow>(
          'SELECT * FROM users WHERE updated_at >= ? ORDER BY updated_at DESC',
          [date.toISOString()]
        );
        return UserMapper.toDomainArray(rows);
      },
      {
        entityName: 'User',
        operation: 'findUpdatedAfter'
      }
    );
  }

  /**
   * 検索条件でユーザーを取得（拡張機能）
   */
  public async findByCriteria(criteria: {
    firstName?: string;
    lastName?: string;
    isAdmin?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    return DatabaseErrorHandler.handleFindMany(
      async () => {
        const { where, params } = UserMapper.buildSearchQuery(criteria);

        let sql = `SELECT * FROM users ${where} ORDER BY created_at DESC`;

        if (criteria.limit !== undefined && criteria.limit > 0) {
          sql += ' LIMIT ?';
          params.push(criteria.limit);

          if (criteria.offset !== undefined && criteria.offset > 0) {
            sql += ' OFFSET ?';
            params.push(criteria.offset);
          }
        }

        const rows = await database.query<UserRow>(sql, params);
        return UserMapper.toDomainArray(rows);
      },
      {
        entityName: 'User',
        operation: 'findByCriteria'
      }
    );
  }

  /**
   * 複数ユーザーの一括作成（トランザクション使用）
   */
  public async createMany(users: User[]): Promise<User[]> {
    return DatabaseErrorHandler.handleTransaction(
      async () => {
        return database.withTransaction(async () => {
          const createdUsers: User[] = [];

          for (const user of users) {
            const created = await this.create(user);
            createdUsers.push(created);
          }

          return createdUsers;
        });
      },
      {
        operation: 'createMany'
      }
    );
  }

  /**
   * ユーザーの部分更新（指定フィールドのみ）
   */
  public async updatePartial(
    user: User,
    fields: Array<'email' | 'first_name' | 'last_name' | 'phone' | 'is_admin'>
  ): Promise<User> {
    return DatabaseErrorHandler.handle(
      async () => {
        const { sql, params } = UserMapper.toPartialUpdateQuery(user, fields);
        const result = await database.execute(sql, params);

        if (result.changes === 0) {
          throw DatabaseErrorFactory.createNotFoundError('User', user.id.value);
        }

        // 更新されたユーザーを取得して返す
        const updatedUser = await this.findById(user.id);

        if (!updatedUser) {
          throw DatabaseErrorFactory.createNotFoundError('User', user.id.value);
        }

        return updatedUser;
      },
      {
        entityName: 'User',
        operation: 'updatePartial',
        identifier: user.id.value
      }
    );
  }
}