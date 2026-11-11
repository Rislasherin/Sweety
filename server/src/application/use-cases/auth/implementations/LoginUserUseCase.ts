import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { type IPasswordService } from "@application/interfaces/IPasswordService";
import { type ITokenService } from "@application/interfaces/ITokenService";
import { type LoginUserRequestDTO } from "@application/dtos/auth/Request/LoginUserRequestDTO";
import { LoginUserResponseDTO } from "@application/dtos/auth/Response/LoginUserResponseDTO";
import { Email } from "@domain/value-objects/Email";
import { InvalidCredentialsError } from "@application/errors/InvalidCredentialsError";
import { type ILoginUserUseCase } from "../interfaces/ILoginUserUseCase";

export class LoginUserUseCase implements ILoginUserUseCase {
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _passwordService: IPasswordService,
    private readonly _tokenService: ITokenService,
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

    return response;
  }
}
