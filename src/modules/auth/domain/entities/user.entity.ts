import { Email, PasswordHash } from "../value-objects";

export interface UserEntity {
  id: string;
  email: Email;
  passwordHash: PasswordHash;
  createdAt: Date;
}

export interface UserDb {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}
