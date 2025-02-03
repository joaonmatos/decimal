import { expect, test } from "vitest";
import { RoundingMode } from "./rounding";

test("each enum has the correct type", () => {
  expect(RoundingMode.Ceiling).toBe("ceiling");
  expect(RoundingMode.Floor).toBe("floor");
  expect(RoundingMode.HalfUp).toBe("halfUp");
  expect(RoundingMode.HalfDown).toBe("halfDown");
  expect(RoundingMode.HalfEven).toBe("halfEven");
  expect(RoundingMode.Up).toBe("up");
  expect(RoundingMode.Down).toBe("down");
});
