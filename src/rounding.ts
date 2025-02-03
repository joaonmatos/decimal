/**
 * Types of rounding available.
 */
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

/**
 * Types of rounding available as an enum.
 */
export const RoundingModes: {
  /**
   * Rounds half-even by default.
   * @see RoundingModes.HalfEven
   */
  readonly Default: RoundingMode;
  /**
   * Rounds toward positive infinity.
   */
  readonly Ceiling: RoundingMode;
  /**
   * Rounds toward negative infinity.
   */
  readonly Floor: RoundingMode;
  /**
   * Rounds away from zero.
   */
  readonly Up: RoundingMode;
  /**
   * Rounds towards zero.
   */
  readonly Down: RoundingMode;
  /**
   * Rounds towards closest valid value. Rounds the digit 5 away from zero.
   */
  readonly HalfUp: RoundingMode;
  /**
   * Rounds towards closest valid value. Rounds the digit 5 towards zero.
   */
  readonly HalfDown: RoundingMode;
  /**
   * Rounds towards closest valid value. Rounds the digit 5 towards the nearest even digit.
   */
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
