import { describe, expect, it } from "vitest";
import {
  parsePastedSalaryValues,
  salaryCapPercentage,
  simulateSalarySwap,
} from "./salary-workspace-model";

describe("championship salary workspace", () => {
  it.each([
    ["10\n20\n30", [10, 20, 30]],
    ["10\t20\t30", [10, 20, 30]],
    ["10; 20; 30", [10, 20, 30]],
    ["0\n75\ninvalid\n-2\n3.5", [0, 75]],
    ["\n\t", []],
  ])("parses spreadsheet values from %j", (input, expected) => {
    expect(parsePastedSalaryValues(input)).toEqual(expected);
  });

  it.each([
    [0, 100, 0],
    [25, 100, 25],
    [100, 100, 100],
    [120, 100, 120],
    ["75", "150", 50],
    [20, 0, 0],
  ])("calculates cap usage for %j of %j", (usage, cap, expected) => {
    expect(salaryCapPercentage(usage, cap)).toBe(expected);
  });

  it("projects a compliant two-team swap", () => {
    expect(simulateSalarySwap(90, 40, 30, 100)).toEqual({
      usageAfter: 80,
      remaining: 20,
      overCap: false,
    });
  });

  it("projects an over-cap two-team swap without disguising the deficit", () => {
    expect(simulateSalarySwap("95", 20, 40, 100)).toEqual({
      usageAfter: 115,
      remaining: -15,
      overCap: true,
    });
  });
});
