import { validate } from "email-validator";
import { InvalidEmailError } from "../errors";

export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!validate(normalized)) {
      throw new InvalidEmailError(raw);
    }
    return new Email(normalized);
  }
}
