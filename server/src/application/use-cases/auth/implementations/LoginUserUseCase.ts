import crypto from "node:crypto";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { type IRefreshTokenRepository } from "@domain/repositories/IRefreshTokenRepository";
import { type IPasswordService } from "@application/interfaces/IPasswordService";
import { type ITokenService } from "@application/interfaces/ITokenService";
import { type IRefreshTokenService } from "@application/interfaces/IRefreshTokenService";
import { type LoginUserRequestDTO } from "@application/dtos/auth/Request/LoginUserRequestDTO";
import { LoginUserResponseDTO } from "@application/dtos/auth/Response/LoginUserResponseDTO";
import { Email } from "@domain/value-objects/Email";
import { RefreshToken } from "@domain/entities/RefreshToken";
import { InvalidCredentialsError } from "@application/errors/InvalidCredentialsError";
import { type ILoginUserUseCase } from "../interfaces/ILoginUserUseCase";

export class LoginUserUseCase implements ILoginUserUseCase {
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _passwordService: IPasswordService,
    private readonly _tokenService: ITokenService,
    private readonly _refreshTokenRepository?: IRefreshTokenRepository,
    private readonly _refreshTokenService?: IRefreshTokenService,
  ) {}

  async execute(request: LoginUserRequestDTO): Promise<LoginUserResponseDTO> {
    let email: Email;
    try {
      email = Email.create(request.email);
    } catch {
      throw new InvalidCredentialsError();
    }

    const user = await this._userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this._passwordService.compare(
      request.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const token = this._tokenService.generate({
      userId: user.id,
      email: user.email.getValue(),
    });

    const response = new LoginUserResponseDTO();
    response.id = user.id;
    response.name = user.name;
    response.email = user.email.getValue();
    response.token = token;

    if (this._refreshTokenRepository && this._refreshTokenService) {
      const rawRefreshToken = this._refreshTokenService.generateToken();
      const tokenHash = this._refreshTokenService.hashToken(rawRefreshToken);
      const refreshTokenEntity = new RefreshToken({
        id: crypto.randomUUID(),
        userId: user.id,
        tokenHash,
        familyId: crypto.randomUUID(),
        expiresAt: this._refreshTokenService.getExpirationDate(),
      });
      await this._refreshTokenRepository.save(refreshTokenEntity);
      response.refreshToken = rawRefreshToken;
    }

    return response;
  }
}
