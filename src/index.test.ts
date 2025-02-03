import { expect, test } from "vitest";
import { BigDecimal, RoundingModes } from "./index";

test("BigDecimal is reexported", () => {
  expect(BigDecimal).toBeDefined();
});

test("RoundingModes are reexported", () => {
  expect(RoundingModes).toBeDefined();
});
