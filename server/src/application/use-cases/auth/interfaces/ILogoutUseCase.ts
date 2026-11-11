export interface LogoutRequest {
  refreshToken?: string;
}

export interface ILogoutUseCase {
  execute(request: LogoutRequest): Promise<void>;
}
