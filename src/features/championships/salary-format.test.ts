import { describe, expect, it } from "vitest";
import { formatSalaryUnits } from "./salary-format";

describe("salary formatting", () => {
  it("formats million-dollar values compactly", () => {
    expect(formatSalaryUnits(90, "M")).toBe("90M");
  });

  it("preserves configurable legacy labels", () => {
    expect(formatSalaryUnits(50, "moedas")).toBe("50 moedas");
  });
});
