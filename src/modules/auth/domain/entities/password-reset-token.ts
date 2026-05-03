import { randomUUID } from "crypto";
import { ResetToken } from "../value-objects/reset-token";
import type { ResetTokenHash } from "../value-objects/reset-token-hash";
import { ResetTokenAlreadyUsedError, ResetTokenExpiredError } from "../errors";
import type { PasswordResetTokenEntity } from "./password-reset-token.entity";

const TTL_MINUTES = 15;

export class PasswordResetToken {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tokenHash: ResetTokenHash,
    public readonly expiresAt: Date,
    public readonly usedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  static issue(userId: string): {
    entity: PasswordResetTokenEntity;
    rawToken: ResetToken;
  } {
    const rawToken = ResetToken.generate();
    const now = new Date();
    const entity = new PasswordResetToken(
      randomUUID(),
      userId,
      rawToken.hash(),
      new Date(now.getTime() + TTL_MINUTES * 60 * 1000),
      null,
      now,
    );
    return { entity, rawToken };
  }

  static restore(props: PasswordResetTokenEntity): PasswordResetToken {
    return new PasswordResetToken(
      props.id,
      props.userId,
      props.tokenHash,
      props.expiresAt,
      props.usedAt,
      props.createdAt,
    );
  }

  ensureUsable(now: Date): void {
    if (this.usedAt !== null) throw new ResetTokenAlreadyUsedError();
    if (this.expiresAt.getTime() <= now.getTime())
      throw new ResetTokenExpiredError();
  }
}
