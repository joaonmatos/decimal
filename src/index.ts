/**
 * This module contains an implementation of arbitrary precision floating
 * point decimal arithmetic.
 *
 * @example
 * ```ts
 * import { BigDecimal } from "@joaonmatos/decimal";
 *
 * BigDecimal.valueOf(2).pow(200).toString(); // "1606938...835301376"
 *```
 *
 * @module
 */

export { BigDecimal } from "./decimal";
export { RoundingMode } from "./rounding";
