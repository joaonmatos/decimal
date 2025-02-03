/**
 * Types of rounding available.
 */
export enum RoundingMode {
  /**
   * Rounds toward positive infinity.
   */
  Ceiling = "ceiling",
  /**
   * Rounds toward negative infinity.
   */
  Floor = "floor",
  /**
   * Rounds away from zero.
   */
  Up = "up",
  /**
   * Rounds towards zero.
   */
  Down = "down",
  /**
   * Rounds towards closest value. Rounds the digit 5 away from zero.
   */
  HalfUp = "halfUp",
  /**
   * Rounds towards closest value. Rounds the digit 5 towards zero.
   */
  HalfDown = "halfDown",
  /**
   * Rounds towards closest value. Rounds the digit 5 towards the nearest even digit.
   */
  HalfEven = "halfEven",
}
