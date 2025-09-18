import { User } from '../entities/User';
import { Email } from '../value-objects';
import { IUserRepository } from '../repositories';

/**
 * User Domain Service
 * ユーザーに関する複雑なビジネスロジックを管理
 */
export class UserDomainService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * メールアドレスの重複チェック
   * @param email チェックするメールアドレス
   * @param excludeUserId 除外するユーザーID（更新時）
   * @throws {Error} 重複している場合
   */
  async validateEmailUniqueness(email: Email, excludeUserId?: import('../value-objects').UserId): Promise<void> {
    const isDuplicate = await this.userRepository.existsByEmail(email, excludeUserId);
    if (isDuplicate) {
      throw new Error(`Email address ${email.value} is already in use`);
    }
  }

  /**
   * ユーザー登録時のビジネスルール検証
   * @param email メールアドレス
   * @param firstName 名前
   * @param lastName 苗字
   * @throws {Error} バリデーション失敗時
   */
  async validateUserRegistration(email: Email, firstName: string, lastName: string): Promise<void> {
    // メールアドレス重複チェック
    await this.validateEmailUniqueness(email);

    // 名前のビジネスルール検証
    this.validateUserName(firstName, lastName);
  }

  /**
   * ユーザー名のビジネスルール検証
   * @param firstName 名前
   * @param lastName 苗字
   * @throws {Error} バリデーション失敗時
   */
  private validateUserName(firstName: string, lastName: string): void {
    // 禁止文字チェック
    const prohibitedChars = /[<>\"'&]/;
    if (prohibitedChars.test(firstName) || prohibitedChars.test(lastName)) {
      throw new Error('Name contains prohibited characters');
    }

    // 数字のみの名前を禁止
    const onlyNumbers = /^\d+$/;
    if (onlyNumbers.test(firstName) || onlyNumbers.test(lastName)) {
      throw new Error('Name cannot contain only numbers');
    }

    // 特定の予約語チェック
    const reservedWords = ['admin', 'administrator', 'root', 'system', 'null', 'undefined'];
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    for (const reserved of reservedWords) {
      if (fullName.includes(reserved)) {
        throw new Error(`Name cannot contain reserved word: ${reserved}`);
      }
    }
  }

  /**
   * 管理者昇格の権限チェック
   * @param promotingUser 昇格を実行するユーザー
   * @param targetUser 昇格対象のユーザー
   * @throws {Error} 権限不足の場合
   */
  async validateAdminPromotion(promotingUser: User, targetUser: User): Promise<void> {
    // 昇格を実行するユーザーが管理者かチェック
    if (!promotingUser.isAdmin) {
      throw new Error('Only administrators can promote users to admin');
    }

    // 自分自身への操作を禁止
    if (promotingUser.equals(targetUser)) {
      throw new Error('Cannot promote yourself');
    }

    // 既に管理者の場合はエラー
    if (targetUser.isAdmin) {
      throw new Error('User is already an administrator');
    }

    // 管理者数の上限チェック（例：最大10人）
    const adminCount = await this.userRepository.countAdmins();
    if (adminCount >= 10) {
      throw new Error('Maximum number of administrators reached (10)');
    }
  }

  /**
   * 管理者降格の権限チェック
   * @param demotingUser 降格を実行するユーザー
   * @param targetUser 降格対象のユーザー
   * @throws {Error} 権限不足の場合
   */
  async validateAdminDemotion(demotingUser: User, targetUser: User): Promise<void> {
    // 降格を実行するユーザーが管理者かチェック
    if (!demotingUser.isAdmin) {
      throw new Error('Only administrators can demote admin users');
    }

    // 自分自身への操作を禁止
    if (demotingUser.equals(targetUser)) {
      throw new Error('Cannot demote yourself');
    }

    // 対象ユーザーが管理者でない場合はエラー
    if (!targetUser.isAdmin) {
      throw new Error('User is not an administrator');
    }

    // 最後の管理者かチェック
    const adminCount = await this.userRepository.countAdmins();
    if (adminCount <= 1) {
      throw new Error('Cannot demote the last administrator');
    }
  }

  /**
   * ユーザー削除の権限と影響チェック
   * @param deletingUser 削除を実行するユーザー
   * @param targetUser 削除対象のユーザー
   * @throws {Error} 削除できない場合
   */
  async validateUserDeletion(deletingUser: User, targetUser: User): Promise<void> {
    // 削除を実行するユーザーが管理者かチェック
    if (!deletingUser.isAdmin) {
      throw new Error('Only administrators can delete users');
    }

    // 自分自身への操作を禁止
    if (deletingUser.equals(targetUser)) {
      throw new Error('Cannot delete yourself');
    }

    // 最後の管理者の削除を禁止
    if (targetUser.isAdmin) {
      const adminCount = await this.userRepository.countAdmins();
      if (adminCount <= 1) {
        throw new Error('Cannot delete the last administrator');
      }
    }
  }

  /**
   * ユーザーがアクティブかどうかの判定
   * @param user ユーザー
   * @returns アクティブな場合true
   */
  isUserActive(user: User): boolean {
    // 作成から30日以上経過している場合
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return user.createdAt > thirtyDaysAgo;
  }

  /**
   * 新規ユーザーかどうかの判定
   * @param user ユーザー
   * @returns 新規ユーザーの場合true
   */
  isNewUser(user: User): boolean {
    // 作成から7日以内の場合
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return user.createdAt > sevenDaysAgo;
  }

  /**
   * ユーザー統計情報の生成
   * @returns ユーザー統計情報
   */
  async generateUserStatistics(): Promise<UserStatistics> {
    const totalUsers = await this.userRepository.count();
    const adminUsers = await this.userRepository.countAdmins();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = await this.userRepository.findCreatedAfter(sevenDaysAgo);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await this.userRepository.findCreatedAfter(thirtyDaysAgo);

    return {
      totalUsers,
      adminUsers,
      regularUsers: totalUsers - adminUsers,
      newUsersCount: newUsers.length,
      activeUsersCount: activeUsers.length,
      adminPercentage: totalUsers > 0 ? (adminUsers / totalUsers) * 100 : 0
    };
  }
}

/**
 * ユーザー統計情報
 */
export interface UserStatistics {
  /** 総ユーザー数 */
  totalUsers: number;
  /** 管理者ユーザー数 */
  adminUsers: number;
  /** 一般ユーザー数 */
  regularUsers: number;
  /** 新規ユーザー数（7日以内） */
  newUsersCount: number;
  /** アクティブユーザー数（30日以内） */
  activeUsersCount: number;
  /** 管理者割合（%） */
  adminPercentage: number;
}