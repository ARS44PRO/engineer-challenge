import type { PasswordResetTokenEntity } from "../../domain/entities/password-reset-token.entity";
import type { PasswordResetTokenDb } from "../../domain/entities/password-reset-token.entity";
import { ResetTokenHash } from "../../domain/value-objects/reset-token-hash";

export const PasswordResetTokenMapper = {
  toEntity(row: PasswordResetTokenDb): PasswordResetTokenEntity {
    return {
      id: row.id,
      userId: row.user_id,
      tokenHash: new ResetTokenHash(row.token_hash),
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      createdAt: row.created_at,
    };
  },

  toDatabase(entity: PasswordResetTokenEntity) {
    return {
      id: entity.id,
      user_id: entity.userId,
      token_hash: entity.tokenHash.value,
      expires_at: entity.expiresAt,
      used_at: entity.usedAt,
      created_at: entity.createdAt,
    };
  },
};
