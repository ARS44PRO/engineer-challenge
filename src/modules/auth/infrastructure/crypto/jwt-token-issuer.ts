import jwt, { SignOptions } from "jsonwebtoken";
import type { TokenIssuer } from "../../application/ports/token-issuer";

export class JwtTokenIssuer implements TokenIssuer {
  constructor(
    private readonly secret: string,
    private readonly accessTtl: SignOptions["expiresIn"] = "15m",
  ) {}

  issueAccessToken(userId: string): string {
    return jwt.sign({ sub: userId }, this.secret, { expiresIn: this.accessTtl });
  }
}
