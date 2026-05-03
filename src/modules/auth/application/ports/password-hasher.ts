import type { Password } from "../../domain/value-objects/password";
import type { PasswordHash } from "../../domain/value-objects/password-hash";

export interface PasswordHasher {
  hash(password: Password): Promise<PasswordHash>;
  verify(password: string, hash: PasswordHash): Promise<boolean>;
}
