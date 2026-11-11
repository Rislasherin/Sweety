export interface TokenPayload {
  userId: string;
  email: string;
}

export interface ITokenService {
  generate(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}
