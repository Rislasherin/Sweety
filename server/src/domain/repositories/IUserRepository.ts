import { type User } from "@domain/entities/User";
import { type Email } from "@domain/value-objects/Email";

export interface IUserRepository {
  findByEmail(email: Email): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
