import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginUserUseCase } from "@application/use-cases/auth/implementations/LoginUserUseCase";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { type IPasswordService } from "@application/interfaces/IPasswordService";
import { type ITokenService } from "@application/interfaces/ITokenService";
import { InvalidCredentialsError } from "@application/errors/InvalidCredentialsError";
import { User } from "@domain/entities/User";
import { Email } from "@domain/value-objects/Email";
import { type LoginUserRequestDTO } from "@application/dtos/auth/Request/LoginUserRequestDTO";

describe("LoginUserUseCase Unit Tests", () => {
  let userRepository: IUserRepository;
  let passwordService: IPasswordService;
  let tokenService: ITokenService;
  let useCase: LoginUserUseCase;

  const existingUser = User.create({
    id: "user-uuid-1",
    name: "Jane Doe",
    email: Email.create("jane.doe@example.com"),
    passwordHash: "$2b$12$someHashedPassword",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  });

  const validRequest: LoginUserRequestDTO = {
    email: "jane.doe@example.com",
    password: "CorrectPassword123!",
  };

  beforeEach(() => {
    userRepository = {
      findByEmail: vi.fn(),
      save: vi.fn(),
    };

    passwordService = {
      hash: vi.fn(),
      compare: vi.fn(),
    };

    tokenService = {
      generate: vi.fn(),
      verify: vi.fn(),
    };

    useCase = new LoginUserUseCase(userRepository, passwordService, tokenService);
  });

  it("1. Successful login returns safe user details and access token", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser);
    vi.mocked(passwordService.compare).mockResolvedValue(true);
    vi.mocked(tokenService.generate).mockReturnValue("mocked-jwt-token");

    const result = await useCase.execute(validRequest);

    expect(userRepository.findByEmail).toHaveBeenCalledWith(expect.any(Email));
    expect(passwordService.compare).toHaveBeenCalledWith(
      "CorrectPassword123!",
      "$2b$12$someHashedPassword",
    );
    expect(tokenService.generate).toHaveBeenCalledWith({
      userId: "user-uuid-1",
      email: "jane.doe@example.com",
    });

    expect(result).toEqual({
      id: "user-uuid-1",
      name: "Jane Doe",
      email: "jane.doe@example.com",
      token: "mocked-jwt-token",
    });

    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("2. User not found rejects with generic InvalidCredentialsError", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(useCase.execute(validRequest)).rejects.toThrow(InvalidCredentialsError);
    expect(passwordService.compare).not.toHaveBeenCalled();
    expect(tokenService.generate).not.toHaveBeenCalled();
  });

  it("3. Incorrect password rejects with generic InvalidCredentialsError", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser);
    vi.mocked(passwordService.compare).mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: "jane.doe@example.com",
        password: "WrongPassword!",
      }),
    ).rejects.toThrow(InvalidCredentialsError);

    expect(tokenService.generate).not.toHaveBeenCalled();
  });

  it("4. Password verification failure propagates unexpected errors", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser);
    vi.mocked(passwordService.compare).mockRejectedValue(
      new Error("Bcrypt hashing runtime failure"),
    );

    await expect(useCase.execute(validRequest)).rejects.toThrow("Bcrypt hashing runtime failure");
    expect(tokenService.generate).not.toHaveBeenCalled();
  });

  it("5. Token generation generates token with user identity and email", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser);
    vi.mocked(passwordService.compare).mockResolvedValue(true);
    vi.mocked(tokenService.generate).mockReturnValue("signed-token-xyz");

    const result = await useCase.execute(validRequest);

    expect(tokenService.generate).toHaveBeenCalledWith({
      userId: existingUser.id,
      email: existingUser.email.getValue(),
    });
    expect(result.token).toBe("signed-token-xyz");
  });

  it("6. Token generation failure propagates unexpected errors", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser);
    vi.mocked(passwordService.compare).mockResolvedValue(true);
    vi.mocked(tokenService.generate).mockImplementation(() => {
      throw new Error("JWT sign failure");
    });

    await expect(useCase.execute(validRequest)).rejects.toThrow("JWT sign failure");
  });
});
