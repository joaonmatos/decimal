import { expect, test } from "vitest";
import { BigDecimal } from "./decimal.js";
import { RoundingModes } from "./rounding.js";

test("parse", () => {
  expect(BigDecimal.valueOf("1").number()).toBe(1);
  expect(BigDecimal.valueOf("1.25").number()).toBe(1.25);
  expect(BigDecimal.valueOf("1.3e2").number()).toBe(130);
  expect(BigDecimal.valueOf(1).number()).toBe(1);
  expect(BigDecimal.valueOf(10n).number()).toBe(10);
  expect(BigDecimal.valueOf("-2.25").number()).toBe(-2.25);
  // @ts-ignore
  expect(() => BigDecimal.valueOf(new Date())).toThrowError();
  expect(() => BigDecimal.valueOf(NaN)).toThrowError();
  expect(() => BigDecimal.valueOf("$$")).toThrowError();
});

test("equalValue", () => {
  const a = new BigDecimal(120n, -2);
  const b = new BigDecimal(12n, -1);
  const c = new BigDecimal(3n, 0);
  expect(a.equalValue(b)).toBe(true);
  expect(a.equalValue(c)).toBe(false);
});

test("add", () => {
  const a = BigDecimal.valueOf(1250);
  const b = BigDecimal.valueOf(320000);
  const sum = BigDecimal.valueOf(321250);
  expect(a.add(b).equals(sum)).toBe(true);
  expect(b.add(a).equals(sum)).toBe(true);
});

test("negate", () => {
  const a = BigDecimal.valueOf(1250);
  const b = BigDecimal.valueOf(-1250);
  expect(a.negate().equals(b)).toBe(true);
  expect(b.negate().equals(a)).toBe(true);
});

test("subtract", () => {
  const a = BigDecimal.TEN;
  const b = new BigDecimal(3n, 0);
  expect(a.subtract(b).equals(BigDecimal.valueOf(7))).toBe(true);
  expect(b.subtract(a).equals(BigDecimal.valueOf(-7))).toBe(true);
});

test("multiply", () => {
  expect(
    BigDecimal.valueOf(1.5)
      .multiply(BigDecimal.TWO)
      .equals(BigDecimal.valueOf(3)),
  ).toBe(true);
  expect(
    BigDecimal.valueOf(4)
      .multiply(BigDecimal.valueOf(0.125))
      .equals(BigDecimal.ZERO_DOT_FIVE),
  ).toBe(true);
});

test("divide", () => {
  expect(
    BigDecimal.valueOf(1.5)
      .divide(BigDecimal.TWO)
      .equals(BigDecimal.valueOf(0.75)),
  ).toBe(true);
  expect(
    BigDecimal.valueOf(4)
      .divide(BigDecimal.valueOf(0.125))
      .equals(BigDecimal.valueOf(32)),
  ).toBe(true);
  expect(() => BigDecimal.ZERO.divide(BigDecimal.ZERO)).toThrowError(
    "0/0 is undefined",
  );
  expect(() => BigDecimal.ONE.divide(BigDecimal.ZERO)).toThrowError(
    "Division by zero",
  );
});

test("pow", () => {
  expect(BigDecimal.valueOf(1.2).pow(4).number()).toBeCloseTo(2.0736);
  expect(BigDecimal.TWO.pow(16).number()).toBe(65536);
  expect(() => BigDecimal.TWO.pow(-2)).toThrowError();
});

test("sqrt", () => {
  expect(BigDecimal.TWO.sqrt().number()).toBeCloseTo(Math.SQRT2);
  expect(BigDecimal.valueOf(4).sqrt().number()).toBe(2);
  expect(() => BigDecimal.MINUS_ONE.sqrt()).toThrowError();
});

test("abs", () => {
  expect(BigDecimal.MINUS_ONE.abs().number()).toBe(1);
  expect(BigDecimal.ONE.abs().number()).toBe(1);
});

test("signum", () => {
  expect(BigDecimal.valueOf(-2).signum()).toBe(-1);
  expect(BigDecimal.ZERO.signum()).toBe(0);
  expect(BigDecimal.TWO.signum()).toBe(1);
});

test("toString", () => {
  expect(new BigDecimal(10325n, -3).toString()).toBe("10.325");
  expect(BigDecimal.TEN.toString()).toBe("10");
  expect(BigDecimal.ONE.toString()).toBe("1");
  expect(BigDecimal.valueOf("-2.2").toString()).toBe("-2.2");
});

test("scaleByPowerOfTen", () => {
  expect(
    BigDecimal.valueOf(1.5).scaleByPowerOfTen(1).equals(BigDecimal.valueOf(15)),
  ).toBe(true);
  expect(
    BigDecimal.valueOf(15)
      .scaleByPowerOfTen(-1)
      .equals(BigDecimal.valueOf(1.5)),
  ).toBe(true);
});

test("compareTo", () => {
  expect(BigDecimal.TWO.compareTo(BigDecimal.ONE)).toBe(1);
  expect(BigDecimal.ONE.compareTo(BigDecimal.TWO)).toBe(-1);
  expect(BigDecimal.ONE.compareTo(BigDecimal.ONE)).toBe(0);
  expect(BigDecimal.TWO.compareTo(BigDecimal.TEN)).toBe(-1);
});

test("min", () => {
  expect(BigDecimal.ONE.min(BigDecimal.TWO).number()).toBe(1);
  expect(BigDecimal.TWO.min(BigDecimal.ONE).number()).toBe(1);
});

test("max", () => {
  expect(BigDecimal.ONE.max(BigDecimal.TWO).number()).toBe(2);
  expect(BigDecimal.TWO.max(BigDecimal.ONE).number()).toBe(2);
});

test("round", () => {
  expect(BigDecimal.ZERO.round().number()).toBe(0);
});

test("round ceiling", () => {
  const a = { precision: 1, roundingMode: RoundingModes.Ceiling };
  const round = (n: string) => BigDecimal.valueOf(n).round(a).toString();
  expect(round("-2.25")).toBe("-2.2");
  expect(round("-2.18")).toBe("-2.1");
  expect(round("-2.15")).toBe("-2.1");
  expect(round("-2.13")).toBe("-2.1");
  expect(round("-2.1")).toBe("-2.1");
  expect(round("2.1")).toBe("2.1");
  expect(round("2.13")).toBe("2.2");
  expect(round("2.15")).toBe("2.2");
  expect(round("2.18")).toBe("2.2");
  expect(round("2.25")).toBe("2.3");
});

test("round floor", () => {
  const a = { precision: 1, roundingMode: RoundingModes.Floor };
  const round = (n: string) => BigDecimal.valueOf(n).round(a).toString();
  expect(round("-2.25")).toBe("-2.3");
  expect(round("-2.18")).toBe("-2.2");
  expect(round("-2.15")).toBe("-2.2");
  expect(round("-2.13")).toBe("-2.2");
  expect(round("-2.1")).toBe("-2.1");
  expect(round("2.1")).toBe("2.1");
  expect(round("2.13")).toBe("2.1");
  expect(round("2.15")).toBe("2.1");
  expect(round("2.18")).toBe("2.1");
  expect(round("2.25")).toBe("2.2");
});

test("round up", () => {
  const a = { precision: 1, roundingMode: RoundingModes.Up };
  const round = (n: string) => BigDecimal.valueOf(n).round(a).toString();
  expect(round("-2.25")).toBe("-2.3");
  expect(round("-2.18")).toBe("-2.2");
  expect(round("-2.15")).toBe("-2.2");
  expect(round("-2.13")).toBe("-2.2");
  expect(round("-2.1")).toBe("-2.1");
  expect(round("2.1")).toBe("2.1");
  expect(round("2.13")).toBe("2.2");
  expect(round("2.15")).toBe("2.2");
  expect(round("2.18")).toBe("2.2");
  expect(round("2.25")).toBe("2.3");
});

test("round down", () => {
  const a = { precision: 1, roundingMode: RoundingModes.Down };
  const round = (n: string) => BigDecimal.valueOf(n).round(a).toString();
  expect(round("-2.25")).toBe("-2.2");
  expect(round("-2.18")).toBe("-2.1");
  expect(round("-2.15")).toBe("-2.1");
  expect(round("-2.13")).toBe("-2.1");
  expect(round("-2.1")).toBe("-2.1");
  expect(round("2.1")).toBe("2.1");
  expect(round("2.13")).toBe("2.1");
  expect(round("2.15")).toBe("2.1");
  expect(round("2.18")).toBe("2.1");
  expect(round("2.25")).toBe("2.2");
});

test("round halfUp", () => {
  const a = { precision: 1, roundingMode: RoundingModes.HalfUp };
  const round = (n: string) => BigDecimal.valueOf(n).round(a).toString();
  expect(round("-2.25")).toBe("-2.3");
  expect(round("-2.18")).toBe("-2.2");
  expect(round("-2.15")).toBe("-2.2");
  expect(round("-2.13")).toBe("-2.1");
  expect(round("-2.1")).toBe("-2.1");
  expect(round("2.1")).toBe("2.1");
  expect(round("2.13")).toBe("2.1");
  expect(round("2.15")).toBe("2.2");
  expect(round("2.18")).toBe("2.2");
  expect(round("2.25")).toBe("2.3");
});

test("round halfDown", () => {
  const a = { precision: 1, roundingMode: RoundingModes.HalfDown };
  const round = (n: string) => BigDecimal.valueOf(n).round(a).toString();
  expect(round("-2.25")).toBe("-2.2");
  expect(round("-2.18")).toBe("-2.2");
  expect(round("-2.15")).toBe("-2.1");
  expect(round("-2.13")).toBe("-2.1");
  expect(round("-2.1")).toBe("-2.1");
  expect(round("2.1")).toBe("2.1");
  expect(round("2.13")).toBe("2.1");
  expect(round("2.15")).toBe("2.1");
  expect(round("2.18")).toBe("2.2");
  expect(round("2.25")).toBe("2.2");
});

test("round halfEven", () => {
  const a = { precision: 1, roundingMode: RoundingModes.HalfEven };
  const round = (n: string) => BigDecimal.valueOf(n).round(a).toString();
  expect(round("-2.25")).toBe("-2.2");
  expect(round("-2.18")).toBe("-2.2");
  expect(round("-2.15")).toBe("-2.2");
  expect(round("-2.13")).toBe("-2.1");
  expect(round("-2.1")).toBe("-2.1");
  expect(round("2.1")).toBe("2.1");
  expect(round("2.13")).toBe("2.1");
  expect(round("2.15")).toBe("2.2");
  expect(round("2.18")).toBe("2.2");
  expect(round("2.25")).toBe("2.2");
});
