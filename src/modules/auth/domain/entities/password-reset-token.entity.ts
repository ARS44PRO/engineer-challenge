import type { ResetTokenHash } from "../value-objects/reset-token-hash";

export interface PasswordResetTokenEntity {
  id: string;
  userId: string;
  tokenHash: ResetTokenHash;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface PasswordResetTokenDb {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}
