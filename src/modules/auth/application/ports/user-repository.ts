import { PasswordHash, UserEntity } from "../../domain";
import type { User } from "../../domain/entities/user";
import type { Email } from "../../domain/value-objects/email";

export interface UserRepository {
  findByEmail(email: Email): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  save(user: User): Promise<void>;
  updatePasswordHash(userId: string, newHash: PasswordHash): Promise<void>;
}
