import { type Request, type Response, type CookieOptions } from "express";
import { type IRegisterUserUseCase } from "@application/use-cases/auth/interfaces/IRegisterUserUseCase";
import { type ILoginUserUseCase } from "@application/use-cases/auth/interfaces/ILoginUserUseCase";
import { type IRefreshTokenUseCase } from "@application/use-cases/auth/interfaces/IRefreshTokenUseCase";
import { type ILogoutUseCase } from "@application/use-cases/auth/interfaces/ILogoutUseCase";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { type RegisterUserRequestDTO } from "@application/dtos/auth/Request/RegisterUserRequestDTO";
import { type LoginUserRequestDTO } from "@application/dtos/auth/Request/LoginUserRequestDTO";
import { asyncHandler } from "@shared/utils/asyncHandler.util";
import { sendSuccess } from "@shared/utils/response.util";
import { HttpStatus } from "@shared/constants/httpStatus.enum";
import { Messages } from "@shared/constants/messages.constants";
import { InvalidRefreshTokenError } from "@application/errors/InvalidRefreshTokenError";

export const REFRESH_COOKIE_NAME = "sweety_refresh_token";

export const getRefreshCookieOptions = (isProduction: boolean): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export const getClearCookieOptions = (isProduction: boolean): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "strict" : "lax",
  path: "/api/auth",
});

export class AuthController {
  constructor(
    private readonly _registerUserUseCase: IRegisterUserUseCase,
    private readonly _loginUserUseCase: ILoginUserUseCase,
    private readonly _refreshTokenUseCase?: IRefreshTokenUseCase,
    private readonly _logoutUseCase?: ILogoutUseCase,
    private readonly _userRepository?: IUserRepository,
    private readonly _isProduction: boolean = process.env.NODE_ENV === "production",
  ) {}

  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as RegisterUserRequestDTO;
    const result = await this._registerUserUseCase.execute(dto);

    sendSuccess(res, result, Messages.SUCCESS.REGISTRATION_SUCCESSFUL, HttpStatus.CREATED);
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as LoginUserRequestDTO;
    const result = await this._loginUserUseCase.execute(dto);

    if (result.refreshToken) {
      res.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        getRefreshCookieOptions(this._isProduction),
      );
    }

    // Exclude refreshToken from JSON payload
    const responseData = {
      id: result.id,
      name: result.name,
      email: result.email,
      token: result.token,
    };

    sendSuccess(res, responseData, Messages.SUCCESS.LOGIN_SUCCESSFUL, HttpStatus.OK);
  });

  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const rawRefreshToken =
      (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME] ||
      (req.body as { refreshToken?: string } | undefined)?.refreshToken;

    if (!rawRefreshToken || typeof rawRefreshToken !== "string") {
      throw new InvalidRefreshTokenError("Refresh token missing or invalid");
    }

    if (!this._refreshTokenUseCase) {
      throw new Error("Refresh token use case is not configured");
    }

    const result = await this._refreshTokenUseCase.execute({
      refreshToken: rawRefreshToken,
    });

    // Rotate refresh token in HttpOnly cookie
    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions(this._isProduction),
    );

    sendSuccess(
      res,
      {
        token: result.accessToken,
        user: result.user,
      },
      "Token refreshed successfully",
      HttpStatus.OK,
    );
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const rawRefreshToken =
      (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME] ||
      (req.body as { refreshToken?: string } | undefined)?.refreshToken;

    if (rawRefreshToken && this._logoutUseCase) {
      await this._logoutUseCase.execute({ refreshToken: rawRefreshToken });
    }

    res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions(this._isProduction));

    sendSuccess(res, null, "Logged out successfully", HttpStatus.OK);
  });

  me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, req.user, "Current user profile retrieved", HttpStatus.OK);
  });
}
