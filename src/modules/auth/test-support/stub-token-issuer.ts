import type { TokenIssuer } from "../application/ports/token-issuer";

export class StubTokenIssuer implements TokenIssuer {
  issueAccessToken(userId: string): string {
    return `token-for-${userId}`;
  }
}
