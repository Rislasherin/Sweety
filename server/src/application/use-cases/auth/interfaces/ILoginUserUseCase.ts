import { type LoginUserRequestDTO } from "@application/dtos/auth/Request/LoginUserRequestDTO";
import { type LoginUserResponseDTO } from "@application/dtos/auth/Response/LoginUserResponseDTO";

export interface ILoginUserUseCase {
  execute(request: LoginUserRequestDTO): Promise<LoginUserResponseDTO>;
}
