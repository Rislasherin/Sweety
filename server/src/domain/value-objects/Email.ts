import { DomainError } from "../errors/DomainError";

export class Email {
  private constructor(private readonly value: string) {}

  static create(value: string): Email {
    const normalizedEmail = value.trim().toLowerCase();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      throw new DomainError("Invalid email address");
    }

    return new Email(normalizedEmail);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
