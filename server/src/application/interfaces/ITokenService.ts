export interface TokenPayload {
  userId: string;
  email: string;
  jti?: string;
  type?: "access";
}

export interface ITokenService {
  generate(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}
