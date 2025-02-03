import { RoundingMode } from "./rounding.js";

/**
 * Params for rounding operation.
 */
export type RoundingParams = {
  /**
   * How to round.
   */
  roundingMode?: RoundingMode;
  /**
   * How many decimal digits to round to.
   */
  precision?: number;
  /**
   * @private
   * Whether the input has been normalized already.
   */
  normalized?: boolean;
};

/**
 * Class representing an arbitrary precision decimal number.
 * The object has two components:
 * - one bigint serving as a base, storing significant digits
 * - one number serving as exponent, storing the number's magnitude
 * The value of a number is: significant * 10 ^ exponent
 */
export class BigDecimal {
  static readonly #SQRT_ROUNDS: number = 10;
  static readonly #PRECISION: number = 10;

  /**
   * -1
   */
  static readonly MINUS_ONE: BigDecimal = new BigDecimal(-1n, 0);
  /**
   * 0
   */
  static readonly ZERO: BigDecimal = new BigDecimal(0n, 0);
  /**
   * 0.5
   */
  static readonly ZERO_DOT_FIVE: BigDecimal = new BigDecimal(5n, -1);
  /**
   * 1
   */
  static readonly ONE: BigDecimal = new BigDecimal(1n, 0);
  /**
   * 2
   */
  static readonly TWO: BigDecimal = new BigDecimal(2n, 0);
  /**
   * 10
   */
  static readonly TEN: BigDecimal = new BigDecimal(1n, 1);

  /**
   * Significant bits of the number (the base that gets multiplied by a power of 10).
   */
  readonly significant: bigint;
  /**
   * Exponent of the number (the power of 10).
   */
  readonly exponent: number;

  /**
   * Build new BigDecimal from significant and exponent.
   * @param significant significant base digits
   * @param exponent how many powers of 10 to multiply the base
   */
  constructor(significant: bigint, exponent: number) {
    this.significant = significant;
    this.exponent = exponent;
  }

  /**
   * Parses and builds BigDecimal from string or number
   * @param value a value to convert into a BigDecimal
   * @returns BigDecimal
   */
  static valueOf(value: number | bigint | string): BigDecimal {
    if (typeof value === "number") {
      return BigDecimal.#valueOfNumber(value);
    } else if (typeof value === "bigint") {
      return new BigDecimal(value, 0).normalized();
    } else {
      return BigDecimal.#valueOfString(value);
    }
  }

  static #valueOfNumber(value: number): BigDecimal {
    if (!Number.isFinite(value)) {
      throw new Error("NaN and Infinite are not supported");
    }
    let significant = value;
    let exponent = 0;
    while (!Number.isInteger(significant)) {
      significant *= 10;
      exponent--;
    }
    return new BigDecimal(BigInt(significant), exponent).normalized();
  }

  static #valueOfString(value: string) {
    const pattern = /^(-?[0-9]+)(?:\.([0-9]+)(?:[eE](-?[0-9]+))?)?$/;
    const result = pattern.exec(value);
    if (result === null) {
      throw new Error("Invalid string");
    }
    const units = new BigDecimal(BigInt(result[1]!), 0);
    let decimals = result[2]
      ? new BigDecimal(BigInt(result[2]), -result[2].length)
      : new BigDecimal(0n, 0);
    if (units.signum() === -1) {
      decimals = decimals.negate();
    }
    const exponent = result[3] ? Number.parseInt(result[3]) : 0;
    return units.add(decimals).scaleByPowerOfTen(exponent).normalized();
  }

  /**
   * Approximation to a number. May lose precision.
   * @returns number
   */
  number(): number {
    const significant = Number(this.significant);
    return significant * 10 ** this.exponent;
  }

  /**
   * Compute sum of two BigDecimal objects
   * @param other other operand
   * @returns sum
   */
  add(other: BigDecimal): BigDecimal {
    const diff = this.exponent - other.exponent;
    if (diff < 0) {
      return other.add(this);
    }
    const significant =
      other.significant + this.significant * 10n ** BigInt(diff);
    const exponent = Math.min(this.exponent, other.exponent);
    return new BigDecimal(significant, exponent).normalized();
  }

  /**
   * Compute difference between two BigDecimal objects
   * @param other other operand
   * @returns difference
   */
  subtract(other: BigDecimal): BigDecimal {
    return this.add(other.negate());
  }

  /**
   * Compute the simetrical number of a BigDecimal
   * @returns negated number
   */
  negate(): BigDecimal {
    return new BigDecimal(-this.significant, this.exponent);
  }

  /**
   * Compute product of two BigDecimal objects
   * @param other other operand
   * @returns product
   */
  multiply(other: BigDecimal): BigDecimal {
    const significant = this.significant * other.significant;
    const exponent = this.exponent + other.exponent;
    return new BigDecimal(significant, exponent).normalized();
  }

  /**
   * Compute quotient of two BigDecimal objects
   * @param other other operand
   * @returns quotient
   */
  divide(other: BigDecimal): BigDecimal {
    if (other.significant === 0n) {
      if (this.significant === 0n) {
        throw new Error("0/0 is undefined");
      }
      throw new Error("Division by zero");
    }
    if (this.significant === 0n) {
      return new BigDecimal(0n, 0);
    }
    let thissignificant = this.significant;
    let thisExponent = this.exponent;
    for (let i = 0; i < 10 && thissignificant % other.significant !== 0n; i++) {
      thissignificant *= 10n;
      thisExponent--;
    }
    const significant = thissignificant / other.significant;
    const exponent = thisExponent - other.exponent;
    return new BigDecimal(significant, exponent).normalized();
  }

  /**
   * Returns a BigDecimal whose value is the integer part of the quotient (this / divisor) rounded down.
   * @param other value to divide by
   * @returns The integer part of this / other
   */
  divideToIntegralValue(other: BigDecimal): BigDecimal {
    return this.divide(other).round({
      precision: 0,
      roundingMode: RoundingMode.Down,
    });
  }

  /**
   * Returns a BigDecimal whose value is (this % divisor).
   * The remainder is given by this.subtract(this.divideToIntegralValue(divisor).multiply(divisor)). Note that this is not the modulo operation (the result can be negative).
   * @param other divisor
   * @returns remain
   */
  remainder(other: BigDecimal): BigDecimal {
    return this.subtract(this.divideToIntegralValue(other).multiply(other));
  }

  /**
   * Returns the integer part of the number. The sign will be the same as the original number, so that n.integralPart().add(n.decimalPart()) == n.
   * @returns the integer part of this
   */
  integralPart(): BigDecimal {
    if (this.significant < 0n) {
      return this.negate().integralPart().negate();
    }
    const normalized = this.normalized();
    if (normalized.exponent >= 0) {
      return normalized;
    } else {
      return new BigDecimal(
        normalized.significant / 10n ** BigInt(-normalized.exponent),
        0,
      );
    }
  }

  /**
   * Returns the decimal part of the number. The sign will be the same as the original number, so that n.integralPart().add(n.decimalPart()) == n.
   * @returns the decimal part of this
   */
  decimalPart(): BigDecimal {
    if (this.significant < 0n) {
      return this.negate().decimalPart().negate();
    }
    const normalized = this.normalized();
    if (normalized.exponent >= 0) {
      return BigDecimal.ZERO;
    } else {
      return new BigDecimal(
        normalized.significant % 10n ** BigInt(-normalized.exponent),
        normalized.exponent,
      );
    }
  }

  /**
   * Exponentiate object
   * @param exponent exponent
   * @returns exponentiation
   */
  pow(exponent: number): BigDecimal {
    if (exponent < 0) {
      throw new Error("Negative exponents are not supported");
    }
    const significant = this.significant ** BigInt(exponent);
    const scale = this.exponent * exponent;
    return new BigDecimal(significant, scale).normalized();
  }

  /**
   * Compute square root of a BigDecimal object.
   * Uses Newton's method.
   * @returns square root
   */
  sqrt(): BigDecimal {
    if (this.significant < 0n) {
      throw new Error("Negative numbers are not supported");
    }
    let guess = BigDecimal.valueOf(Math.sqrt(this.number()));
    for (let i = 0; i < BigDecimal.#SQRT_ROUNDS; i++) {
      guess = guess.subtract(
        guess.multiply(guess).subtract(this).divide(guess.add(guess)),
      );
    }
    return guess.normalized();
  }

  /**
   * Compute absolute value of BigDecimal
   * @returns absolute value
   */
  abs(): BigDecimal {
    if (this.significant < 0n) {
      return this.negate();
    } else {
      return this;
    }
  }

  /**
   * Indicates the sign (negative, zero, nonnegative) of a BigDecimal.
   * @returns -1, 0, 1, according to sign
   */
  signum(): number {
    if (this.significant < 0n) {
      return -1;
    } else if (this.significant === 0n) {
      return 0;
    } else {
      return 1;
    }
  }

  /**
   * Multiplies BigDecimal by a power of 10 (changes the exponent)
   * @param exponent exponent
   * @returns scaled number
   */
  scaleByPowerOfTen(exponent: number): BigDecimal {
    return new BigDecimal(
      this.significant,
      this.exponent + exponent,
    ).normalized();
  }

  /**
   * Rounds decimals to limit the minimum exponent.
   * @param props options
   * @returns rounded BigDecimal
   */
  round(props?: RoundingParams): BigDecimal {
    const {
      roundingMode = RoundingMode.HalfEven,
      precision = BigDecimal.#PRECISION,
      normalized = false,
    } = props ?? {};
    if (!normalized) {
      return this.normalized().round({
        roundingMode,
        precision,
        normalized: true,
      });
    }
    if (this.signum() === 0) {
      return BigDecimal.ZERO;
    }
    const excessExponent = -this.exponent - precision;
    if (excessExponent <= 0) {
      return this;
    }
    if (roundingMode === RoundingMode.Ceiling) {
      return this.#roundCeiling(precision).normalized();
    } else if (roundingMode === RoundingMode.Floor) {
      return this.#roundFloor(precision).normalized();
    } else if (roundingMode === RoundingMode.Up) {
      return this.#roundUp(precision).normalized();
    } else if (roundingMode === RoundingMode.Down) {
      return this.#roundDown(precision).normalized();
    } else if (roundingMode === RoundingMode.HalfUp) {
      return this.#roundHalfUp(precision).normalized();
    } else if (roundingMode === RoundingMode.HalfDown) {
      return this.#roundHalfDown(precision).normalized();
    } else {
      return this.#roundHalfEven(precision).normalized();
    }
  }

  #roundCeiling(precision: number): BigDecimal {
    if (this.signum() === -1) {
      const simetric = this.negate();
      const rounded = simetric.#roundFloor(precision);
      return rounded.negate();
    }
    const excessExponent = -this.exponent - precision;
    const modulo = 10n ** BigInt(excessExponent);
    const base = this.significant / modulo;
    return new BigDecimal(base + 1n, -precision);
  }

  #roundFloor(precision: number): BigDecimal {
    if (this.signum() === -1) {
      const simetric = this.negate();
      const rounded = simetric.#roundCeiling(precision);
      return rounded.negate();
    }
    const excessExponent = -this.exponent - precision;
    const modulo = 10n ** BigInt(excessExponent);
    const base = this.significant / modulo;
    return new BigDecimal(base, -precision);
  }

  #roundUp(precision: number): BigDecimal {
    if (this.signum() === -1) {
      const simetric = this.negate();
      const rounded = simetric.#roundUp(precision);
      return rounded.negate();
    }
    const excessExponent = -this.exponent - precision;
    const modulo = 10n ** BigInt(excessExponent);
    const base = this.significant / modulo;
    return new BigDecimal(base + 1n, -precision);
  }

  #roundDown(precision: number): BigDecimal {
    if (this.signum() === -1) {
      const simetric = this.negate();
      const rounded = simetric.#roundDown(precision);
      return rounded.negate();
    }
    const excessExponent = -this.exponent - precision;
    const modulo = 10n ** BigInt(excessExponent);
    const base = this.significant / modulo;
    return new BigDecimal(base, -precision);
  }

  #roundHalfUp(precision: number): BigDecimal {
    if (this.signum() === -1) {
      const simetric = this.negate();
      const rounded = simetric.#roundHalfUp(precision);
      return rounded.negate();
    }
    const excessExponent = -this.exponent - precision;
    const modulo = 10n ** BigInt(excessExponent);
    const base = this.significant / modulo;
    const remainder = (this.significant % modulo) / (modulo / 10n);
    if (remainder < 5n) {
      return new BigDecimal(base, -precision);
    } else {
      return new BigDecimal(base + 1n, -precision);
    }
  }

  #roundHalfDown(precision: number): BigDecimal {
    if (this.signum() === -1) {
      const simetric = this.negate();
      const rounded = simetric.#roundHalfDown(precision);
      return rounded.negate();
    }
    const excessExponent = -this.exponent - precision;
    const modulo = 10n ** BigInt(excessExponent);
    const base = this.significant / modulo;
    const remainder = (this.significant % modulo) / (modulo / 10n);
    if (remainder <= 5n) {
      return new BigDecimal(base, -precision);
    } else {
      return new BigDecimal(base + 1n, -precision);
    }
  }

  #roundHalfEven(precision: number): BigDecimal {
    if (this.signum() === -1) {
      const simetric = this.negate();
      const rounded = simetric.#roundHalfEven(precision);
      return rounded.negate();
    }
    const excessExponent = -this.exponent - precision;
    const modulo = 10n ** BigInt(excessExponent);
    const base = this.significant / modulo;
    const remainder = (this.significant % modulo) / (modulo / 10n);
    if (remainder < 5n) {
      return new BigDecimal(base, -precision);
    } else if (remainder === 5n) {
      if (base % 2n === 0n) {
        return new BigDecimal(base, -precision);
      } else {
        return new BigDecimal(base + 1n, -precision);
      }
    } else {
      return new BigDecimal(base + 1n, -precision);
    }
  }

  /**
   * Trims unneeded zeros off the end of the internal representation.
   * @returns normalized identity
   */
  normalized(): BigDecimal {
    let significant = this.significant;
    let exponent = this.exponent;
    if (significant === 0n) {
      return new BigDecimal(0n, 0);
    }
    while (significant % 10n === 0n) {
      significant /= 10n;
      exponent++;
    }
    return new BigDecimal(significant, exponent);
  }

  /**
   * Render to a string.
   * @returns string representation
   */
  toString(): string {
    const sign = this.significant < 0n ? "-" : "";
    const numbers = this.significant.toString().replace("-", "");
    if (this.exponent > 0) {
      return sign + numbers.padEnd(this.exponent + numbers.length, "0");
    } else if (this.exponent === 0) {
      return sign + numbers;
    } else {
      const units = numbers.substring(0, numbers.length + this.exponent);
      const decimals = numbers.substring(numbers.length + this.exponent);
      return `${sign}${units}.${decimals}`;
    }
  }

  /**
   * Compares two BigDecimal objects after normalizing their exponentiation.
   * @param other other
   * @returns -1, 0, 1, if smaller, same or bigger magnitude
   */
  compareTo(other: BigDecimal): number {
    let subject = this.normalized();
    const object = other.normalized();
    const diff = subject.exponent - object.exponent;
    if (diff < 0) {
      return -object.compareTo(subject);
    }
    subject = new BigDecimal(
      subject.significant * 10n ** BigInt(diff),
      subject.exponent - diff,
    );
    if (subject.significant < object.significant) {
      return -1;
    } else if (subject.significant === object.significant) {
      return 0;
    } else {
      return 1;
    }
  }

  /**
   * Component-wise equality. Does not account for equivalent representations with different exponents.
   * @param other other
   * @returns if they have the same components
   */
  equals(other: BigDecimal): boolean {
    return (
      this.significant === other.significant && this.exponent === other.exponent
    );
  }

  /**
   * Returns the smaller of two BigDecimal objects.
   * @param other other
   * @returns smaller
   */
  min(other: BigDecimal): BigDecimal {
    return this.compareTo(other) <= 0 ? this : other;
  }

  /**
   * Returns the larger of two BigDecimal objects.
   * @param other other
   * @returns larger
   */
  max(other: BigDecimal): BigDecimal {
    return this.compareTo(other) >= 0 ? this : other;
  }
}
