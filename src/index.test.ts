import { expect, test } from "vitest";
import { BigDecimal } from "./index";

test("BigDecimal is reexported", () => {
  expect(BigDecimal).toBeDefined();
});
