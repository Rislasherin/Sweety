import { randomUUID } from "node:crypto";
import { type GlucoseValue } from "../value-objects/GlucoseValue";
import { type ReadingSlotType } from "../enums/ReadingSlotType";

export interface ReadingProps {
  id: string;
  userId: string;
  date: Date;
  slot: ReadingSlotType;
  value: GlucoseValue;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReadingProps {
  userId: string;
  date: Date;
  slot: ReadingSlotType;
  value: GlucoseValue;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Reading {
  private constructor(private readonly props: ReadingProps) {}

  static create(props: CreateReadingProps): Reading {
    const now = new Date();
    return new Reading({
      id: props.id ?? randomUUID(),
      userId: props.userId,
      date: props.date,
      slot: props.slot,
      value: props.value,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get date(): Date {
    return this.props.date;
  }

  get slot(): ReadingSlotType {
    return this.props.slot;
  }

  get value(): GlucoseValue {
    return this.props.value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(params: { date?: Date; slot?: ReadingSlotType; value?: GlucoseValue }): Reading {
    return new Reading({
      ...this.props,
      date: params.date ?? this.props.date,
      slot: params.slot ?? this.props.slot,
      value: params.value ?? this.props.value,
      updatedAt: new Date(),
    });
  }
}
