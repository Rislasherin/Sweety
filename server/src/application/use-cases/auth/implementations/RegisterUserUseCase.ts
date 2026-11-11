import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { type IPasswordService } from "@application/interfaces/IPasswordService";
import { type RegisterUserRequestDTO } from "@application/dtos/auth/Request/RegisterUserRequestDTO";
import { type RegisterUserResponseDTO } from "@application/dtos/auth/Response/RegisterUserResponseDTO";
import { Email } from "@domain/value-objects/Email";
import { User } from "@domain/entities/User";
import { UserAlreadyExistsError } from "@application/errors/UserAlreadyExistsError";
import { UserMapper } from "@application/mappers/UserMapper";
import { type IRegisterUserUseCase } from "../interfaces/IRegisterUserUseCase";

export class RegisterUserUseCase implements IRegisterUserUseCase {
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _passwordService: IPasswordService,
  ) {}

  async execute(request: RegisterUserRequestDTO): Promise<RegisterUserResponseDTO> {
    const email = Email.create(request.email);

    const existingUser = await this._userRepository.findByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    const passwordHash = await this._passwordService.hash(request.password);

    const user = User.create({
      name: request.name.trim(),
      email,
      passwordHash,
    });

    const savedUser = await this._userRepository.save(user);

    return UserMapper.toResponseDTO(savedUser);
  }
}
