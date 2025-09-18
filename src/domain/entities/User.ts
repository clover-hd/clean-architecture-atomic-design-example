import { UserId, Email } from '../value-objects';

/**
 * User Entity
 * ユーザーのドメインモデル
 */
export class User {
  private readonly _id: UserId;
  private readonly _email: Email;
  private readonly _firstName: string;
  private readonly _lastName: string;
  private readonly _phone: string | undefined;
  private readonly _isAdmin: boolean;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  constructor(
    id: UserId,
    email: Email,
    firstName: string,
    lastName: string,
    isAdmin: boolean = false,
    phone?: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    // バリデーション
    if (!firstName || firstName.trim().length === 0) {
      throw new Error('First name is required');
    }
    if (!lastName || lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }
    if (firstName.length > 50) {
      throw new Error('First name must be 50 characters or less');
    }
    if (lastName.length > 50) {
      throw new Error('Last name must be 50 characters or less');
    }
    if (phone && phone.length > 20) {
      throw new Error('Phone number must be 20 characters or less');
    }

    this._id = id;
    this._email = email;
    this._firstName = firstName.trim();
    this._lastName = lastName.trim();
    this._phone = phone ? phone.trim() : undefined;
    this._isAdmin = isAdmin;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  /**
   * ユーザーを作成する
   */
  public static create(
    id: UserId,
    email: Email,
    firstName: string,
    lastName: string,
    phone?: string,
    isAdmin: boolean = false
  ): User {
    return new User(id, email, firstName, lastName, isAdmin, phone);
  }

  /**
   * 既存データからユーザーを復元する
   */
  public static restore(
    id: UserId,
    email: Email,
    firstName: string,
    lastName: string,
    isAdmin: boolean,
    createdAt: Date,
    updatedAt: Date,
    phone?: string
  ): User {
    return new User(id, email, firstName, lastName, isAdmin, phone, createdAt, updatedAt);
  }

  // Getters（不変性を保証）
  public get id(): UserId {
    return this._id;
  }

  public get email(): Email {
    return this._email;
  }

  public get firstName(): string {
    return this._firstName;
  }

  public get lastName(): string {
    return this._lastName;
  }

  public get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  public get phone(): string | undefined {
    return this._phone;
  }

  public get isAdmin(): boolean {
    return this._isAdmin;
  }

  public get createdAt(): Date {
    return new Date(this._createdAt);
  }

  public get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  /**
   * ユーザー情報を更新する（新しいインスタンスを返す）
   */
  public updateProfile(firstName?: string, lastName?: string, phone?: string): User {
    return new User(
      this._id,
      this._email,
      firstName || this._firstName,
      lastName || this._lastName,
      this._isAdmin,
      phone !== undefined ? phone : this._phone,
      this._createdAt,
      new Date() // updatedAtを現在時刻に更新
    );
  }

  /**
   * 管理者権限を付与する（新しいインスタンスを返す）
   */
  public promoteToAdmin(): User {
    if (this._isAdmin) {
      return this;
    }
    return new User(
      this._id,
      this._email,
      this._firstName,
      this._lastName,
      true, // 管理者に昇格
      this._phone,
      this._createdAt,
      new Date()
    );
  }

  /**
   * 管理者権限を剥奪する（新しいインスタンスを返す）
   */
  public demoteFromAdmin(): User {
    if (!this._isAdmin) {
      return this;
    }
    return new User(
      this._id,
      this._email,
      this._firstName,
      this._lastName,
      false, // 一般ユーザーに降格
      this._phone,
      this._createdAt,
      new Date()
    );
  }

  /**
   * 等価性チェック
   */
  public equals(other: User): boolean {
    return this._id.equals(other._id);
  }

  /**
   * JSON表現
   */
  public toJSON(): object {
    return {
      id: this._id.toJSON(),
      email: this._email.toJSON(),
      firstName: this._firstName,
      lastName: this._lastName,
      fullName: this.fullName,
      phone: this._phone,
      isAdmin: this._isAdmin,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }
}