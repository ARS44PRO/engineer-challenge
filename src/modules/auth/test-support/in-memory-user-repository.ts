import type { UserRepository } from "../application/ports/user-repository";
import type { UserEntity } from "../domain/entities/user.entity";
import type { Email } from "../domain/value-objects/email";
import type { PasswordHash } from "../domain/value-objects/password-hash";

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, UserEntity>();

  async findByEmail(email: Email): Promise<UserEntity | null> {
    for (const u of this.users.values()) {
      if (u.email.value === email.value) return u;
    }
    return null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) ?? null;
  }

  async save(user: UserEntity): Promise<void> {
    this.users.set(user.id, user);
  }

  async updatePasswordHash(
    userId: string,
    newHash: PasswordHash,
  ): Promise<void> {
    const existing = this.users.get(userId);
    if (!existing) throw new Error(`User not found: ${userId}`);
    this.users.set(userId, { ...existing, passwordHash: newHash });
  }
}
