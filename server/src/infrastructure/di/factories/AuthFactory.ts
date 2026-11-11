import { type PrismaClient } from "@prisma/client";
import { type RequestHandler } from "express";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { type IRefreshTokenRepository } from "@domain/repositories/IRefreshTokenRepository";
import { type IPasswordService } from "@application/interfaces/IPasswordService";
import { type ITokenService } from "@application/interfaces/ITokenService";
import { type IRefreshTokenService } from "@application/interfaces/IRefreshTokenService";
import { type IRegisterUserUseCase } from "@application/use-cases/auth/interfaces/IRegisterUserUseCase";
import { type ILoginUserUseCase } from "@application/use-cases/auth/interfaces/ILoginUserUseCase";
import { type IRefreshTokenUseCase } from "@application/use-cases/auth/interfaces/IRefreshTokenUseCase";
import { type ILogoutUseCase } from "@application/use-cases/auth/interfaces/ILogoutUseCase";
import { PrismaRefreshTokenRepository } from "@infrastructure/repositories/PrismaRefreshTokenRepository";
import { InMemoryRefreshTokenRepository } from "@infrastructure/repositories/InMemoryRefreshTokenRepository";
import { BcryptService } from "@infrastructure/services/BcryptService";
import { JwtTokenService } from "@infrastructure/services/JwtTokenService";
import { CryptoRefreshTokenService } from "@infrastructure/services/CryptoRefreshTokenService";
import { RegisterUserUseCase } from "@application/use-cases/auth/implementations/RegisterUserUseCase";
import { LoginUserUseCase } from "@application/use-cases/auth/implementations/LoginUserUseCase";
import { RefreshTokenUseCase } from "@application/use-cases/auth/implementations/RefreshTokenUseCase";
import { LogoutUseCase } from "@application/use-cases/auth/implementations/LogoutUseCase";
import { AuthController } from "@presentation/controllers/AuthController";
import { createAuthMiddleware } from "@presentation/middlewares/authMiddleware";
import { env } from "@main/config/env";

export interface AuthFactoryOverrides {
  userRepository?: IUserRepository;
  refreshTokenRepository?: IRefreshTokenRepository;
  passwordService?: IPasswordService;
  accessTokenService?: ITokenService;
  refreshTokenService?: IRefreshTokenService;
  registerUserUseCase?: IRegisterUserUseCase;
  loginUserUseCase?: ILoginUserUseCase;
  refreshTokenUseCase?: IRefreshTokenUseCase;
  logoutUseCase?: ILogoutUseCase;
  authController?: AuthController;
  authMiddleware?: RequestHandler;
}

export class AuthFactory {
  private readonly _userRepository: IUserRepository;
  private readonly _refreshTokenRepository: IRefreshTokenRepository;
  private readonly _passwordService: IPasswordService;
  private readonly _accessTokenService: ITokenService;
  private readonly _refreshTokenService: IRefreshTokenService;
  private readonly _registerUserUseCase: IRegisterUserUseCase;
  private readonly _loginUserUseCase: ILoginUserUseCase;
  private readonly _refreshTokenUseCase: IRefreshTokenUseCase;
  private readonly _logoutUseCase: ILogoutUseCase;
  private readonly _authController: AuthController;
  private readonly _authMiddleware: RequestHandler;

  constructor(
    prisma: PrismaClient,
    sharedUserRepository: IUserRepository,
    overrides: AuthFactoryOverrides = {},
  ) {
    this._userRepository = overrides.userRepository ?? sharedUserRepository;
    this._refreshTokenRepository =
      overrides.refreshTokenRepository ??
      (overrides.userRepository
        ? new InMemoryRefreshTokenRepository()
        : new PrismaRefreshTokenRepository(prisma));
    this._passwordService = overrides.passwordService ?? new BcryptService();
    this._accessTokenService =
      overrides.accessTokenService ??
      new JwtTokenService({
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      });
    this._refreshTokenService = overrides.refreshTokenService ?? new CryptoRefreshTokenService();

    this._registerUserUseCase =
      overrides.registerUserUseCase ??
      new RegisterUserUseCase(this._userRepository, this._passwordService);

    this._loginUserUseCase =
      overrides.loginUserUseCase ??
      new LoginUserUseCase(
        this._userRepository,
        this._passwordService,
        this._accessTokenService,
        this._refreshTokenRepository,
        this._refreshTokenService,
      );

    this._refreshTokenUseCase =
      overrides.refreshTokenUseCase ??
      new RefreshTokenUseCase(
        this._userRepository,
        this._refreshTokenRepository,
        this._accessTokenService,
        this._refreshTokenService,
      );

    this._logoutUseCase =
      overrides.logoutUseCase ??
      new LogoutUseCase(this._refreshTokenRepository, this._refreshTokenService);

    this._authController =
      overrides.authController ??
      new AuthController(
        this._registerUserUseCase,
        this._loginUserUseCase,
        this._refreshTokenUseCase,
        this._logoutUseCase,
        this._userRepository,
        env.NODE_ENV === "production",
      );

    this._authMiddleware =
      overrides.authMiddleware ?? createAuthMiddleware(this._accessTokenService);
  }

  getUserRepository(): IUserRepository {
    return this._userRepository;
  }

  getRefreshTokenRepository(): IRefreshTokenRepository {
    return this._refreshTokenRepository;
  }

  getPasswordService(): IPasswordService {
    return this._passwordService;
  }

  getAccessTokenService(): ITokenService {
    return this._accessTokenService;
  }

  getRefreshTokenService(): IRefreshTokenService {
    return this._refreshTokenService;
  }

  getRegisterUserUseCase(): IRegisterUserUseCase {
    return this._registerUserUseCase;
  }

  getLoginUserUseCase(): ILoginUserUseCase {
    return this._loginUserUseCase;
  }

  getRefreshTokenUseCase(): IRefreshTokenUseCase {
    return this._refreshTokenUseCase;
  }

  getLogoutUseCase(): ILogoutUseCase {
    return this._logoutUseCase;
  }

  getAuthController(): AuthController {
    return this._authController;
  }

  getAuthMiddleware(): RequestHandler {
    return this._authMiddleware;
  }
}
