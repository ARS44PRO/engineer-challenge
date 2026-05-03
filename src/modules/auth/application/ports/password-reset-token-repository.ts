import type { PasswordResetTokenEntity } from "../../domain/entities/password-reset-token.entity";
import type { ResetTokenHash } from "../../domain/value-objects/reset-token-hash";

export interface PasswordResetTokenRepository {
  save(entity: PasswordResetTokenEntity): Promise<void>;
  findByHash(hash: ResetTokenHash): Promise<PasswordResetTokenEntity | null>;
  markUsed(id: string, when: Date): Promise<void>;
  countRecentByUserId(userId: string, since: Date): Promise<number>;
}
