import { Expose } from "class-transformer";

export class LoginUserResponseDTO {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  email!: string;

  @Expose()
  token!: string;

  refreshToken?: string;
}
