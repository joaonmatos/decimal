import { expect, test } from "vitest";
import { RoundingModes } from "./rounding";

test("each enum has the correct type", () => {
  expect(RoundingModes.Ceiling).toBe("ceiling");
  expect(RoundingModes.Floor).toBe("floor");
  expect(RoundingModes.HalfUp).toBe("halfUp");
  expect(RoundingModes.HalfDown).toBe("halfDown");
  expect(RoundingModes.HalfEven).toBe("halfEven");
  expect(RoundingModes.Up).toBe("up");
  expect(RoundingModes.Down).toBe("down");
});

test("default", () => {
  expect(RoundingModes.Default).toBe(RoundingModes.HalfEven);
});
