export interface RefreshTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  isRevoked?: boolean;
  revokedAt?: Date | null;
  replacedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RefreshToken {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _tokenHash: string;
  private readonly _familyId: string;
  private readonly _expiresAt: Date;
  private _isRevoked: boolean;
  private _revokedAt: Date | null;
  private _replacedBy: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: RefreshTokenProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._tokenHash = props.tokenHash;
    this._familyId = props.familyId;
    this._expiresAt = props.expiresAt;
    this._isRevoked = props.isRevoked ?? false;
    this._revokedAt = props.revokedAt ?? null;
    this._replacedBy = props.replacedBy ?? null;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get tokenHash(): string {
    return this._tokenHash;
  }

  get familyId(): string {
    return this._familyId;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get isRevoked(): boolean {
    return this._isRevoked;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  get replacedBy(): string | null {
    return this._replacedBy;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  isExpired(now: Date = new Date()): boolean {
    return this._expiresAt.getTime() <= now.getTime();
  }

  isValid(now: Date = new Date()): boolean {
    return !this._isRevoked && !this.isExpired(now);
  }

  revoke(now: Date = new Date()): void {
    this._isRevoked = true;
    this._revokedAt = now;
    this._updatedAt = now;
  }

  rotate(newReplacedBy: string, now: Date = new Date()): void {
    this._isRevoked = true;
    this._revokedAt = now;
    this._replacedBy = newReplacedBy;
    this._updatedAt = now;
  }
}
