import { randomBytes, createHash } from "crypto";
import { InvalidResetTokenError } from "../errors";
import { ResetTokenHash } from "./reset-token-hash";

const HEX_64 = /^[a-f0-9]{64}$/;

export class ResetToken {
  private constructor(public readonly value: string) {}

  static generate(): ResetToken {
    return new ResetToken(randomBytes(32).toString("hex"));
  }

  static fromRaw(raw: string): ResetToken {
    if (!HEX_64.test(raw)) throw new InvalidResetTokenError();
    return new ResetToken(raw);
  }

  hash(): ResetTokenHash {
    return new ResetTokenHash(
      createHash("sha256").update(this.value).digest("hex"),
    );
  }
}
