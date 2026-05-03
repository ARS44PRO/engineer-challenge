import type { PasswordResetTokenRepository } from "../application/ports/password-reset-token-repository";
import type { PasswordResetTokenEntity } from "../domain/entities/password-reset-token.entity";
import type { ResetTokenHash } from "../domain/value-objects/reset-token-hash";

export class InMemoryPasswordResetTokenRepository
  implements PasswordResetTokenRepository
{
  public readonly tokens: PasswordResetTokenEntity[] = [];

  async save(entity: PasswordResetTokenEntity): Promise<void> {
    this.tokens.push(entity);
  }

  async findByHash(
    hash: ResetTokenHash,
  ): Promise<PasswordResetTokenEntity | null> {
    return (
      this.tokens.find((t) => t.tokenHash.value === hash.value) ?? null
    );
  }

  async markUsed(id: string, when: Date): Promise<void> {
    const idx = this.tokens.findIndex((t) => t.id === id);
    if (idx >= 0) {
      this.tokens[idx] = { ...this.tokens[idx], usedAt: when };
    }
  }

  async countRecentByUserId(userId: string, since: Date): Promise<number> {
    return this.tokens.filter(
      (t) => t.userId === userId && t.createdAt >= since,
    ).length;
  }
}
