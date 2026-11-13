export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface IRefreshTokenUseCase {
  execute(request: RefreshTokenRequest): Promise<RefreshTokenResult>;
}
