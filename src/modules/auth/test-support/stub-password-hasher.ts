import type { PasswordHasher } from "../application/ports/password-hasher";
import type { Password } from "../domain/value-objects/password";
import { PasswordHash } from "../domain/value-objects/password-hash";

const PREFIX = "hashed:";

export class StubPasswordHasher implements PasswordHasher {
  async hash(password: Password): Promise<PasswordHash> {
    return new PasswordHash(`${PREFIX}${password.value}`);
  }

  async verify(raw: string, hash: PasswordHash): Promise<boolean> {
    return hash.value === `${PREFIX}${raw}`;
  }
}
