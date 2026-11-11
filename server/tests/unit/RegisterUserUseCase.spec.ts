import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegisterUserUseCase } from "@application/use-cases/auth/implementations/RegisterUserUseCase";
import { type IUserRepository } from "@domain/repositories/IUserRepository";
import { type IPasswordService } from "@application/interfaces/IPasswordService";
import { UserAlreadyExistsError } from "@application/errors/UserAlreadyExistsError";
import { User } from "@domain/entities/User";
import { Email } from "@domain/value-objects/Email";
import { type RegisterUserRequestDTO } from "@application/dtos/auth/Request/RegisterUserRequestDTO";

describe("RegisterUserUseCase", () => {
  let userRepository: IUserRepository;
  let passwordService: IPasswordService;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    userRepository = {
      findByEmail: vi.fn(),
      save: vi.fn(),
    };

    passwordService = {
      hash: vi.fn(),
      compare: vi.fn(),
    };

    useCase = new RegisterUserUseCase(userRepository, passwordService);
  });

  const validRequest: RegisterUserRequestDTO = {
    name: "John Doe",
    email: "john.doe@example.com",
    password: "securePassword123",
  };

  it("1. Successfully registers a new user", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(passwordService.hash).mockResolvedValue("hashed_password_123");
    vi.mocked(userRepository.save).mockImplementation(async (user: User) => {
      return User.create({
        id: "generated-uuid-1",
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      });
    });

    const result = await useCase.execute(validRequest);

    expect(userRepository.findByEmail).toHaveBeenCalledWith(expect.any(Email));
    expect(passwordService.hash).toHaveBeenCalledWith("securePassword123");
    expect(userRepository.save).toHaveBeenCalledTimes(1);
    expect(result.id).toBe("generated-uuid-1");
    expect(result.email).toBe("john.doe@example.com");
    expect(result.name).toBe("John Doe");
  });

  it("2. Rejects an already registered email", async () => {
    const existingUser = User.create({
      id: "existing-id",
      name: "Existing User",
      email: Email.create(validRequest.email),
      passwordHash: "existing_hash",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser);

    await expect(useCase.execute(validRequest)).rejects.toThrow(UserAlreadyExistsError);
    expect(passwordService.hash).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it("3. Hashes the password before saving", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(passwordService.hash).mockResolvedValue("hashed_password_xyz");
    let savedPasswordHash = "";
    vi.mocked(userRepository.save).mockImplementation(async (user: User) => {
      savedPasswordHash = user.passwordHash;
      return User.create({
        id: "uuid-123",
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    await useCase.execute(validRequest);

    expect(passwordService.hash).toHaveBeenCalledWith("securePassword123");
    expect(savedPasswordHash).toBe("hashed_password_xyz");
  });

  it("4. Returns the expected response DTO", async () => {
    const fixedDate = new Date("2026-01-01T12:00:00.000Z");
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(passwordService.hash).mockResolvedValue("hashed_password_abc");
    vi.mocked(userRepository.save).mockResolvedValue(
      User.create({
        id: "user-456",
        name: "John Doe",
        email: Email.create("john.doe@example.com"),
        passwordHash: "hashed_password_abc",
        createdAt: fixedDate,
        updatedAt: fixedDate,
      }),
    );

    const response = await useCase.execute(validRequest);

    expect(response).toEqual({
      id: "user-456",
      name: "John Doe",
      email: "john.doe@example.com",
      createdAt: fixedDate,
    });
  });

  it("5. Does not expose the password hash", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(passwordService.hash).mockResolvedValue("super_secret_hash");
    vi.mocked(userRepository.save).mockResolvedValue(
      User.create({
        id: "user-789",
        name: "John Doe",
        email: Email.create("john.doe@example.com"),
        passwordHash: "super_secret_hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const response = await useCase.execute(validRequest);

    expect(response).not.toHaveProperty("password");
    expect(response).not.toHaveProperty("passwordHash");
    expect((response as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it("6. Propagates unexpected repository or password-service failures", async () => {
    vi.mocked(userRepository.findByEmail).mockRejectedValue(new Error("Database connection lost"));

    await expect(useCase.execute(validRequest)).rejects.toThrow("Database connection lost");

    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(passwordService.hash).mockRejectedValue(new Error("Bcrypt hashing failure"));

    await expect(useCase.execute(validRequest)).rejects.toThrow("Bcrypt hashing failure");
  });
});
