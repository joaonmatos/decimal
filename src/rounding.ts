export type RoundingMode =
  | "ceiling"
  | "floor"
  | "up"
  | "down"
  | "halfUp"
  | "halfDown"
  | "halfEven";

const Ceiling = "ceiling";
const Floor = "floor";
const Up = "up";
const Down = "down";
const HalfUp = "halfUp";
const HalfDown = "halfDown";
const HalfEven = "halfEven";

const Default = HalfEven;

export const RoundingModes: {
  readonly Default: RoundingMode;
  readonly Ceiling: RoundingMode;
  readonly Floor: RoundingMode;
  readonly Up: RoundingMode;
  readonly Down: RoundingMode;
  readonly HalfUp: RoundingMode;
  readonly HalfDown: RoundingMode;
  readonly HalfEven: RoundingMode;
} = {
  Default,
  Ceiling,
  Floor,
  Up,
  Down,
  HalfUp,
  HalfDown,
  HalfEven,
};
