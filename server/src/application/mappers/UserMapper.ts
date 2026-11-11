import { type User } from "@domain/entities/User";
import { RegisterUserResponseDTO } from "@application/dtos/auth/Response/RegisterUserResponseDTO";

export class UserMapper {
  static toResponseDTO(user: User): RegisterUserResponseDTO {
    const response = new RegisterUserResponseDTO();
    response.id = user.id;
    response.name = user.name;
    response.email = user.email.getValue();
    response.createdAt = user.createdAt;
    return response;
  }
}
