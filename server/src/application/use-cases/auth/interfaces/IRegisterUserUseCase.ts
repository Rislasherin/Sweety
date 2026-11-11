import { type RegisterUserRequestDTO } from "@application/dtos/auth/Request/RegisterUserRequestDTO";
import { type RegisterUserResponseDTO } from "@application/dtos/auth/Response/RegisterUserResponseDTO";

export interface IRegisterUserUseCase {
  execute(request: RegisterUserRequestDTO): Promise<RegisterUserResponseDTO>;
}
