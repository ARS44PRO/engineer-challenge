export interface TokenIssuer {
  issueAccessToken(userId: string): string;
}
