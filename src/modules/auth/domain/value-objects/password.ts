import { WeakPasswordError } from "../errors";

export class Password {
  private constructor(public readonly value: string) {}

  static create(raw: string): Password {
    if (raw.length < 8) throw new WeakPasswordError("at least 8 characters");
    if (raw.length > 128) throw new WeakPasswordError("at most 128 characters");
    if (!/[A-Z]/.test(raw)) throw new WeakPasswordError("at least one uppercase letter");
    if (!/[a-z]/.test(raw)) throw new WeakPasswordError("at least one lowercase letter");
    if (!/[0-9]/.test(raw)) throw new WeakPasswordError("at least one digit");
    return new Password(raw);
  }
}
