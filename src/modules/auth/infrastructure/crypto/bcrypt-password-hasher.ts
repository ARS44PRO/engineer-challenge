import bcrypt from "bcrypt";
import type { PasswordHasher } from "../../application/ports/password-hasher";
import { Password } from "../../domain/value-objects/password";
import { PasswordHash } from "../../domain/value-objects/password-hash";

export class BcryptPasswordHasher implements PasswordHasher {
  private readonly rounds: number;

  constructor(rounds = 12) {
    this.rounds = rounds;
  }

  async hash(password: Password): Promise<PasswordHash> {
    const value = await bcrypt.hash(password.value, this.rounds);
    return new PasswordHash(value);
  }

  async verify(password: string, hash: PasswordHash): Promise<boolean> {
    return bcrypt.compare(password, hash.value);
  }
}
