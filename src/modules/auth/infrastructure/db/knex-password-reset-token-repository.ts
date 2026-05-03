import { pgClient } from "../../../../infrastructure";
import type { PasswordResetTokenRepository } from "../../application/ports/password-reset-token-repository";
import type { PasswordResetTokenEntity } from "../../domain/entities/password-reset-token.entity";
import type { PasswordResetTokenDb } from "../../domain/entities/password-reset-token.entity";
import type { ResetTokenHash } from "../../domain/value-objects/reset-token-hash";
import { PasswordResetTokenMapper } from "./password-reset-token-mapper";

export class KnexPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(private readonly pgClient: pgClient) {}

  async save(entity: PasswordResetTokenEntity): Promise<void> {
    await this.pgClient<PasswordResetTokenDb>("password_reset_tokens").insert(
      PasswordResetTokenMapper.toDatabase(entity),
    );
  }

  async findByHash(
    hash: ResetTokenHash,
  ): Promise<PasswordResetTokenEntity | null> {
    const row = await this.pgClient<PasswordResetTokenDb>(
      "password_reset_tokens",
    )
      .where({ token_hash: hash.value })
      .first();
    return row ? PasswordResetTokenMapper.toEntity(row) : null;
  }

  async markUsed(id: string, when: Date): Promise<void> {
    await this.pgClient<PasswordResetTokenDb>("password_reset_tokens")
      .where({ id })
      .update({ used_at: when });
  }

  async countRecentByUserId(userId: string, since: Date): Promise<number> {
    const result = await this.pgClient<PasswordResetTokenDb>(
      "password_reset_tokens",
    )
      .where({ user_id: userId })
      .where("created_at", ">=", since)
      .count<{ count: string }[]>("* as count")
      .first();
    return Number(result?.count ?? 0);
  }
}
