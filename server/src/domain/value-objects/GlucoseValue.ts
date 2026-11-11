import { DomainError } from "../errors/DomainError";

export class GlucoseValue {
  private constructor(public readonly value: number) {}

  static create(value: number): GlucoseValue {
    if (
      value === undefined ||
      value === null ||
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      Number.isNaN(value)
    ) {
      throw new DomainError("Glucose value must be a whole number.");
    }

    if (value < 40 || value > 600) {
      throw new DomainError("Glucose value must be between 40 and 600 mg/dl.");
    }

    return new GlucoseValue(value);
  }

  getValue(): number {
    return this.value;
  }
}
