import { User } from '../entities/User';
import { UserId, Email } from '../value-objects';

/**
 * User Repository Interface
 * ユーザーデータアクセスの抽象化
 * 依存関係逆転原則により、Domain層で定義
 */
export interface IUserRepository {
  /**
   * ユーザーIDでユーザーを取得
   * @param id ユーザーID
   * @returns ユーザーエンティティまたはnull
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * メールアドレスでユーザーを取得
   * @param email メールアドレス
   * @returns ユーザーエンティティまたはnull
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * 全ユーザーを取得（管理者用）
   * @param limit 取得件数制限
   * @param offset 取得開始位置
   * @returns ユーザーエンティティの配列
   */
  findAll(limit?: number, offset?: number): Promise<User[]>;

  /**
   * 管理者ユーザーを取得
   * @returns 管理者ユーザーエンティティの配列
   */
  findAdmins(): Promise<User[]>;

  /**
   * ユーザーを保存（作成・更新）
   * @param user ユーザーエンティティ
   * @returns 保存されたユーザーエンティティ
   */
  save(user: User): Promise<User>;

  /**
   * 新規ユーザーを作成
   * @param user ユーザーエンティティ
   * @returns 作成されたユーザーエンティティ
   */
  create(user: User): Promise<User>;

  /**
   * ユーザー情報を更新
   * @param user ユーザーエンティティ
   * @returns 更新されたユーザーエンティティ
   */
  update(user: User): Promise<User>;

  /**
   * ユーザーを削除
   * @param id ユーザーID
   */
  delete(id: UserId): Promise<void>;

  /**
   * メールアドレスの重複チェック
   * @param email メールアドレス
   * @param excludeUserId 除外するユーザーID（更新時）
   * @returns 重複している場合true
   */
  existsByEmail(email: Email, excludeUserId?: UserId): Promise<boolean>;

  /**
   * ユーザーの存在チェック
   * @param id ユーザーID
   * @returns 存在する場合true
   */
  existsById(id: UserId): Promise<boolean>;

  /**
   * ユーザー総数を取得
   * @returns ユーザー総数
   */
  count(): Promise<number>;

  /**
   * 管理者ユーザー数を取得
   * @returns 管理者ユーザー数
   */
  countAdmins(): Promise<number>;

  /**
   * 指定日時以降に作成されたユーザーを取得
   * @param date 作成日時
   * @returns ユーザーエンティティの配列
   */
  findCreatedAfter(date: Date): Promise<User[]>;

  /**
   * 指定日時以降に更新されたユーザーを取得
   * @param date 更新日時
   * @returns ユーザーエンティティの配列
   */
  findUpdatedAfter(date: Date): Promise<User[]>;
}