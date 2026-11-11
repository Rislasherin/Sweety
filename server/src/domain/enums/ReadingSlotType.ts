export enum ReadingSlotType {
  MORNING = "MORNING",
  AFTER_BREAKFAST = "AFTER_BREAKFAST",
  AFTER_LUNCH = "AFTER_LUNCH",
  AFTER_DINNER = "AFTER_DINNER",
}

export const READING_SLOT_ORDER: Record<ReadingSlotType, number> = {
  [ReadingSlotType.MORNING]: 1,
  [ReadingSlotType.AFTER_BREAKFAST]: 2,
  [ReadingSlotType.AFTER_LUNCH]: 3,
  [ReadingSlotType.AFTER_DINNER]: 4,
};
