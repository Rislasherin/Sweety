import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterUserRequestDTO {
  @IsString()
  @IsNotEmpty({ message: "Name is required" })
  @MaxLength(100, {
    message: "Name cannot exceed 100 characters",
  })
  name!: string;

  @IsEmail({}, { message: "Please provide a valid email address" })
  @IsNotEmpty({ message: "Email is required" })
  @MaxLength(255, {
    message: "Email cannot exceed 255 characters",
  })
  email!: string;

  @IsString()
  @MinLength(8, {
    message: "Password must be at least 8 characters",
  })
  @MaxLength(72, {
    message: "Password cannot exceed 72 characters",
  })
  password!: string;
}
