import { expect, test } from "vitest";
import { BigDecimal, RoundingMode } from "./index";

test("BigDecimal is exported", () => {
  expect(BigDecimal).toBeDefined();
});

test("RoundingMode is exported", () => {
  expect(RoundingMode).toBeDefined();
});
