/**
 * UserRepository 統合テスト
 * 実際のデータベースを使用したリポジトリの包括的テスト
 */

import { UserRepository } from '../../../../src/infrastructure/repositories/UserRepository';
import { User } from '../../../../src/domain/entities/User';
import { UserId, Email } from '../../../../src/domain/value-objects';
import { TestDatabase, TestDataFactory, TestUtils } from '../../../helpers';

describe('UserRepository 統合テスト', () => {
  let userRepository: UserRepository;
  let testDb: TestDatabase;

  // テストデータベースの共通セットアップ
  TestUtils.setupTestDatabase();

  beforeEach(async () => {
    testDb = TestDatabase.getInstance();
    userRepository = new UserRepository();

    // リポジトリにテストデータベースを注入
    (userRepository as any).database = testDb.getDatabase();
  });

  describe('ユーザー作成', () => {
    test('正常なユーザー作成', async () => {
      // Arrange
      const user = TestDataFactory.createUser({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '123-456-7890'
      });

      // Act
      const savedUser = await userRepository.create(user);

      // Assert
      expect(savedUser).toBeDefined();
      expect(savedUser.email.value).toBe('test@example.com');
      expect(savedUser.firstName).toBe('Test');
      expect(savedUser.lastName).toBe('User');
      expect(savedUser.phone).toBe('123-456-7890');
      expect(savedUser.isAdmin).toBe(false);

      // データベースから直接確認
      const dbUser = await testDb.queryOne<any>(
        'SELECT * FROM users WHERE email = ?',
        ['test@example.com']
      );
      expect(dbUser).toBeDefined();
      expect(dbUser.email).toBe('test@example.com');
    });

    test('必須フィールドのみでユーザー作成', async () => {
      // Arrange
      const user = TestDataFactory.createUser({
        email: 'minimal@example.com',
        firstName: 'Min',
        lastName: 'User'
        // phone は省略
      });

      // Act
      const savedUser = await userRepository.create(user);

      // Assert
      expect(savedUser).toBeDefined();
      expect(savedUser.phone).toBeUndefined();
    });

    test('管理者ユーザーの作成', async () => {
      // Arrange
      const adminUser = TestDataFactory.createAdminUser({
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User'
      });

      // Act
      const savedUser = await userRepository.create(adminUser);

      // Assert
      expect(savedUser.isAdmin).toBe(true);

      // データベースから確認
      const dbUser = await testDb.queryOne<any>(
        'SELECT * FROM users WHERE email = ?',
        ['admin@example.com']
      );
      expect(dbUser.is_admin).toBe(1);
    });

    test('重複メールアドレスでエラー', async () => {
      // Arrange
      const user1 = TestDataFactory.createUser({ email: 'duplicate@example.com' });
      const user2 = TestDataFactory.createUser({ email: 'duplicate@example.com' });

      await userRepository.create(user1);

      // Act & Assert
      await TestUtils.expectToThrow(
        async () => await userRepository.create(user2),
        /UNIQUE constraint failed/
      );
    });
  });

  describe('ユーザー検索', () => {
    beforeEach(async () => {
      // テストデータの準備
      const users = [
        TestDataFactory.createUser({
          id: 1,
          email: 'user1@example.com',
          firstName: 'User',
          lastName: 'One'
        }),
        TestDataFactory.createUser({
          id: 2,
          email: 'user2@example.com',
          firstName: 'User',
          lastName: 'Two'
        }),
        TestDataFactory.createAdminUser({
          id: 3,
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User'
        })
      ];

      for (const user of users) {
        await userRepository.create(user);
      }
    });

    test('IDによるユーザー検索', async () => {
      // Arrange
      const userId = UserId.create(1);

      // Act
      const user = await userRepository.findById(userId);

      // Assert
      expect(user).toBeDefined();
      expect(user?.id.value).toBe(1);
      expect(user?.email.value).toBe('user1@example.com');
    });

    test('存在しないIDでnullが返される', async () => {
      // Arrange
      const nonExistentId = UserId.create(999);

      // Act
      const user = await userRepository.findById(nonExistentId);

      // Assert
      expect(user).toBeNull();
    });

    test('メールアドレスによるユーザー検索', async () => {
      // Arrange
      const email = Email.create('user2@example.com');

      // Act
      const user = await userRepository.findByEmail(email);

      // Assert
      expect(user).toBeDefined();
      expect(user?.email.value).toBe('user2@example.com');
      expect(user?.firstName).toBe('User');
      expect(user?.lastName).toBe('Two');
    });

    test('存在しないメールアドレスでnullが返される', async () => {
      // Arrange
      const email = Email.create('nonexistent@example.com');

      // Act
      const user = await userRepository.findByEmail(email);

      // Assert
      expect(user).toBeNull();
    });

    test('全ユーザー取得', async () => {
      // Act
      const users = await userRepository.findAll();

      // Assert
      expect(users).toHaveLength(3);
      expect(users.map(u => u.email.value)).toContain('user1@example.com');
      expect(users.map(u => u.email.value)).toContain('user2@example.com');
      expect(users.map(u => u.email.value)).toContain('admin@example.com');
    });

    test('ページネーション付きユーザー取得', async () => {
      // Act
      const firstPage = await userRepository.findAll(2, 0); // limit=2, offset=0
      const secondPage = await userRepository.findAll(2, 2); // limit=2, offset=2

      // Assert
      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(1);

      // 重複がないことを確認
      const firstPageEmails = firstPage.map(u => u.email.value);
      const secondPageEmails = secondPage.map(u => u.email.value);
      expect(firstPageEmails.some(email => secondPageEmails.includes(email))).toBe(false);
    });

    test('管理者ユーザーのみ取得', async () => {
      // Act
      const admins = await userRepository.findAdmins();

      // Assert
      expect(admins).toHaveLength(1);
      expect(admins[0].email.value).toBe('admin@example.com');
      expect(admins[0].isAdmin).toBe(true);
    });
  });

  describe('ユーザー更新', () => {
    let existingUser: User;

    beforeEach(async () => {
      existingUser = await userRepository.create(
        TestDataFactory.createUser({
          email: 'update@example.com',
          firstName: 'Original',
          lastName: 'User'
        })
      );
    });

    test('ユーザー情報の更新', async () => {
      // Arrange
      const updatedUser = existingUser.updateProfile(
        'Updated',
        'Name',
        '999-888-7777'
      );

      // Act
      const result = await userRepository.update(updatedUser);

      // Assert
      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
      expect(result.phone).toBe('999-888-7777');

      // データベースから確認
      const dbUser = await testDb.queryOne<any>(
        'SELECT * FROM users WHERE id = ?',
        [existingUser.id.value]
      );
      expect(dbUser.first_name).toBe('Updated');
      expect(dbUser.last_name).toBe('Name');
      expect(dbUser.phone).toBe('999-888-7777');
    });

    test('管理者権限の更新', async () => {
      // Arrange
      const promotedUser = existingUser.promoteToAdmin();

      // Act
      const result = await userRepository.update(promotedUser);

      // Assert
      expect(result.isAdmin).toBe(true);

      // データベースから確認
      const dbUser = await testDb.queryOne<any>(
        'SELECT * FROM users WHERE id = ?',
        [existingUser.id.value]
      );
      expect(dbUser.is_admin).toBe(1);
    });

    test('存在しないユーザーの更新でエラー', async () => {
      // Arrange
      const nonExistentUser = TestDataFactory.createUser({
        id: 999,
        email: 'nonexistent@example.com'
      });

      // Act & Assert
      await TestUtils.expectToThrow(
        async () => await userRepository.update(nonExistentUser),
        'User not found'
      );
    });

    test('部分更新', async () => {
      // Arrange
      const updatedUser = existingUser.updateProfile(
        'PartialUpdate',
        existingUser.lastName,
        '555-123-4567'
      );

      // Act
      const result = await userRepository.updatePartial(
        updatedUser,
        ['first_name', 'phone']
      );

      // Assert
      expect(result.firstName).toBe('PartialUpdate');
      expect(result.phone).toBe('555-123-4567');
      expect(result.lastName).toBe(existingUser.lastName); // 変更されていない
    });
  });

  describe('ユーザー削除', () => {
    let existingUser: User;

    beforeEach(async () => {
      existingUser = await userRepository.create(
        TestDataFactory.createUser({
          email: 'delete@example.com',
          firstName: 'Delete',
          lastName: 'Me'
        })
      );
    });

    test('ユーザーの削除', async () => {
      // Act
      await userRepository.delete(existingUser.id);

      // Assert
      const deletedUser = await userRepository.findById(existingUser.id);
      expect(deletedUser).toBeNull();

      // データベースから確認
      const dbUser = await testDb.queryOne<any>(
        'SELECT * FROM users WHERE id = ?',
        [existingUser.id.value]
      );
      expect(dbUser).toBeNull();
    });

    test('存在しないユーザーの削除でエラー', async () => {
      // Arrange
      const nonExistentId = UserId.create(999);

      // Act & Assert
      await TestUtils.expectToThrow(
        async () => await userRepository.delete(nonExistentId),
        'User not found'
      );
    });
  });

  describe('存在チェックと統計', () => {
    beforeEach(async () => {
      // テストデータの準備
      const users = [
        TestDataFactory.createUser({ email: 'user1@example.com' }),
        TestDataFactory.createUser({ email: 'user2@example.com' }),
        TestDataFactory.createAdminUser({ email: 'admin1@example.com' }),
        TestDataFactory.createAdminUser({ email: 'admin2@example.com' })
      ];

      for (const user of users) {
        await userRepository.create(user);
      }
    });

    test('メールアドレスの存在チェック', async () => {
      // Arrange
      const existingEmail = Email.create('user1@example.com');
      const nonExistentEmail = Email.create('nonexistent@example.com');

      // Act & Assert
      expect(await userRepository.existsByEmail(existingEmail)).toBe(true);
      expect(await userRepository.existsByEmail(nonExistentEmail)).toBe(false);
    });

    test('除外IDを指定したメールアドレス存在チェック', async () => {
      // Arrange
      const email = Email.create('user1@example.com');
      const user = await userRepository.findByEmail(email);
      const excludeId = user!.id;

      // Act
      const exists = await userRepository.existsByEmail(email, excludeId);

      // Assert
      expect(exists).toBe(false); // 自分自身を除外するとfalse
    });

    test('ユーザーIDの存在チェック', async () => {
      // Arrange
      const users = await userRepository.findAll();
      const existingId = users[0].id;
      const nonExistentId = UserId.create(999);

      // Act & Assert
      expect(await userRepository.existsById(existingId)).toBe(true);
      expect(await userRepository.existsById(nonExistentId)).toBe(false);
    });

    test('ユーザー総数の取得', async () => {
      // Act
      const count = await userRepository.count();

      // Assert
      expect(count).toBe(4);
    });

    test('管理者数の取得', async () => {
      // Act
      const adminCount = await userRepository.countAdmins();

      // Assert
      expect(adminCount).toBe(2);
    });
  });

  describe('複雑なクエリ', () => {
    beforeEach(async () => {
      // 時系列のテストデータ
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // 過去のユーザー（手動でタイムスタンプを設定）
      await testDb.execute(
        'INSERT INTO users (email, first_name, last_name, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        ['old@example.com', 'Old', 'User', 0, yesterday.toISOString(), yesterday.toISOString()]
      );

      // 現在のユーザー
      await userRepository.create(
        TestDataFactory.createUser({ email: 'current@example.com' })
      );
    });

    test('指定日時以降に作成されたユーザーの取得', async () => {
      // Arrange
      const cutoffDate = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12時間前

      // Act
      const recentUsers = await userRepository.findCreatedAfter(cutoffDate);

      // Assert
      expect(recentUsers).toHaveLength(1);
      expect(recentUsers[0].email.value).toBe('current@example.com');
    });

    test('条件指定検索', async () => {
      // Arrange
      await userRepository.create(
        TestDataFactory.createUser({
          email: 'search@example.com',
          firstName: 'Search',
          lastName: 'Target'
        })
      );

      // Act
      const results = await userRepository.findByCriteria({
        firstName: 'Search',
        limit: 10
      });

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].firstName).toBe('Search');
    });
  });

  describe('トランザクション処理', () => {
    test('複数ユーザーの一括作成', async () => {
      // Arrange
      const users = TestDataFactory.createUsers(3);

      // Act
      const createdUsers = await userRepository.createMany(users);

      // Assert
      expect(createdUsers).toHaveLength(3);

      // 全員がデータベースに存在することを確認
      for (const user of createdUsers) {
        const dbUser = await userRepository.findById(user.id);
        expect(dbUser).toBeDefined();
      }
    });

    test('一括作成時のエラーでロールバック', async () => {
      // Arrange
      const users = TestDataFactory.createUsers(2);
      // 2番目のユーザーを重複メールアドレスに設定
      users[1] = TestDataFactory.createUser({
        email: users[0].email.value // 重複
      });

      // Act & Assert
      await TestUtils.expectToThrow(
        async () => await userRepository.createMany(users),
        /UNIQUE constraint failed/
      );

      // 1番目のユーザーもロールバックされていることを確認
      const user1 = await userRepository.findByEmail(users[0].email);
      expect(user1).toBeNull();
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量データでの検索性能', async () => {
      // Arrange - 100ユーザーを作成
      const users = TestDataFactory.createUsers(100);
      await userRepository.createMany(users);

      // Act & Assert
      const { duration } = await TestUtils.measureExecutionTime(async () => {
        const allUsers = await userRepository.findAll();
        expect(allUsers).toHaveLength(100);

        const searchResults = await userRepository.findByCriteria({
          limit: 10
        });
        expect(searchResults).toHaveLength(10);
      });

      // 100ユーザーの検索が500ms以内に完了することを確認
      expect(duration).toBeLessThan(500);
    });

    test('並行アクセス時の整合性', async () => {
      // Arrange
      const userEmails = Array.from({ length: 10 }, (_, i) => `concurrent${i}@example.com`);

      // Act
      const promises = userEmails.map(email =>
        userRepository.create(TestDataFactory.createUser({ email }))
      );

      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(10);

      // すべて異なるIDが割り当てられていることを確認
      const ids = results.map(u => u.id.value);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('エラーハンドリング', () => {
    test('データベース接続エラーの適切な処理', async () => {
      // Arrange - データベース接続を閉じる
      await testDb.getDatabase().close();

      // Act & Assert
      await TestUtils.expectToThrow(
        async () => await userRepository.findAll(),
        'Database connection error'
      );

      // データベースを再初期化
      await testDb.initialize();
      (userRepository as any).database = testDb.getDatabase();
    });

    test('SQL構文エラーの適切な処理', async () => {
      // Arrange - 不正なクエリを実行させるために条件を操作
      const invalidCriteria = {
        // 存在しないフィールドで検索（実装に依存）
        invalidField: 'value'
      } as any;

      // Act & Assert
      await TestUtils.expectToThrow(
        async () => await userRepository.findByCriteria(invalidCriteria),
        'SQL error'
      );
    });
  });
});