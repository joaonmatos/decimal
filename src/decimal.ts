import { RoundingModes, type RoundingMode } from "./rounding.js";

export type RoundProps = {
  roundingMode?: RoundingMode;
  precision?: number;
  normalized?: boolean;
};

export class BigDecimal {
  static readonly #SQRT_ROUNDS: number = 10;
  static readonly #PRECISION: number = 10;

  static readonly MINUS_ONE: BigDecimal = new BigDecimal(-1n, 0);
  static readonly ZERO: BigDecimal = new BigDecimal(0n, 0);
  static readonly ZERO_DOT_FIVE: BigDecimal = new BigDecimal(5n, -1);
  static readonly ONE: BigDecimal = new BigDecimal(1n, 0);
  static readonly TWO: BigDecimal = new BigDecimal(2n, 0);
  static readonly TEN: BigDecimal = new BigDecimal(1n, 1);

  readonly mantissa: bigint;
  readonly exponent: number;

  constructor(mantissa: bigint, exponent: number) {
    this.mantissa = mantissa;
    this.exponent = exponent;
  }

  static valueOf(value: number | bigint | string): BigDecimal {
    if (typeof value === "number") {
      return BigDecimal.#valueOfNumber(value);
    } else if (typeof value === "bigint") {
      return new BigDecimal(value, 0).normalized();
    } else if (typeof value === "string") {
      return BigDecimal.#valueOfString(value);
    } else {
      throw new Error("Invalid value");
    }
  }

  static #valueOfNumber(value: number): BigDecimal {
    if (!Number.isFinite(value)) {
      throw new Error("NaN and Infinite are not supported");
    }
    let mantissa = value;
    let exponent = 0;
    while (!Number.isInteger(mantissa)) {
      mantissa *= 10;
      exponent--;
    }
    return new BigDecimal(BigInt(mantissa), exponent).normalized();
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

  number(): number {
    const mantissa = Number(this.mantissa);
    return mantissa * 10 ** this.exponent;
  }

  add(other: BigDecimal): BigDecimal {
    const diff = this.exponent - other.exponent;
    if (diff < 0) {
      return other.add(this);
    }
    const mantissa = other.mantissa + this.mantissa * 10n ** BigInt(diff);
    const exponent = Math.min(this.exponent, other.exponent);
    return new BigDecimal(mantissa, exponent).normalized();
  }

  subtract(other: BigDecimal): BigDecimal {
    return this.add(other.negate());
  }

  negate(): BigDecimal {
    return new BigDecimal(-this.mantissa, this.exponent);
  }

  multiply(other: BigDecimal): BigDecimal {
    const mantissa = this.mantissa * other.mantissa;
    const exponent = this.exponent + other.exponent;
    return new BigDecimal(mantissa, exponent).normalized();
  }

  divide(other: BigDecimal): BigDecimal {
    if (other.mantissa === 0n) {
      if (this.mantissa === 0n) {
        throw new Error("0/0 is undefined");
      }
      throw new Error("Division by zero");
    }
    if (this.mantissa === 0n) {
      return new BigDecimal(0n, 0);
    }
    let thisMantissa = this.mantissa;
    let thisExponent = this.exponent;
    for (let i = 0; i < 10 && thisMantissa % other.mantissa !== 0n; i++) {
      thisMantissa *= 10n;
      thisExponent--;
    }
    const mantissa = thisMantissa / other.mantissa;
    const exponent = thisExponent - other.exponent;
    return new BigDecimal(mantissa, exponent).normalized();
  }

  pow(exponent: number): BigDecimal {
    if (exponent < 0) {
      throw new Error("Negative exponents are not supported");
    }
    const mantissa = this.mantissa ** BigInt(exponent);
    const scale = this.exponent * exponent;
    return new BigDecimal(mantissa, scale).normalized();
  }

  sqrt(): BigDecimal {
    if (this.mantissa < 0n) {
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

  abs(): BigDecimal {
    if (this.mantissa < 0n) {
      return this.negate();
    } else {
      return this;
    }
  }

  signum(): number {
    if (this.mantissa < 0n) {
      return -1;
    } else if (this.mantissa === 0n) {
      return 0;
    } else {
      return 1;
    }
  }

  scaleByPowerOfTen(exponent: number): BigDecimal {
    return new BigDecimal(this.mantissa, this.exponent + exponent).normalized();
  }

  round(props?: RoundProps): BigDecimal {
    const {
      roundingMode = RoundingModes.Default,
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
    if (roundingMode === "ceiling") {
      return this.#roundCeiling(precision).normalized();
    } else if (roundingMode === "floor") {
      return this.#roundFloor(precision).normalized();
    } else if (roundingMode === "up") {
      return this.#roundUp(precision).normalized();
    } else if (roundingMode === "down") {
      return this.#roundDown(precision).normalized();
    } else if (roundingMode === "halfUp") {
      return this.#roundHalfUp(precision).normalized();
    } else if (roundingMode === "halfDown") {
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
    const base = this.mantissa / modulo;
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
    const base = this.mantissa / modulo;
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
    const base = this.mantissa / modulo;
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
    const base = this.mantissa / modulo;
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
    const base = this.mantissa / modulo;
    const remainder = (this.mantissa % modulo) / (modulo / 10n);
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
    const base = this.mantissa / modulo;
    const remainder = (this.mantissa % modulo) / (modulo / 10n);
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
    const base = this.mantissa / modulo;
    const remainder = (this.mantissa % modulo) / (modulo / 10n);
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

  normalized(): BigDecimal {
    let mantissa = this.mantissa;
    let exponent = this.exponent;
    if (mantissa === 0n) {
      return new BigDecimal(0n, 0);
    }
    while (mantissa % 10n === 0n) {
      mantissa /= 10n;
      exponent++;
    }
    return new BigDecimal(mantissa, exponent);
  }

  toString(): string {
    const sign = this.mantissa < 0n ? "-" : "";
    const numbers = this.mantissa.toString().replace("-", "");
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

  compareTo(other: BigDecimal): number {
    let subject = this.normalized();
    const object = other.normalized();
    const diff = subject.exponent - object.exponent;
    if (diff < 0) {
      return -object.compareTo(subject);
    }
    subject = new BigDecimal(
      subject.mantissa * 10n ** BigInt(diff),
      subject.exponent - diff,
    );
    if (subject.mantissa < object.mantissa) {
      return -1;
    } else if (subject.mantissa === object.mantissa) {
      return 0;
    } else {
      return 1;
    }
  }

  equalValue(other: BigDecimal): boolean {
    return this.normalized().equals(other.normalized());
  }

  equals(other: BigDecimal): boolean {
    return this.mantissa === other.mantissa && this.exponent === other.exponent;
  }

  min(other: BigDecimal): BigDecimal {
    return this.compareTo(other) <= 0 ? this : other;
  }

  max(other: BigDecimal): BigDecimal {
    return this.compareTo(other) >= 0 ? this : other;
  }
}
