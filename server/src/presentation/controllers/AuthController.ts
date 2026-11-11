import { type Request, type Response } from "express";
import { type IRegisterUserUseCase } from "@application/use-cases/auth/interfaces/IRegisterUserUseCase";
import { type ILoginUserUseCase } from "@application/use-cases/auth/interfaces/ILoginUserUseCase";
import { type RegisterUserRequestDTO } from "@application/dtos/auth/Request/RegisterUserRequestDTO";
import { type LoginUserRequestDTO } from "@application/dtos/auth/Request/LoginUserRequestDTO";
import { asyncHandler } from "@shared/utils/asyncHandler.util";
import { sendSuccess } from "@shared/utils/response.util";
import { HttpStatus } from "@shared/constants/httpStatus.enum";
import { Messages } from "@shared/constants/messages.constants";

export class AuthController {
  constructor(
    private readonly _registerUserUseCase: IRegisterUserUseCase,
    private readonly _loginUserUseCase: ILoginUserUseCase,
  ) {}

  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as RegisterUserRequestDTO;
    const result = await this._registerUserUseCase.execute(dto);

    sendSuccess(res, result, Messages.SUCCESS.REGISTRATION_SUCCESSFUL, HttpStatus.CREATED);
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as LoginUserRequestDTO;
    const result = await this._loginUserUseCase.execute(dto);

    sendSuccess(res, result, Messages.SUCCESS.LOGIN_SUCCESSFUL, HttpStatus.OK);
  });

  me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, req.user, "Current user profile retrieved", HttpStatus.OK);
  });
}
